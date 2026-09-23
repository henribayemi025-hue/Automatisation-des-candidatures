import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useCollab } from '../lib/collab';
import { CURRENT_APP_KEY, FALLBACK_APPS, fetchApps, fetchAudience, urlVers, visibleApps } from '../lib/apps';
import type { FinjaroApp } from '../lib/apps';
import { IconApps, IconCheck } from './Icons';
import { t } from '../lib/i18n';
import { openFinjaroApp } from '../lib/shell';

const ACCENT: Record<FinjaroApp['accent'], string> = {
  teal: 'bg-teal-light text-teal',
  brass: 'bg-[#FBF1DF] text-[#8C6A3D]',
  ink: 'bg-ink text-white',
};

/**
 * Une ligne du sélecteur. L'application déjà ouverte n'est pas un lien : elle
 * s'affiche comme une simple ligne, sans curseur de main et sans clic mort.
 */
function RowTag({
  current,
  app,
  connecte,
  onDone,
  children,
}: {
  current: boolean;
  app: FinjaroApp;
  connecte: boolean;
  onDone: () => void;
  children: ReactNode;
}) {
  const className = `flex items-center gap-3 rounded-input px-3 py-2.5 transition ${
    current ? 'cursor-default bg-base' : 'hover:bg-teal-light'
  }`;
  if (current) return <div className={className}>{children}</div>;
  // Dans la fenêtre de l'application Finjaro, ou dans l'application installée,
  // `target="_blank"` éjecte vers le navigateur du téléphone et on ne sait plus
  // revenir. `openFinjaroApp` remplace alors la page : le bouton retour ramène ici.
  return (
    <a
      href={app.url}
      onClick={(e) => {
        e.preventDefault();
        onDone();
        // Connectée et l'application d'en face sait recevoir un relais : elle
        // y arrive déjà identifiée, au lieu de revoir un écran de connexion
        // qu'elle a déjà passé une fois aujourd'hui. Un relais qui échoue
        // (compte sans e-mail, réseau) retombe sur l'adresse normale.
        void urlVers(app, connecte).then(openFinjaroApp);
      }}
      className={className}
    >
      {children}
    </a>
  );
}

/** Sélecteur en grille « comme Google » : lit finjaro_apps, marque l'application ouverte. */
export default function AppSwitcher({ align = 'start' }: { align?: 'start' | 'end' }) {
  const { user } = useCollab();
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<FinjaroApp[]>(FALLBACK_APPS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [list, flags] = await Promise.all([fetchApps(), fetchAudience(user?.id ?? null)]);
      if (!cancelled) setApps(visibleApps(list, flags));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('Applications Finjaro')}
        aria-expanded={open}
        className="rounded-full p-2 text-muted transition hover:bg-teal-light hover:text-teal"
      >
        <IconApps className="h-[22px] w-[22px]" />
      </button>

      {open && (
        <div
          // Sur téléphone, le menu occupe la largeur de l'écran avec ses marges ;
          // à partir de « sm », il s'accroche au bouton.
          className={`fixed inset-x-4 top-[4.5rem] z-50 rounded-card border border-hairline bg-white p-2 shadow-[0_18px_40px_rgba(23,27,38,0.16)] sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 sm:w-[320px] ${
            align === 'end' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          <div className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            {t('Applications Finjaro')}
          </div>
          <ul className="grid grid-cols-1 gap-1">
            {apps.map((a) => {
              const current = a.key === CURRENT_APP_KEY;
              return (
                <li key={a.key}>
                  {/* L'application déjà ouverte n'est pas un lien : un <a> sans
                      href a l'air cliquable et ne fait rien — on croit que
                      l'application est cassée. */}
                  <RowTag
                    current={current}
                    app={a}
                    connecte={!!user}
                    onDone={() => setOpen(false)}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-input text-xl ${ACCENT[a.accent]}`}>
                      {a.logo_url ? (
                        <img src={a.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        a.emoji
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-body font-semibold text-ink">
                        {a.name}
                        {current && (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-teal-light px-2 py-0.5 text-[10px] font-bold text-teal">
                            <IconCheck className="h-3 w-3" />
                            {t('Ouverte')}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-1 text-caption text-muted">{a.tagline}</span>
                    </span>
                  </RowTag>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
