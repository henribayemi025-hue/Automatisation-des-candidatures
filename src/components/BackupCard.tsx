import { useRef, useState } from 'react';
import { useDB, useStoreActions } from '../lib/store';
import { useCollab } from '../lib/collab';
import { BackupError, readBackup, saveBackup } from '../lib/backup';
import type { Backup } from '../lib/backup';
import { Modal } from './UI';
import { IconAlert, IconCheck, IconDoc } from './Icons';
import { t } from '../lib/i18n';

/**
 * Emporter son travail, et le récupérer.
 *
 * Sans compte, le navigateur est le seul endroit où vivent la caisse, le stock
 * et la paie. Cette carte est la porte de sortie : un fichier qu'on range où
 * l'on veut, et qu'on recharge sur un autre appareil.
 *
 * La restauration remplace tout : elle passe donc par une confirmation qui
 * montre ce que contient le fichier et ce qui va disparaître.
 */
export default function BackupCard() {
  const db = useDB();
  const { restoreBackup } = useStoreActions();
  const { user } = useCollab();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Backup | null>(null);

  const rien = db.sales.length === 0 && db.entries.length === 0 && db.products.length === 0;

  async function exporter() {
    setError('');
    setNotice('');
    try {
      const how = await saveBackup(db);
      setNotice(
        how === 'partage'
          ? t('Sauvegarde prête : choisissez où la ranger.')
          : t('Sauvegarde enregistrée dans vos téléchargements.'),
      );
    } catch {
      setError(t('L’enregistrement n’a pas abouti. Réessayez, ou utilisez un autre navigateur.'));
    }
  }

  function choisir(file: File | undefined) {
    setError('');
    setNotice('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setPending(readBackup(String(reader.result ?? '')));
      } catch (e) {
        setError(e instanceof BackupError ? e.message : t('Ce fichier n’a pas pu être lu.'));
      }
    };
    reader.onerror = () => setError(t('Ce fichier n’a pas pu être lu.'));
    reader.readAsText(file);
  }

  function restaurer() {
    if (!pending) return;
    restoreBackup(pending.data);
    setPending(null);
    setNotice(t('Sauvegarde rechargée. Vos chiffres sont revenus.'));
  }

  return (
    <div className="card lg:col-span-2">
      <h2 className="text-section">{t('Sauvegarde')}</h2>
      <p className="mt-1 text-caption text-muted">
        {user
          ? t('Vos données sont déjà gardées en ligne. Une copie chez vous ne dépend de personne : c’est une sécurité de plus, pas une obligation.')
          : t('Sans compte, tout ce que vous saisissez ne vit que sur cet appareil. Une sauvegarde est le seul moyen de retrouver vos chiffres si vous changez de téléphone ou videz le cache.')}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => void exporter()} disabled={rien} className="btn-primary py-1.5 text-caption disabled:opacity-40">
          <IconDoc className="h-4 w-4" />
          {t('Enregistrer une sauvegarde')}
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost py-1.5 text-caption">
          {t('Recharger une sauvegarde')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            choisir(e.target.files?.[0]);
            // Permet de rechoisir le même fichier après une erreur.
            e.target.value = '';
          }}
        />
      </div>

      {rien && <p className="mt-2 text-caption text-muted">{t('Rien à sauvegarder pour l’instant : enregistrez d’abord une vente ou une dépense.')}</p>}

      {notice && (
        <p className="mt-3 flex items-center gap-2 rounded-input bg-teal/10 px-3 py-2 text-caption font-semibold text-teal">
          <IconCheck className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-input border border-[#D14343]/40 bg-[#FDEDED] px-3 py-2 text-caption text-ink">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D14343]" />
          {error}
        </p>
      )}

      <Modal open={pending !== null} onClose={() => setPending(null)} title={t('Recharger cette sauvegarde ?')}>
        {pending && (
          <>
            <p className="text-body text-ink">
              {t('Tout ce qui est actuellement dans cet espace sera remplacé par le contenu du fichier. Cette action ne s’annule pas.')}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-input border border-hairline p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('Le fichier contient')}</p>
                <p className="mt-1 text-body font-semibold text-ink">{pending.company || t('Entreprise sans nom')}</p>
                <p className="text-caption text-muted">
                  {pending.savedAt ? t('Sauvegardé le {date}', { date: pending.savedAt.slice(0, 10) }) : t('Date inconnue')}
                </p>
                <ul className="mt-2 space-y-0.5 text-caption text-ink/85">
                  <li>{t('{n} vente(s)', { n: pending.summary.sales })}</li>
                  <li>{t('{n} écriture(s)', { n: pending.summary.entries })}</li>
                  <li>{t('{n} article(s)', { n: pending.summary.products })}</li>
                </ul>
              </div>
              <div className="rounded-input border border-[#D14343]/40 bg-[#FDEDED] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A63030]">{t('Sera remplacé')}</p>
                <p className="mt-1 text-body font-semibold text-ink">{db.company.name}</p>
                <ul className="mt-2 space-y-0.5 text-caption text-ink/85">
                  <li>{t('{n} vente(s)', { n: db.sales.length })}</li>
                  <li>{t('{n} écriture(s)', { n: db.entries.length })}</li>
                  <li>{t('{n} article(s)', { n: db.products.length })}</li>
                </ul>
              </div>
            </div>
            {user && (
              <p className="mt-3 rounded-input border border-brass/40 bg-[#FBF1DF] px-3 py-2 text-caption text-ink">
                {t('Vous avez un compte : le rechargement part en ligne comme une opération ordinaire, et les autres membres verront le changement. L’historique en garde la trace.')}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPending(null)} className="btn-ghost">
                {t('Annuler')}
              </button>
              <button onClick={restaurer} className="btn-primary">
                {t('Remplacer par la sauvegarde')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
