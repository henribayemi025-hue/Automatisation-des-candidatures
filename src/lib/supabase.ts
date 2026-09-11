import { createClient } from '@supabase/supabase-js';

// Clé publiable (côté client par conception, protégée par les politiques RLS).
// Base partagée de l'environnement Finjaro : cette application n'utilise que les tables finia_*.
const SUPABASE_URL = 'https://bokwivwizghdlaedczbw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'finia.auth',
    /**
     * PKCE, et non le flux implicite par défaut.
     *
     * L'application navigue par ancres (`#/produits`). Le flux implicite
     * renvoie la session DANS l'ancre (`#access_token=…`) — exactement là où
     * le routeur écrit ses adresses. Le routeur réécrivait l'ancre en `#/`
     * avant que la session soit lue : le jeton disparaissait, et « Continuer
     * avec Google » retombait sur la page de connexion, sans message.
     *
     * PKCE renvoie `?code=…` dans la requête, qui ne touche pas à l'ancre.
     */
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
});

/**
 * Retire le `?code=…` (ou l'erreur) laissé par le retour de Google une fois la
 * session établie, pour que l'adresse reste propre et qu'un rechargement ne
 * rejoue pas un code déjà consommé.
 */
export function cleanAuthParams(): void {
  const url = new URL(window.location.href);
  const had = ['code', 'error', 'error_description', 'error_code', 'state'].filter((k) => url.searchParams.has(k));
  if (!had.length) return;
  for (const k of had) url.searchParams.delete(k);
  window.history.replaceState({}, '', url.toString());
}

/** Message d'erreur renvoyé par le fournisseur dans l'adresse, s'il y en a un. */
export function authErrorInUrl(): string | null {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (fromQuery) return fromQuery;
  // Le flux implicite d'anciens liens peut encore poser l'erreur dans l'ancre.
  const hash = window.location.hash.startsWith('#/') ? '' : window.location.hash.slice(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('error_description') ?? params.get('error');
}
