import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { today, useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { answer, insights } from '../lib/assistant';
import type { Answer } from '../lib/assistant';
import { AIError, aiErrorMessage, askAI, buildContext, fileToImage } from '../lib/ai';
import type { AIExpense, AIMessage, AIProduct } from '../lib/ai';
import { MODULE_HELP } from '../lib/guide';
import { EXPENSE_KEYS } from '../lib/chart';
import type { AccountKey } from '../lib/chart';
import type { PaymentMethod } from '../lib/types';
import { EXPENSE_LABEL } from '../lib/expenses';
import { IconAlert, IconCheck, IconChevronRight, IconSend, IconSparkle } from './Icons';
import { t } from '../lib/i18n';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  facts?: Answer['facts'];
  products?: AIProduct[];
  expense?: AIExpense | null;
  goto?: string | null;
  imageName?: string;
  local?: boolean;
}

const GENERIC = [
  "Quel est mon chiffre d'affaires ce mois ?",
  "Combien j'ai dépensé cette semaine ?",
  "Qui me doit de l'argent ?",
  'Quel produit se vend le mieux ?',
  'Explique-moi cet écran',
];

/**
 * Le même chat partout (tiroir flottant et page Assistant) :
 * IA Gemini quand la personne est connectée, moteur local sinon ou en secours.
 */
