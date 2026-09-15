import { useState } from 'react';
import { lockAvailable, lockEnabled, lockNow, removeLock, setLockCode } from '../lib/lock';
import { IconCheck, IconShield } from './Icons';
import { t } from '../lib/i18n';

/**
 * Régler le code d'ouverture.
 *
 * Honnêteté d'abord : ce verrou arrête quelqu'un qui prend le téléphone, pas
 * quelqu'un qui sait ouvrir les outils du navigateur. Les données d'une
 * application web restent en clair dans le navigateur, il n'existe pas de
 * coffre côté navigateur. Promettre plus serait mentir à une commerçante sur
 * la protection de ses chiffres.
 */
export default function LockCard() {
  const [actif, setActif] = useState(() => lockEnabled());
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const disponible = lockAvailable();

  async function enregistrer() {
    setError('');
    if (code.length < 4) {
      setError(t('Choisissez un code d’au moins quatre chiffres.'));
      return;
    }
    if (code !== confirm) {
      setError(t('Les deux codes ne sont pas identiques.'));
      return;
    }
    await setLockCode(code);
    setActif(true);
    setOuvert(false);
    setCode('');
    setConfirm('');
    setNotice(t('Code enregistré. Il sera demandé à la prochaine ouverture.'));
  }

  function retirer() {
    removeLock();
    setActif(false);
    setNotice(t('Code retiré. L’application s’ouvre sans demander.'));
  }

  return (
    <div className="card lg:col-span-2">
      <h2 className="flex items-center gap-2 text-section">
        <IconShield className="h-4 w-4 text-[#8C6A3D]" />
        {t('Code d’ouverture')}
      </h2>
      <p className="mt-1 text-caption text-muted">
        {t('Sur un appareil de caisse qui passe de main en main, un code empêche qu’on lise vos ventes, vos clients et vos salaires en votre absence. Il est redemandé après dix minutes sans activité.')}
      </p>
      <p className="mt-2 text-caption text-muted">
        {t('Ce qu’il ne fait pas : il n’empêche pas quelqu’un qui s’y connaît d’ouvrir les outils du navigateur et d’y lire les données. Aucune application web ne le peut. Pour un appareil vraiment sensible, verrouillez aussi le téléphone lui-même.')}
      </p>

      {!disponible ? (
        <p className="mt-4 rounded-input border border-hairline px-3 py-2 text-caption text-muted">
          {t('Ce navigateur ne permet pas d’enregistrer un code en sécurité. Le verrou n’est pas proposé ici.')}
        </p>
      ) : (
        <div className="mt-4">
          {actif ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill border border-teal/40 bg-teal/10 px-3 py-1.5 text-caption font-semibold text-teal">
                {t('Code actif')}
              </span>
              <button onClick={() => setOuvert(true)} className="btn-ghost py-1.5 text-caption">
                {t('Changer le code')}
              </button>
              <button
                onClick={() => {
                  lockNow();
                  window.location.reload();
                }}
                className="btn-ghost py-1.5 text-caption"
              >
                {t('Verrouiller maintenant')}
              </button>
              <button onClick={retirer} className="btn-ghost py-1.5 text-caption text-[#D14343]">
                {t('Retirer le code')}
              </button>
            </div>
          ) : (
            <button onClick={() => setOuvert(true)} className="btn-primary py-1.5 text-caption">
              {t('Choisir un code')}
            </button>
          )}

          {ouvert && (
            <div className="mt-4 grid max-w-sm gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">{t('Code (4 chiffres ou plus)')}</span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="field num"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">{t('Répétez le code')}</span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="field num"
                />
              </label>
              {error && <p className="text-caption font-semibold text-[#A63030]">{error}</p>}
              <p className="text-caption text-muted">
                {t('Notez-le quelque part : personne ne peut le retrouver à votre place.')}
              </p>
              <div className="flex gap-2">
                <button onClick={() => { setOuvert(false); setCode(''); setConfirm(''); setError(''); }} className="btn-ghost py-1.5 text-caption">
                  {t('Annuler')}
                </button>
                <button onClick={() => void enregistrer()} className="btn-primary py-1.5 text-caption">
                  {t('Enregistrer le code')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {notice && (
        <p className="mt-3 flex items-center gap-2 rounded-input bg-teal/10 px-3 py-2 text-caption font-semibold text-teal">
          <IconCheck className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}
    </div>
  );
}
