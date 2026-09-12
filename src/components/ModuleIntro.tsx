import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULE_HELP } from '../lib/guide';
import { useDB } from '../lib/store';
import { tracksStock } from '../lib/sector';
import { IconHelp, IconX } from './Icons';
import { t } from '../lib/i18n';

const KEY = 'finia.intro.hidden';

function hidden(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

/** « À quoi ça sert ? » — une explication en langage courant, en tête de chaque écran. */
export default function ModuleIntro() {
  const { pathname } = useLocation();
  const db = useDB();
  const base = MODULE_HELP[pathname];
  const help = base && base.noStock && !tracksStock(db.company) ? { ...base, ...base.noStock } : base;
  const [dismissed, setDismissed] = useState(() => hidden().has(pathname));
  const [expanded, setExpanded] = useState(false);

  if (!help || pathname === '/') return null;

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="mb-4 inline-flex items-center gap-1.5 text-caption font-semibold text-teal"
      >
        <IconHelp className="h-4 w-4" />{t('À quoi sert cet écran ?')}
      </button>
    );
  }

  return (
    <div className="mb-5 rounded-card border border-brass/40 bg-[#FBF1DF] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brass/20 text-[#8C6A3D]">
          <IconHelp className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body text-ink">
            <span className="font-semibold">{t('À quoi ça sert :')} </span>
            {t(help.what)}
          </p>
          {expanded && (
            <div className="mt-2 space-y-1.5 text-caption text-ink/80">
              <p>
                <span className="font-semibold">{t('Quand l’utiliser :')} </span>
                {t(help.when)}
              </p>
              <p>
                <span className="font-semibold">{t('Exemple :')} </span>
                {t(help.example)}
              </p>
            </div>
          )}
          <button onClick={() => setExpanded((v) => !v)} className="mt-1.5 text-caption font-semibold text-teal">
            {expanded ? t('Réduire') : t('Voir un exemple')}
          </button>
        </div>
        <button
          onClick={() => {
            const h = hidden();
            h.add(pathname);
            localStorage.setItem(KEY, JSON.stringify([...h]));
            setDismissed(true);
          }}
          aria-label={t('Masquer')}
          className="rounded-full p-1 text-muted hover:bg-brass/20"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