export default function AssistantChat({ compact = false }: { compact?: boolean }) {
  const { db, saveProduct, addExpense } = useStore();
  const { user } = useCollab();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingImage, setPendingImage] = useState<{ mime: string; data: string; name: string } | null>(null);
  const counter = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const help = MODULE_HELP[pathname];
  const tips = insights(db);
  const questions = help?.questions.length ? [...help.questions, 'Explique-moi cet écran'] : GENERIC;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q && !pendingImage) return;
    const image = pendingImage;
    setPendingImage(null);
    setInput('');
    setNotice('');
    const userMsg: Message = { id: ++counter.current, role: 'user', text: q || t('Voici une photo.'), imageName: image?.name };
    const history = [...messages, userMsg];
    setMessages(history);

    if (user) {
      setBusy(true);
      try {
        const payload: AIMessage[] = history.map((m) => ({ role: m.role, text: m.text }));
        if (image) payload[payload.length - 1].image = { mime: image.mime, data: image.data };
        const result = await askAI(payload, buildContext(db, pathname));
        setMessages((m) => [
          ...m,
          { id: ++counter.current, role: 'assistant', text: result.text, products: result.products, expense: result.expense, goto: result.goto },
        ]);
        setBusy(false);
        return;
      } catch (e) {
        setBusy(false);
        setNotice(t(aiErrorMessage(e instanceof AIError ? e.code : 'unknown')));
      }
    } else if (image) {
      setNotice(t('La lecture de photos demande un compte connecté. Je réponds avec le moteur local.'));
    }

    const a = answer(db, q || 'explique');
    const explain = /expli|cet écran|c'est quoi|ça sert/i.test(q) && help
      ? `${t(help.what)} ${t(help.when)} ${t('Exemple :')} ${t(help.example)}`
      : null;
    setMessages((m) => [
      ...m,
      { id: ++counter.current, role: 'assistant', text: explain ?? a.text, facts: explain ? undefined : a.facts, local: true },
    ]);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const img = await fileToImage(file);
      setPendingImage({ ...img, name: file.name });
    } catch {
      setNotice(t('Impossible de lire cette image.'));
    }
  }

  function importProducts(products: AIProduct[], msgId: number) {
    for (const p of products) {
      saveProduct({
        name: p.name,
        sku: '',
        barcode: '',
        category: p.category ?? '',
        brand: '',
        price: Math.round(p.price * factorOf(db.company.currency)),
        cost: Math.round((p.cost ?? 0) * factorOf(db.company.currency)),
        stock: p.stock ?? 0,
        reorderPoint: 0,
        unit: 'pièce',
      });
    }
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, products: [] } : x)));
    setMessages((m) => [...m, { id: ++counter.current, role: 'assistant', text: t('{n} produit(s) importé(s) dans votre catalogue.', { n: products.length }), local: true }]);
  }

  /** La dépense lue sur la photo n'est enregistrée qu'après confirmation. */
  function saveExpense(e: AIExpense, msgId: number) {
    const key = (EXPENSE_KEYS as string[]).includes(e.category) ? (e.category as AccountKey) : 'MISC_EXPENSE';
    const methods: PaymentMethod[] = ['CASH', 'MOBILE', 'CARD', 'BANK'];
    const method = methods.includes(e.method as PaymentMethod) ? (e.method as PaymentMethod) : 'CASH';
    addExpense({
      date: /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : today(),
      category: t(EXPENSE_LABEL[key]),
      accountKey: key,
      description: [e.supplier, e.description].filter(Boolean).join(' — '),
      amount: Math.round(e.amount * factorOf(db.company.currency)),
      method,
    });
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, expense: null } : x)));
    setMessages((m) => [...m, { id: ++counter.current, role: 'assistant', text: t('Dépense enregistrée. Vous pouvez la retrouver dans « Dépenses ».'), local: true, goto: '/depenses' }]);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex-1 space-y-4 overflow-y-auto scrollbar-thin ${compact ? 'px-5 py-4' : 'py-2'}`}>
        {help && (
          <div className="rounded-card bg-base p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('Cet écran :')} {t(help.title)}</div>
            <p className="mt-1 text-caption text-ink">{t(help.what)}</p>
            <p className="mt-1.5 text-caption text-muted">
              <span className="font-semibold text-ink">{t('Quand ?')} </span>
              {t(help.when)}
            </p>
          </div>
        )}

        {messages.length === 0 && tips.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('À surveiller')}</div>
            <ul className="space-y-1.5">
              {tips.slice(0, 3).map((t, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 rounded-input px-3 py-2 text-caption text-ink ${
                    t.tone === 'good' ? 'bg-teal-light' : t.tone === 'warn' ? 'bg-[#FDF6E3]' : 'bg-[#FDEDED]'
                  }`}
                >
                  <span className={t.tone === 'good' ? 'text-teal' : t.tone === 'warn' ? 'text-[#B8860B]' : 'text-[#D14343]'}>
                    {t.tone === 'good' ? <IconCheck className="h-4 w-4" /> : <IconAlert className="h-4 w-4" />}
                  </span>
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.length === 0 && !user && (
          <p className="rounded-input border border-hairline px-3 py-2 text-caption text-muted">
            {t('Sans compte, je réponds avec un moteur local limité aux questions courantes. Connectez-vous pour l’assistant IA complet (dictée, photos, explications libres).')}
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[88%] rounded-card px-4 py-3 ${m.role === 'user' ? 'bg-teal text-white' : 'bg-base'}`}>
              {m.imageName && <div className="mb-1 text-[11px] opacity-80">📷 {m.imageName}</div>}
              <p className="whitespace-pre-wrap text-caption leading-relaxed sm:text-body">{m.text}</p>
              {m.facts && m.facts.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-black/10 pt-2 text-caption">
                  {m.facts.map((f, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="opacity-70">{f.label}</span>
                      <span className="font-semibold num">{f.value}</span>
                    </li>
                  ))}
                </ul>
              )}
              {m.products && m.products.length > 0 && (
                <div className="mt-3 rounded-input border border-hairline bg-white p-3">
                  <div className="text-caption font-semibold text-ink">{m.products.length} {t('produit(s) reconnu(s)')}</div>
                  <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[12px] text-muted scrollbar-thin">
                    {m.products.map((p, i) => (
                      <li key={i}>
                        {p.name} — {p.price}
                        {p.stock ? ` · stock ${p.stock}` : ''}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => importProducts(m.products!, m.id)} className="btn-primary mt-2 w-full py-2 text-caption">
                    {t('Ajouter au catalogue')}
                  </button>
                </div>
              )}
              {m.expense && m.expense.amount > 0 && (
                <div className="mt-3 rounded-input border border-hairline bg-white p-3">
                  <div className="text-caption font-semibold text-ink">{t('Dépense lue sur le document')}</div>
                  <ul className="mt-1 space-y-0.5 text-[12px] text-muted">
                    <li>{t('Montant')} : <span className="font-semibold text-ink num">{m.expense.amount}</span> {db.company.currency}</li>
                    {m.expense.date && <li>{t('Date')} : {m.expense.date}</li>}
                    {m.expense.supplier && <li>{t('Fournisseur')} : {m.expense.supplier}</li>}
                    {m.expense.description && <li>{m.expense.description}</li>}
                  </ul>
                  <button onClick={() => saveExpense(m.expense!, m.id)} className="btn-primary mt-2 w-full py-2 text-caption">
                    {t('Enregistrer cette dépense')}
                  </button>
                  <button onClick={() => navigate('/rattrapage')} className="btn-ghost mt-1.5 w-full py-2 text-caption">
                    {t('Corriger avant d’enregistrer')}
                  </button>
                </div>
              )}
              {m.goto && (
                <button onClick={() => navigate(m.goto!)} className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-teal">
                  {t('Ouvrir')} <IconChevronRight className="h-4 w-4" />
                </button>
              )}
              {m.local && user && <div className="mt-1 text-[10px] text-muted">{t('moteur local')}</div>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-card bg-base px-4 py-3 text-caption text-muted">
              <span className="inline-flex items-center gap-2">
                <IconSparkle className="h-4 w-4 animate-pulse text-teal" />
                {t('Je regarde vos chiffres…')}
              </span>
            </div>
          </div>
        )}
        {notice && <p className="rounded-input bg-[#FDF6E3] px-3 py-2 text-caption text-ink">{notice}</p>}
        <div ref={bottom} />
      </div>

      <div className={`border-t border-hairline ${compact ? 'px-5 py-3' : 'pt-4'}`}>
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {questions.map((q) => (
            <button
              key={q}
              onClick={() => void ask(q)}
              className="shrink-0 rounded-pill border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-teal hover:text-teal"
            >
              {t(q)}
            </button>
          ))}
        </div>
        {pendingImage && (
          <div className="mb-2 flex items-center justify-between rounded-input bg-base px-3 py-2 text-caption">
            <span>📷 {pendingImage.name} {t('— prête à envoyer')}</span>
            <button onClick={() => setPendingImage(null)} className="font-semibold text-muted">
              {t('Retirer')}
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="flex gap-2"
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} title={t('Photographier une liste de produits, une facture, un cahier')} className="btn-ghost px-3" aria-label={t('Ajouter une photo')}>
            📷
          </button>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={user ? t('Posez votre question, dictez une liste…') : t('Posez votre question…')}
            className="field flex-1"
          />
          <button type="submit" disabled={busy} className="btn-primary px-3" aria-label={t('Envoyer')}>
            <IconSend className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function factorOf(currency: string): number {
  return currency === 'XAF' || currency === 'XOF' ? 1 : 100;
}
