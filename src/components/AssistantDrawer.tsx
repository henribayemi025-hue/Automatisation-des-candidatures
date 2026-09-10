import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDB } from '../lib/store';
import { answer, insights } from '../lib/assistant';
import type { Answer } from '../lib/assistant';
import { MODULE_HELP } from '../lib/guide';
import { IconAlert, IconCheck, IconSend, IconSparkle, IconX } from './Icons';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  facts?: Answer['facts'];
}

const GENERIC = [
  "Quel est mon chiffre d'affaires ce mois ?",
  "Combien j'ai dépensé cette semaine ?",
  "Qui me doit de l'argent ?",
  'Quel produit se vend le mieux ?',
];

/** L'assistant partout : bouton flottant, tiroir avec l'aide de l'écran courant et les réponses chiffrées. */
export default function AssistantDrawer() {
  const db = useDB();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const counter = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  const help = MODULE_HELP[pathname];
  const tips = insights(db);
  const questions = help?.questions.length ? help.questions : GENERIC;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function ask(q: string) {
    if (!q.trim()) return;
    const a = answer(db, q);
    setMessages((m) => [
      ...m,
      { id: ++counter.current, role: 'user', text: q },
      { id: ++counter.current, role: 'assistant', text: a.text, facts: a.facts },
    ]);
    setInput('');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l’assistant"
        className={`fixed right-4 z-40 flex items-center gap-2 rounded-pill bg-teal px-4 py-3 text-white shadow-[0_12px_30px_rgba(194,94,56,0.4)] transition hover:bg-teal-hover active:scale-95 bottom-[104px] lg:bottom-6 lg:right-6 ${
          open ? 'hidden' : ''
        }`}
      >
        <IconSparkle className="h-5 w-5" />
        <span className="hidden text-body font-semibold sm:inline">Assistant</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/30 backdrop-blur-[2px] lg:p-6">
          <button aria-label="Fermer" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />
          <div className="relative flex h-[85vh] w-full flex-col rounded-t-card bg-white shadow-2xl lg:h-[min(720px,90vh)] lg:w-[420px] lg:rounded-card">
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-light text-teal">
                <IconSparkle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold">Assistant Finjaro</div>
                <div className="text-caption text-muted">Répond avec vos vrais chiffres</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-base">
                <IconX />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 scrollbar-thin">
              {help && (
                <div className="rounded-card bg-base p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Cet écran : {help.title}</div>
                  <p className="mt-1 text-caption text-ink">{help.what}</p>
                  <p className="mt-1.5 text-caption text-muted">
                    <span className="font-semibold text-ink">Quand ? </span>
                    {help.when}
                  </p>
                </div>
              )}

              {messages.length === 0 && tips.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">À surveiller</div>
                  <ul className="space-y-1.5">
                    {tips.slice(0, 3).map((t, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 rounded-input px-3 py-2 text-caption ${
                          t.tone === 'good' ? 'bg-teal-light text-ink' : t.tone === 'warn' ? 'bg-[#FDF6E3] text-ink' : 'bg-[#FDEDED] text-ink'
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

              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[88%] rounded-card px-4 py-3 ${m.role === 'user' ? 'bg-teal text-white' : 'bg-base'}`}>
                    <p className="text-caption leading-relaxed sm:text-body">{m.text}</p>
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
                  </div>
                </div>
              ))}
              <div ref={bottom} />
            </div>

            <div className="border-t border-hairline px-5 py-3">
              <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                {questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="shrink-0 rounded-pill border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-teal hover:text-teal"
                  >
                    {q}
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
                  id="assistant-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question…"
                  className="field flex-1"
                />
                <button type="submit" className="btn-primary px-3" aria-label="Envoyer">
                  <IconSend className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
