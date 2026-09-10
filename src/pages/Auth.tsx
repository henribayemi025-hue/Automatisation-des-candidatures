import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Field } from '../components/UI';
import { IconBook, IconScale, IconShield, IconSparkle } from '../components/Icons';

export default function Auth() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    const err =
      mode === 'login' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'signup')
      setNotice('Compte créé. Si un email de confirmation est demandé, vérifiez votre boîte de réception puis connectez-vous.');
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream dark:bg-ink-950 lg:flex-row">
      <div className="flex flex-col justify-between bg-ink-900 p-8 text-slate-300 lg:w-[46%] lg:p-12">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brass to-brand-500 font-display text-xl font-bold text-ink-950">
            F
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-white">Finia</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass">
              Accounting
            </div>
          </div>
        </div>

        <div className="py-10">
          <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Votre gestion,
            <br />
            <span className="text-brass">votre comptabilité.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
            Ventes, caisse, stock, dépenses — et derrière chaque opération, une vraie écriture en
            partie double : journal, grand livre, balance, bilan, audit.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <IconBook className="h-[18px] w-[18px] text-brass" />
              Plan comptable SYSCOHADA, PCG ou générique
            </li>
            <li className="flex items-center gap-3">
              <IconScale className="h-[18px] w-[18px] text-brass" />
              Balance et bilan toujours équilibrés, vérifiés en continu
            </li>
            <li className="flex items-center gap-3">
              <IconShield className="h-[18px] w-[18px] text-brass" />
              Piste d'audit horodatée de chaque opération
            </li>
            <li className="flex items-center gap-3">
              <IconSparkle className="h-[18px] w-[18px] text-brass" />
              Assistant IA qui répond sur vos chiffres réels
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Vos données sont sauvegardées en ligne et retrouvables depuis n'importe quel appareil.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold">
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Retrouvez votre espace de gestion.'
              : 'Gratuit pour démarrer — aucune carte bancaire requise.'}
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
              {notice}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="field"
              />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="field"
              />
            </Field>
            {mode === 'signup' && (
              <Field label="Confirmer le mot de passe">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="field"
                />
              </Field>
            )}
          </div>

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <div className="mt-4 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="font-semibold text-brand-600"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-semibold text-brand-600"
                >
                  Se connecter
                </button>
              </>
            )}
          </div>

          <div className="mt-8 border-t border-hairline pt-5 text-center dark:border-white/10">
            <button
              type="button"
              onClick={continueAsGuest}
              className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline dark:hover:text-slate-300"
            >
              Essayer sans compte (données locales uniquement)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
