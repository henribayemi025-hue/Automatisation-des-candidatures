import { useOffline } from '../lib/offline';
import { useCollab } from '../lib/collab';
import { IconAlert, IconCheck, IconSparkle } from './Icons';
import { t } from '../lib/i18n';

/**
 * Deux bandeaux, jamais plus d'un à la fois :
 *
 * — Hors réseau : dire que ça continue de marcher. Un commerçant qui voit
 *   « pas de connexion » range son téléphone ; il doit lire l'inverse.
 * — Mise à jour prête : proposer, ne jamais recharger sous les doigts de
 *   quelqu'un en train d'encaisser.
 */
export default function OfflineBar() {
  const { online, updateReady, applyUpdate } = useOffline();
  const { user, pending } = useCollab();

  if (!online) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 border-b border-brass/40 bg-[#FBF1DF] px-4 py-2 text-caption text-ink sm:px-6">
        <IconAlert className="h-4 w-4 shrink-0 text-[#8C6A3D]" />
        <span>
          <strong>{t('Pas de réseau')}</strong> — {t('vous pouvez continuer : ventes, dépenses, caisse et stock sont enregistrés sur cet appareil.')}
        </span>
        {user && pending > 0 && (
          <span className="rounded-pill bg-brass/20 px-2 py-0.5 font-semibold text-[#8C6A3D]">
            {t('{n} opération(s) partiront au retour du réseau', { n: pending })}
          </span>
        )}
      </div>
    );
  }

  if (updateReady) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 border-b border-teal/30 bg-teal/10 px-4 py-2 text-caption text-ink sm:px-6">
        <IconSparkle className="h-4 w-4 shrink-0 text-teal" />
        <span>
          <strong>{t('Nouvelle version prête')}</strong> — {t('elle s’installe au rechargement. Terminez d’abord ce que vous faites.')}
        </span>
        <button onClick={applyUpdate} className="btn-primary ml-auto px-3 py-1 text-caption">
          <IconCheck className="h-4 w-4" />
          {t('Mettre à jour')}
        </button>
      </div>
    );
  }

  return null;
}
