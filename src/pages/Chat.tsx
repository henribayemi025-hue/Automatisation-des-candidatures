import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { today, useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { answer } from '../lib/assistant';
import { AIError, aiErrorMessage, askAI, buildContext, fileToImage } from '../lib/ai';
import type { AIExpense } from '../lib/ai';
import { chatImageUrl, mentionsAssistant, uploadChatImage } from '../lib/chat';
import { EXPENSE_KEYS } from '../lib/chart';
import type { AccountKey } from '../lib/chart';
import { EXPENSE_LABEL } from '../lib/expenses';
import { factor } from '../lib/money';
import { locale, t } from '../lib/i18n';
import type { Message, PaymentMethod } from '../lib/types';
import { Avatar } from '../components/PresenceAvatars';
import { Empty, PageHeader } from '../components/UI';
import { IconCamera, IconSend, IconSparkle, IconUsers } from '../components/Icons';

/** Photo du fil : le chemin devient une URL signée le temps de l'affichage. */
function ChatImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void chatImageUrl(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return <div className="mt-2 h-32 w-48 animate-pulse rounded-input bg-hairline" />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" className="mt-2 max-h-72 max-w-full rounded-input object-cover" />
    </a>
  );
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  const sameDay = iso.slice(0, 10) === today();
  return sameDay
    ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(locale(), { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

/**
 * Fil de discussion de l'espace — un canal général et un par projet.
 * Les messages sont des événements comme les autres : partagés en direct,
 * conservés, visibles dans l'historique.
 */
export default function Chat() {
  const { projectId: fromUrl } = useParams();
  const { db, postMessage, addExpense } = useStore();
  const { user, workspace, displayName, avatarUrl, presence } = useCollab();
  const [channel, setChannel] = useState<string>(fromUrl ?? '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingImage, setPendingImage] = useState<{ mime: string; data: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fromUrl !== undefined) setChannel(fromUrl);
  }, [fromUrl]);

  const projects = db.projects.filter((p) => p.status === 'ACTIVE');
  const messages = useMemo(() => db.messages.filter((m) => (m.projectId ?? '') === channel), [db.messages, channel]);
  const canAttach = !!user && !!workspace;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, channel]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const img = await fileToImage(file);
      setPendingImage({ ...img, name: file.name });
    } catch {
      setNotice(t('Impossible de lire cette image.'));
    }
  }

  async function send() {
    const body = text.trim();
    if (!body && !pendingImage) return;
    setNotice('');
    setBusy(true);
    const image = pendingImage;
    setPendingImage(null);
    setText('');

    let imagePath: string | undefined;
    if (image && canAttach) {
      try {
        // On réserve l'identifiant du message pour nommer le fichier.
        const probe = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        imagePath = await uploadChatImage(workspace!.id, probe, image);
      } catch (e) {
        setNotice(t('La photo n’a pas pu être envoyée ({why}). Le message part sans elle.', { why: e instanceof Error ? e.message : '' }));
      }
    } else if (image && !canAttach) {
      setNotice(t('Joindre une photo demande un compte connecté. Le message part sans elle.'));
    }

    postMessage({ projectId: channel || null, kind: 'user', text: body || (image ? t('📷 Photo') : ''), imageUrl: imagePath });

    if (mentionsAssistant(body) || (image && canAttach)) {
      await askInThread(body, image ?? undefined);
    }
    setBusy(false);
  }

  /** L'assistant répond dans le fil, avec la même prudence qu'ailleurs : rien n'est enregistré sans clic. */
  async function askInThread(question: string, image?: { mime: string; data: string }) {
    const clean = question.replace(/(^|\s)@(assistant|ia|ai)\b/gi, ' ').trim() || t('Que vois-tu sur cette photo ? Si c’est une facture ou un reçu, sors la dépense.');
    if (user) {
      try {
        const project = db.projects.find((p) => p.id === channel);
        const context = { ...buildContext(db, '/discussion'), canal: project ? `Projet ${project.name}` : 'Général' };
        const result = await askAI([{ role: 'user', text: clean, image }], context);
        postMessage({ projectId: channel || null, kind: 'assistant', authorName: 'Assistant', authorId: null, text: result.text, expense: result.expense });
        return;
      } catch (e) {
        setNotice(t(aiErrorMessage(e instanceof AIError ? e.code : 'unknown')));
      }
    }
    const local = answer(db, clean);
    const facts = local.facts?.length ? '\n' + local.facts.map((f) => `${f.label} : ${f.value}`).join('\n') : '';
    postMessage({ projectId: channel || null, kind: 'assistant', authorName: 'Assistant', authorId: null, text: local.text + facts });
  }

  function saveExpense(e: AIExpense, message: Message) {
    const key = (EXPENSE_KEYS as string[]).includes(e.category) ? (e.category as AccountKey) : 'MISC_EXPENSE';
    const methods: PaymentMethod[] = ['CASH', 'MOBILE', 'CARD', 'BANK'];
    addExpense({
      date: /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : today(),
      category: t(EXPENSE_LABEL[key]),
      accountKey: key,
      description: [e.supplier, e.description].filter(Boolean).join(' — '),
      amount: Math.round(e.amount * factor(db.company.currency)),
      method: methods.includes(e.method as PaymentMethod) ? (e.method as PaymentMethod) : 'CASH',
      projectId: message.projectId ?? null,
    });
    postMessage({ projectId: channel || null, kind: 'system', authorName: 'Finjaro', authorId: null, text: t('{who} a enregistré la dépense proposée ({amount} {cur}).', { who: displayName, amount: e.amount, cur: db.company.currency }) });
  }

  const alreadySaved = (m: Message) => db.messages.some((x) => x.kind === 'system' && x.createdAt > m.createdAt && (x.projectId ?? '') === channel && x.text.includes(String(m.expense?.amount ?? '∅')));

  return (
    <>
      <PageHeader
        title={t('Discussion')}
        subtitle={t('Votre équipe et l’assistant, au même endroit que les chiffres')}
        actions={
          presence.length > 0 ? (
            <span className="inline-flex items-center gap-2 text-caption text-muted">
              <IconUsers className="h-4 w-4" />
              {t('{n} en ligne', { n: presence.length })}
            </span>
          ) : undefined
        }
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setChannel('')}
          className={`shrink-0 rounded-pill border px-4 py-2 text-caption font-semibold ${channel === '' ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink hover:border-teal'}`}
        >
          {t('Général')}
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setChannel(p.id)}
            className={`shrink-0 rounded-pill border px-4 py-2 text-caption font-semibold ${channel === p.id ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink hover:border-teal'}`}
          >
            {p.name}
          </button>
        ))}
        {projects.length === 0 && (
          <Link to="/projets" className="shrink-0 rounded-pill border border-dashed border-hairline px-4 py-2 text-caption text-muted hover:border-teal hover:text-teal">
            {t('+ Un fil par projet')}
          </Link>
        )}
      </div>

      <div className="card flex h-[calc(100vh-360px)] min-h-[420px] flex-col p-0 lg:h-[calc(100vh-280px)]">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-5">
          {messages.length === 0 && (
            <Empty
              title={channel ? t('Premier message du projet') : t('Personne n’a encore écrit')}
              hint={t('Écrivez à votre équipe, envoyez la photo d’une facture, ou mentionnez @assistant pour une question sur les chiffres.')}
              icon={<IconSparkle className="h-10 w-10" />}
            />
          )}
          {messages.map((m) => {
            const mine = m.kind === 'user' && (m.authorId ? m.authorId === (user?.id ?? null) : m.authorName === displayName);
            if (m.kind === 'system') {
              return (
                <div key={m.id} className="text-center text-[11px] text-muted">
                  {m.text} · {timeOf(m.createdAt)}
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="mt-1 shrink-0">
                    {m.kind === 'assistant' ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-light text-teal">
                        <IconSparkle className="h-4 w-4" />
                      </span>
                    ) : (
                      <Avatar name={m.authorName} size={30} index={m.authorName.length % 5} />
                    )}
                  </div>
                )}
                <div className={`max-w-[85%] rounded-card px-4 py-2.5 ${mine ? 'bg-teal text-white' : m.kind === 'assistant' ? 'border border-teal/30 bg-teal-light' : 'bg-base'}`}>
                  {!mine && (
                    <div className={`text-[11px] font-bold ${m.kind === 'assistant' ? 'text-teal' : 'text-muted'}`}>
                      {m.kind === 'assistant' ? t('Assistant') : m.authorName}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-body leading-relaxed">{m.text}</p>
                  {m.imageUrl && <ChatImage path={m.imageUrl} />}
                  {m.expense && m.expense.amount > 0 && (
                    <div className="mt-3 rounded-input border border-hairline bg-white p-3 text-ink">
                      <div className="text-caption font-semibold">{t('Dépense lue sur le document')}</div>
                      <ul className="mt-1 space-y-0.5 text-[12px] text-muted">
                        <li>
                          {t('Montant')} : <span className="font-semibold text-ink num">{m.expense.amount}</span> {db.company.currency}
                        </li>
                        {m.expense.date && <li>{t('Date')} : {m.expense.date}</li>}
                        {m.expense.supplier && <li>{t('Fournisseur')} : {m.expense.supplier}</li>}
                        {m.expense.description && <li>{m.expense.description}</li>}
                      </ul>
                      {alreadySaved(m) ? (
                        <div className="mt-2 text-caption font-semibold text-[#1F6F65]">{t('Déjà enregistrée')}</div>
                      ) : (
                        <button type="button" onClick={() => saveExpense(m.expense!, m)} className="btn-primary mt-2 w-full py-2 text-caption">
                          {t('Enregistrer cette dépense')}
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`mt-1 text-right text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>{timeOf(m.createdAt)}</div>
                </div>
                {mine && (
                  <div className="mt-1 shrink-0">
                    <Avatar name={displayName} src={avatarUrl} size={30} />
                  </div>
                )}
              </div>
            );
          })}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-card bg-base px-4 py-2 text-caption text-muted">
                <span className="inline-flex items-center gap-2">
                  <IconSparkle className="h-4 w-4 animate-pulse text-teal" />
                  {t('Envoi…')}
                </span>
              </div>
            </div>
          )}
          <div ref={bottom} />
        </div>

        <div className="border-t border-hairline px-4 py-3 sm:px-5">
          {notice && <p className="mb-2 rounded-input bg-[#FDF6E3] px-3 py-2 text-caption text-ink">{notice}</p>}
          {pendingImage && (
            <div className="mb-2 flex items-center justify-between rounded-input bg-base px-3 py-2 text-caption">
              <span>📷 {pendingImage.name} {t('— prête à envoyer')}</span>
              <button type="button" onClick={() => setPendingImage(null)} className="font-semibold text-muted">
                {t('Retirer')}
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2"
          >
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost px-3" aria-label={t('Joindre une photo')} title={canAttach ? t('Photo d’une facture, d’un reçu, d’un rayon') : t('Joindre une photo demande un compte connecté')}>
              <IconCamera className="h-5 w-5" />
            </button>
            <input
              id="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('Écrire à l’équipe… « @assistant » pour l’IA')}
              className="field flex-1"
              disabled={busy}
            />
            <button type="submit" disabled={busy || (!text.trim() && !pendingImage)} className="btn-primary px-3" aria-label={t('Envoyer')}>
              <IconSend className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted">
            {user
              ? t('Chaque message est partagé avec les membres de l’espace et gardé dans l’historique.')
              : t('Sans compte, la discussion reste sur cet appareil et l’assistant répond avec le moteur local.')}
          </p>
        </div>
      </div>
    </>
  );
}
