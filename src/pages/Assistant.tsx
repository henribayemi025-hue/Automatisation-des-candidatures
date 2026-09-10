import { useMemo, useRef, useState } from 'react';
import { useDB } from '../lib/store';
import { answer, insights } from '../lib/assistant';
import type { Answer } from '../lib/assistant';
import { PageHeader } from '../components/UI';
import { IconAlert, IconCheck, IconSend, IconSparkle } from '../components/Icons';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  facts?: Answer['facts'];
}

const SUGGESTIONS = [
  "Quel est mon chiffre d'affaires ce mois ?",
  'Combien j\'ai dépensé cette semaine ?',
  'Quelle est ma marge ?',
  'Qui me doit de l\'argent ?',
  'Quel produit se vend le mieux ?',
  'Y a-t-il des anomalies comptables ?',
  'Où en est ma trésorerie ?',
  'Quels produits sont en rupture ?',
];

export default function Assistant() {
  const db = useDB();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const counter = useRef(0);

  const tips = useMemo(() => insights(db), [db]);

  function ask(question: string) {
    if (!question.trim()) return;
    const a = answer(db, question);
    setMessages((prev) => [
      ...prev,
      { id: ++counter.current, role: 'user', text: question },
      { id: ++counter.current, role: 'assistant', text: a.text, facts: a.facts },
    ]);
    setInput('');
  }

  return (
    <>
      <PageHeader
        title="Finia IA"
        subtitle="Interrogez vos chiffres en langage naturel — les réponses sont calculées sur vos écritures réelles"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="card flex min-h-[60vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <span className="rounded-2xl bg-brand-50 p-4 text-brand-600 dark:bg-brand-500/15">
                  <IconSparkle className="h-8 w-8" />
                </span>
                <div>
                  <p className="font-bold">Posez une question sur votre activité</p>
                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    L'assistant lit vos ventes, dépenses, stocks et écritures comptables pour répondre
                    avec des chiffres exacts. Tout est calculé localement, aucune donnée ne sort de
                    votre navigateur.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    {m.facts && m.facts.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-black/10 pt-2 text-xs dark:border-white/10">
                        {m.facts.map((f, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            <span className="opacity-70">{f.label}</span>
                            <span className="font-semibold num">{f.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, messages.length ? 4 : 8).map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-700 dark:border-white/10 dark:text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="field flex-1"
              />
              <button type="submit" className="btn-primary">
                <IconSend className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="card h-fit">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <IconSparkle className="h-[18px] w-[18px] text-brand-600" />
            Alertes intelligentes
          </h2>
          {tips.length ? (
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${
                    t.tone === 'good'
                      ? 'border-teal-200 bg-teal-50/60 dark:border-teal-500/20 dark:bg-teal-500/5'
                      : t.tone === 'warn'
                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                        : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/5'
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 ${
                      t.tone === 'good' ? 'text-teal-600' : t.tone === 'warn' ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  >
                    {t.tone === 'good' ? <IconCheck className="h-4 w-4" /> : <IconAlert className="h-4 w-4" />}
                  </span>
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              Aucune alerte : enregistrez des ventes et des dépenses pour activer l'analyse.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
