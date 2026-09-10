import { createClient } from '@supabase/supabase-js';

// Clé publiable (côté client par conception, protégée par les politiques RLS).
// Base partagée de l'environnement Finjaro : Finia n'utilise que les tables finia_*.
const SUPABASE_URL = 'https://bokwivwizghdlaedczbw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'finia.auth',
  },
});
