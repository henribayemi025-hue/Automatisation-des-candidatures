import { useCallback, useEffect, useRef, useState } from 'react';
import { checkLockCode, lockEnabled, shouldAskCode, touch } from '../lib/lock';
import { t } from '../lib/i18n';

/**
 * L'écran qui demande le code.
 *
 * Il couvre tout, sans rien laisser voir derrière : sur un comptoir, un chiffre
 * d'affaires lisible à travers un voile suffit à renseigner un curieux.
 *
 * Il ne coupe pas la caisse pour rien : le reverrouillage arrive après dix
 * minutes sans le moindre geste, pas au milieu d'une vente.
 */
export default function LockScreen() {
  const [locked, setLocked] = useState(() => shouldAskCode());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Tout geste repousse le reverrouillage ; sans geste, on ferme.
  useEffect(() => {
    if (locked || !lockEnabled()) return undefined;
    const gestes = ['pointerdown', 'keydown', 'focus'] as const;
    for (const g of gestes) window.addEventListener(g, touch, { passive: true });
    const id = window.setInterval(() => {
      if (shouldAskCode()) setLocked(true);
    }, 20_000);
    return () => {
      for (const g of gestes) window.removeEventListener(g, touch);
      window.clearInterval(id);
    };
  }, [locked]);

  // Revenir à l'application après un moment ailleurs : on revérifie.
  useEffect(() => {
    const onReturn = () => {
      if (shouldAskCode()) setLocked(true);
    };
    document.addEventListener('visibilitychange', onReturn);
    return () => document.removeEventListener('visibilitychange', onReturn);
  }, []);

  useEffect(() => {
    if (locked) input.current?.focus();
  }, [locked]);

  const valider = useCallback(async () => {
    if (busy || !code) return;
    setBusy(true);
    const ok = await checkLockCode(code).catch(() => false);
    setBusy(false);
    if (ok) {
      setCode('');
      setError('');
      setLocked(false);
      return;
    }
    setCode('');
    setError(t('Code incorrect.'));
  }, [busy, code]);

  if (!locked || !lockEnabled()) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-[320px] text-center">
        <p className="font-display text-[26px] font-bold leading-tight text-teal">{t('Finjaro')}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A3D]">{t('Accounting')}</p>
        <h1 className="mt-6 font-display text-[22px] font-bold text-ink">{t('Entrez votre code')}</h1>
        <p className="mt-1 text-caption text-muted">{t('Cet appareil garde vos chiffres. Le code les met à l’abri des regards.')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void valider();
          }}
          className="mt-6"
        >
          <input
            ref={input}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 8));
              setError('');
            }}
            aria-label={t('Code')}
            className="field num w-full text-center text-[22px] tracking-[0.4em]"
          />
          {error && <p className="mt-2 text-caption font-semibold text-[#A63030]">{error}</p>}
          <button type="submit" disabled={code.length < 4 || busy} className="btn-primary mt-4 w-full disabled:opacity-40">
            {t('Ouvrir')}
          </button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-muted">
          {t('Code oublié ? Il se retire depuis un autre appareil connecté au même compte, ou en réinstallant l’application — ce qui efface les données locales.')}
        </p>
      </div>
    </div>
  );
}
