import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { frenchError } from '../lib/collab';
import { t } from '../lib/i18n';
import { IconEye, IconEyeOff } from '../components/Icons';

/**
 * Page d'arrivée du lien « mot de passe oublié » (/auth/reset).
 *
 * Le lien de l'e-mail passe par Supabase puis revient ici avec `?code=…`.
 * Le client Supabase est en PKCE (voir supabase.ts) : il échange ce code
 * contre une session de récupération au démarrage. Cet échange ne réussit que
 * sur l'appareil et le navigateur où le lien a été demandé : ailleurs, on le
 * dit clairement au lieu de laisser un formulaire qui échouerait.
 *
 * Rendue hors du routeur et hors de la synchronisation (main.tsx) : on
 * change un mot de passe, rien d'autre.
 */
type State = 'checking' | 'ready' | 'expired' | 'elsewhere' | 'done';

function linkError(): string {
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error') || '';
}

export default function ResetPassword() {
  const [state, setState] = useState<State>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // getSession attend la fin de l'échange du code.
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) setState('ready');
      else if (linkError()) setState('expired');
      else setState('elsewhere');
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError(t('Mot de passe trop court (6 caractères minimum).'));
    if (password !== confirm) return setError(t('Les deux mots de passe ne sont pas identiques.'));
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(frenchError(err.message));
    setState('done');
    // On quitte /auth/reset pour l'application, déjà connecté.
    window.setTimeout(() => window.location.replace(`${window.location.origin}/#/`), 1500);
  }

  const back = () => window.location.replace(`${window.location.origin}/#/`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <p className="font-display text-[22px] font-bold text-brand-600">Finjaro Accounting</p>
        <h1 className="mt-4 font-display text-[26px] font-bold text-ink">{t('Nouveau mot de passe')}</h1>

        {state === 'checking' && <p className="mt-4 text-caption text-muted">{t('Un instant…')}</p>}

        {state === 'ready' && (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="reset-password">{t('Nouveau mot de passe')}</label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('6 caractères minimum')}
                  className="field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-base hover:text-ink"
                >
                  {show ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="reset-confirm">{t('Le même, une seconde fois')}</label>
              <input
                id="reset-confirm"
                type={show ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="field"
              />
            </div>
            {error && <p role="alert" className="text-caption font-semibold text-brand-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? t('Un instant…') : t('Enregistrer le nouveau mot de passe')}
            </button>
          </form>
        )}

        {state === 'done' && (
          <p role="status" className="mt-4 text-body text-ink">{t('C’est fait. Vous êtes connecté avec votre nouveau mot de passe.')}</p>
        )}

        {(state === 'expired' || state === 'elsewhere') && (
          <div className="mt-4 space-y-3 text-body text-ink">
            <p role="alert">
              {state === 'expired'
                ? t('Ce lien a expiré ou a déjà servi.')
                : t('Ce lien ne s’ouvre que sur le téléphone et dans le navigateur où vous l’avez demandé.')}
            </p>
            <p className="text-caption text-muted">
              {t('Redemandez un lien depuis l’écran de connexion (« Mot de passe oublié ? »), puis ouvrez-le sur cet appareil.')}
            </p>
            <button type="button" onClick={back} className="btn-primary w-full">
              {t('Revenir à la connexion')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
