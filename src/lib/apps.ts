import { supabase } from './supabase';

export interface FinjaroApp {
  key: string;
  name: string;
  tagline: string;
  url: string;
  emoji: string;
  accent: 'teal' | 'brass' | 'ink';
  audience: 'tous' | 'vendeuse' | 'admin';
  sort_order: number;
}

export const CURRENT_APP_KEY = 'accounting';

/** Filet de secours hors ligne — la table finjaro_apps fait foi dès qu'elle répond. */
export const FALLBACK_APPS: FinjaroApp[] = [
  { key: 'marketplace', name: 'Finjaro', tagline: 'La place de marché : acheter, vendre, se faire livrer.', url: 'https://finjaro.net', emoji: '🛍️', accent: 'teal', audience: 'tous', sort_order: 10 },
  { key: 'accounting', name: 'Finjaro Accounting', tagline: 'Caisse, stock, factures et comptabilité pour ta boutique.', url: 'https://automatisation-des-candidatures.finjaro.workers.dev', emoji: '📒', accent: 'brass', audience: 'tous', sort_order: 20 },
];

export async function fetchApps(): Promise<FinjaroApp[]> {
  const { data, error } = await supabase
    .from('finjaro_apps')
    .select('key, name, tagline, url, emoji, accent, audience, sort_order')
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
