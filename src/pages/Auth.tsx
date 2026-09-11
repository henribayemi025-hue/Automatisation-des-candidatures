import { useState } from 'react';
import { useCollab } from '../lib/collab';
import { Field } from '../components/UI';
import { LanguageSwitch } from '../lib/i18n';
import AppSwitcher from '../components/AppSwitcher';
import { IconBook, IconEye, IconEyeOff, IconGoogle, IconMonitor, IconShield, IconSparkle, IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';

const PILLARS = [
  { icon: <IconMonitor />, title: 'Vendre en 3 clics', text: 'Un comptoir simple, le stock et la caisse suivent tout seuls.' },
  { icon: <IconUsers />, title: 'Travailler à plusieurs', text: 'Caissier, gérant, comptable sur le même espace, en direct.' },
  { icon: <IconBook />, title: 'Une vraie comptabilité', text: 'Journal, bilan, audit — visibles seulement si vous le voulez.' },
  { icon: <IconSparkle />, title: 'Un assistant partout', text: 'Il explique chaque écran et répond avec vos vrais chiffres.' },
];

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, continueAsGuest, sessionExpired, lastEmail } = useCollab();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(lastEmail);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && name.trim().length < 2) {
      setError(t('Indiquez votre prénom ou votre nom.'));
      return;
    }
    setBusy(true);
    const err = mode === 'login' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, name.trim());
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'signup') setNotice(t('Compte créé. Si un email de confirmation vous est envoyé, ouvrez-le puis connectez-vous.'));
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto grid min-h-screen max-w-[1180px] items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <section>
          <div className="flex items-start justify-between">
          <div className="leading-tight">
            <span className="block font-display text-[26px] font-bold text-teal">{t('Finjaro')}</span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6A3D]">{t('Accounting')}</span>
          </div>
          <div className="flex items-center gap-2">
            <AppSwitcher align="end" />
            <LanguageSwitch />
          </div>
          </div>

          <h1 className="mt-8 font-display text-[38px] font-bold leading-[1.08] text-ink sm:text-[52px]">
            {t('Votre boutique,')}
            <br />
            <span className="text-teal">{t('tenue au propre.')}</span>
          </h1>
          <p className="mt-5 max-w-lg text-body leading-relaxed text-muted sm:text-[17px]">
            {t('Ventes, caisse, stock, dettes — et derrière chaque opération, une comptabilité juste, sans avoir besoin d’être comptable.')}
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <li key={p.title} className="flex gap-3 rounded-card border border-hairline bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-input bg-teal-light text-teal">{p.icon}</span>
                <span>
                  <span className="block text-body font-semibold text-ink">{t(p.title)}</span>
                  <span className="block text-caption text-muted">{t(p.text)}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 flex items-center gap-2 text-caption text-muted">
            <IconShield className="h-4 w-4 text-[#2A9D8F]" />
            {t('Sauvegardé en ligne, retrouvable depuis n’importe quel appareil. Le même compte que sur Finjaro.')}
          </p>
        </section>

        <section className="rounded-card border border-hairline bg-white p-6 shadow-[0_18px_40px_rgba(23,27,38,0.08)] sm:p-8">
          <h2 className="font-display text-[26px] font-bold text-ink">{mode === 'login' ? t('Se connecter') : t('Créer mon compte')}</h2>
          <p className="mt-1 text-caption text-muted">
            {mode === 'login' ? t('Retrouvez votre espace.') : t('Gratuit pour démarrer — aucune carte bancaire.')}
          </p>

          <button type="button" onClick={() => void signInWithGoogle()} className="btn-ghost mt-5 w-full">
            <IconGoogle />
            {t('Continuer avec Google')}
          </button>
          <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-hairline" />
            {t('ou par email')}
            <span className="h-px flex-1 bg-hairline" />
          </div>

          {sessionExpired && !error && (
            <div className="mb-4 rounded-input border border-brass/40 bg-[#FBF1DF] px-4 py-3 text-caption text-ink">
              {t('Votre session s’est terminée sur cet appareil. Reconnectez-vous : votre travail est en sécurité dans votre compte.')}
            </div>
          )}
          {lastEmail && !sessionExpired && mode === 'login' && (
            <p className="mb-4 text-caption text-muted">{t('Dernier compte utilisé ici : {email}', { email: lastEmail })}</p>
          )}
          {error && <div className="mb-4 rounded-input border border-[#D14343]/30 bg-[#FDEDED] px-4 py-3 text-caption text-[#A63030]">{error}</div>}
          {notice && <div className="mb-4 rounded-input border border-[#2A9D8F]/30 bg-[#EAF6EA] px-4 py-3 text-caption text-[#1F6F65]">{notice}</div>}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <Field label={t('Votre nom')}>
                <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t('Ex. Awa Ndiaye')} className="field" />
              </Field>
            )}
            <Field label={t('Email')}>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('vous@exemple.com')}
                className="field"
              />
            </Field>
            <Field label={t('Mot de passe')}>
              <div className="relative">
                <input
                  id="auth-password"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
            </Field>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? t('Un instant…') : mode === 'login' ? t('Se connecter') : t('Créer mon compte')}
            </button>
          </form>

          <p className="mt-4 text-center text-caption text-muted">
            {mode === 'login' ? (
              <>
                {t('Pas encore de compte ?')}{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="font-semibold text-teal">
                  {t('Créer un compte')}
                </button>
              </>
            ) : (
              <>
                {t('Déjà un compte Finjaro ?')}{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-semibold text-teal">
                  {t('Se connecter')}
                </button>
              </>
            )}
          </p>

          <div className="mt-6 border-t border-hairline pt-4 text-center">
            <button type="button" onClick={continueAsGuest} className="text-caption font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
              {t('Essayer sans compte (données sur cet appareil seulement)')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
