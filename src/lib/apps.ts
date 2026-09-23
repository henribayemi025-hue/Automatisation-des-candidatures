import { supabase } from './supabase';

export interface FinjaroApp {
  key: string;
  name: string;
  tagline: string;
  url: string;
  emoji: string;
  // Le vrai logo, posé par Alpha dans finjaro_apps.logo_url (colonne
  // additive). Absent pour la console admin, qui garde l'emoji.
  logo_url?: string | null;
  // L'adresse de la page d'arrivée du relais de connexion chez CETTE
  // application (ex. 'https://finjaro.net/relais') — posée par Alpha,
  // finjaro_apps.relais. Vide : l'application ne sait pas encore recevoir un
  // code, on ouvre son adresse normale sans passer par le relais.
  relais?: string | null;
  accent: 'teal' | 'brass' | 'ink';
  audience: 'tous' | 'vendeuse' | 'admin';
  sort_order: number;
}

export const CURRENT_APP_KEY = 'accounting';

/** Filet de secours hors ligne — la table finjaro_apps fait foi dès qu'elle répond. */
export const FALLBACK_APPS: FinjaroApp[] = [
  { key: 'marketplace', name: 'Finjaro', tagline: 'La place de marché : acheter, vendre, se faire livrer.', url: 'https://finjaro.net', emoji: '🛍️', accent: 'teal', audience: 'tous', sort_order: 10 },
  { key: 'accounting', name: 'Finjaro Accounting', tagline: 'Caisse, stock, factures et comptabilité pour ta boutique.', url: 'https://accounting.finjaro.net', emoji: '📒', accent: 'brass', audience: 'tous', sort_order: 20 },
];

export async function fetchApps(): Promise<FinjaroApp[]> {
  const { data, error } = await supabase
    .from('finjaro_apps')
    .select('key, name, tagline, url, emoji, logo_url, relais, accent, audience, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return FALLBACK_APPS;
  return data as FinjaroApp[];
}

export interface AudienceFlags {
  admin: boolean;
  vendor: boolean;
}

/** Profil Finjaro de la personne : admin de la plateforme, ou propriétaire d'une boutique. */
export async function fetchAudience(userId: string | null): Promise<AudienceFlags> {
  if (!userId) return { admin: false, vendor: false };
  const [adminRes, shopRes] = await Promise.all([
    supabase.rpc('is_admin').then((r) => r, () => ({ data: false })),
    supabase.from('shops').select('id').eq('owner_id', userId).limit(1).then((r) => r, () => ({ data: [] })),
  ]);
  return {
    admin: adminRes.data === true,
    vendor: Array.isArray(shopRes.data) && shopRes.data.length > 0,
  };
}

export function visibleApps(apps: FinjaroApp[], flags: AudienceFlags): FinjaroApp[] {
  return apps.filter((a) => {
    if (a.audience === 'admin') return flags.admin;
    if (a.audience === 'vendeuse') return flags.admin || flags.vendor;
    return true;
  });
}

/**
 * Demande un code de relais (60 s, usage unique) pour ouvrir une autre
 * application Finjaro déjà connectée — le sens Accounting → finjaro.net.
 * Renvoie `null` sans rien casser si la fonction échoue (compte inscrit par
 * téléphone sans e-mail, réseau coupé…) : l'appelant retombe alors sur
 * l'adresse normale de l'application, comme avant le relais.
 */
export async function creerCodeRelais(cible: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('sso-relais', {
      body: { action: 'creer', cible },
    });
    if (error) return null;
    const code = (data as { code?: string } | null)?.code;
    return typeof code === 'string' && code ? code : null;
  } catch {
    return null;
  }
}

/** L'adresse du relais une fois le code obtenu. Séparée de urlVers pour être
 * vérifiée sans réseau : c'est là que vivrait un `//` ou un code mal échappé. */
export function adresseRelais(relais: string, code: string, vers: string): string {
  return `${relais}?code=${encodeURIComponent(code)}&vers=${encodeURIComponent(vers)}`;
}

/** L'adresse à ouvrir pour rejoindre `app`, en passant par son relais de
 * connexion quand il existe et qu'on a une session à lui transmettre. */
export async function urlVers(app: FinjaroApp, connecte: boolean, vers = '/'): Promise<string> {
  if (!connecte || !app.relais) return app.url;
  const code = await creerCodeRelais(app.key);
  if (!code) return app.url;
  return adresseRelais(app.relais, code, vers);
}
