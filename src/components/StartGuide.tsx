import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDB } from '../lib/store';
import { startChecklist } from '../lib/guide';
import { IconCheck, IconChevronRight, IconX } from './Icons';
import { t } from '../lib/i18n';

const KEY = 'finia.guide.hidden';

/** Les premières étapes, cochées toutes seules à partir des vraies données. */
export default function StartGuide() {
  const db = useDB();
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1');
  const steps = startChecklist(db);
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  if (hidden || done === steps.length) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-card border border-hairline bg-white">
      <div className="flex items-start gap-4 bg-gradient-to-r from-[#FBF1DF] to-white px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[22px] font-bold text-ink">{t('Par où commencer')}</h2>
          <p className="mt-0.5 text-caption text-muted">
            {done} {t('étape(s) sur')} {steps.length} — {next ? `${t('prochaine :')} ${t(next.label).toLowerCase()}` : t('tout est prêt')}
          </p>
          <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(KEY, '1');
            setHidden(true);
          }}
          aria-label={t('Masquer le guide')}
          className="rounded-full p-1.5 text-muted hover:bg-white"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
      <ol className="divide-y divide-hairline">
        {steps.map((s, i) => (
          <li key={s.id}>
            <Link
              to={s.to}
              className={`flex items-center gap-3 px-5 py-3 transition hover:bg-base ${s.done ? 'opacity-60' : ''}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  s.done ? 'bg-[#2A9D8F] text-white' : s.id === next?.id ? 'bg-teal text-white' : 'bg-base text-muted'
                }`}
              >
                {s.done ? <IconCheck className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-body ${s.done ? 'line-through' : 'font-semibold'} text-ink`}>{t(s.label)}</span>
                <span className="block text-caption text-muted">{t(s.hint)}</span>
              </span>
              {!s.done && <IconChevronRight className="h-4 w-4 shrink-0 text-muted" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
