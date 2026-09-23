import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { t } from '../lib/i18n';

/**
 * Le relais de connexion entre les applications Finjaro.
 *
 * Quelqu'un déjà connecté sur finjaro.net clique « Accounting » : la place de
 * marché lui donne un code à usage unique (60 s), et l'ouvre ici avec
 * `#/relais?code=…&vers=/dettes`. Cette page échange le code contre une
 * vraie session — sans mot de passe, sans e-mail envoyé — puis l'amène là où
 * elle voulait aller. Un code refusé (expiré, déjà utilisé) retombe sur
 * l'écran de connexion habituel : rien de pire qu'aujourd'hui.
 *
 * Ni le Site URL ni les Redirect URLs ne bougent : ce passage ne touche pas
 * aux redirections d'auth, il appelle une fonction edge commune
 * (`sso-relais`) posée par la place de marché.
 */

/** Un chemin de CE site, jamais une adresse externe. `//evil.com` ressemble à
 * un chemin relatif pour un navigateur mais change d'hôte : refusé. */
export function cheminSur(vers: string | null): string {
  if (!vers || !vers.startsWith('/') || vers.startsWith('//')) return '/';
  return vers;
}

export default function Relais() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const vers = cheminSur(params.get('vers'));
  const [etat, setEtat] = useState<'en_cours' | 'echoue'>('en_cours');

  useEffect(() => {
    if (!code) {
      setEtat('echoue');
      return;
    }
    let annule = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke('sso-relais', {
        body: { action: 'echanger', code },
      });
      if (annule) return;
      const access_token = data?.access_token as string | undefined;
      const refresh_token = data?.refresh_token as string | undefined;
      if (error || !access_token || !refresh_token) {
        setEtat('echoue');
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (annule) return;
      if (sessionError) {
        setEtat('echoue');
        return;
      }
      window.location.hash = `#${vers}`;
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Code absent, expiré ou déjà utilisé : l'écran de connexion habituel,
  // sans rien dire de plus — le code est un détail technique, pas une erreur
  // que la personne a commise.
  if (etat === 'echoue') return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-screen place-items-center bg-base">
      <div className="animate-pulse text-center leading-tight">
        <span className="block font-display text-[28px] font-bold text-teal">{t('Finjaro')}</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6A3D]">{t('Accounting')}</span>
        <span className="mt-3 block text-caption text-muted">{t('Connexion…')}</span>
      </div>
    </div>
  );
}
