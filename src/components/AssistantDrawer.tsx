import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AssistantChat from './AssistantChat';
import { IconSparkle, IconX } from './Icons';
import { t } from '../lib/i18n';

/** L'assistant partout : bouton flottant, tiroir avec l'aide de l'écran courant. */
export default function AssistantDrawer() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  // Sur les écrans qui sont déjà une conversation, le bouton flottant ferait doublon.
  if (pathname === '/assistant' || pathname.startsWith('/discussion')) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('Ouvrir l’assistant')}
        className={`fixed right-4 z-40 flex items-center gap-2 rounded-pill bg-teal px-4 py-3 text-white shadow-[0_12px_30px_rgba(194,94,56,0.4)] transition hover:bg-teal-hover active:scale-95 bottom-[104px] lg:bottom-6 lg:right-6 ${
          open ? 'hidden' : ''
        }`}
      >
        <IconSparkle className="h-5 w-5" />
        <span className="hidden text-body font-semibold sm:inline">{t('Assistant')}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/30 backdrop-blur-[2px] lg:p-6">
          <button aria-label={t('Fermer')} onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />
          <div className="relative flex h-[88vh] w-full flex-col rounded-t-card bg-white shadow-2xl lg:h-[min(760px,92vh)] lg:w-[440px] lg:rounded-card">
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-light text-teal">
                <IconSparkle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold">{t('Assistant Finjaro')}</div>
                <div className="text-caption text-muted">{t('Explique, répond avec vos chiffres, saisit pour vous')}</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-base" aria-label={t('Fermer')}>
                <IconX />
              </button>
            </div>
            <AssistantChat compact />
          </div>
        </div>
      )}
    </>
  );
}
