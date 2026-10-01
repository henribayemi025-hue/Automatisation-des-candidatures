// FINJARO ACCOUNTING — inscription par numéro de téléphone (Beau, 29/09 : « garder »).
//
// Depuis que le projet exige la confirmation de l'adresse e-mail, un compte
// créé par signUp() avec l'adresse interne <chiffres>@tel.finjaro.net ne
// pourrait jamais se connecter : cette adresse ne reçoit aucun courrier. Ici,
// le compte est créé côté serveur, déjà confirmé ; le client se connecte
// ensuite normalement avec signInWithPassword.
//
// Garde-fous :
//   - seuls des chiffres (8 à 15) deviennent une adresse, et TOUJOURS sur le
//     domaine interne : impossible de créer un compte « confirmé » sur une
//     vraie adresse e-mail par ce chemin ;
//   - limite par IP (public.check_rate_limit) : 5 inscriptions par heure ;
//   - un numéro déjà inscrit est refusé, jamais écrasé.
//
// Commune à staging et à la production, comme toutes les fonctions edge.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PHONE_DOMAIN = 'tel.finjaro.net';
const ORIGINES = [
  'https://accounting.finjaro.net',
  'http://localhost:5173',
  'http://localhost:4173',
];

function cors(origin: string | null): Record<string, string> {
  // Seulement les adresses Finjaro (audit d'Alpha du 01/10, A3) : avant,
  // n'importe quel *.workers.dev était accepté.
  const ok = !!origin && (ORIGINES.includes(origin) || /^https:\/\/[a-z0-9-]+\.finjaro\.workers\.dev$/.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin! : ORIGINES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  let corps: { telephone?: unknown; mot_de_passe?: unknown; nom?: unknown } = {};
  try { corps = await req.json(); } catch { /* vide */ }
  const chiffres = String(corps.telephone ?? '').replace(/\D/g, '');
  const motDePasse = String(corps.mot_de_passe ?? '');
  const nom = String(corps.nom ?? '').trim().slice(0, 80);
  if (chiffres.length < 8) return json({ erreur: 'Numéro trop court.' }, 400);
  if (chiffres.length > 15) return json({ erreur: 'Numéro trop long.' }, 400);
  if (motDePasse.length < 6) return json({ erreur: 'Mot de passe trop court (6 caractères minimum).' }, 400);
  if (motDePasse.length > 72) return json({ erreur: 'Mot de passe trop long.' }, 400);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'inconnue';
  const { data: autorise, error: errLimite } = await service.rpc('check_rate_limit', {
    p_bucket: `inscription-tel:${ip}`,
    p_limit: 5,
    p_window_seconds: 3600,
  });
  if (errLimite) {
    console.error('accounting-inscription-tel: limite', errLimite.message);
    return json({ erreur: 'Service momentanément indisponible. Réessayez dans un instant.' }, 503);
  }
  if (!autorise) return json({ erreur: 'Trop d’inscriptions depuis cette connexion. Réessayez dans une heure.' }, 429);

  const { error } = await service.auth.admin.createUser({
    email: `${chiffres}@${PHONE_DOMAIN}`,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { name: nom, app: 'finia', phone_login: chiffres },
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes('already') || m.includes('exists') || m.includes('registered')) {
      return json({ erreur: 'Ce numéro a déjà un compte. Connectez-vous.' }, 409);
    }
    if (m.includes('password')) return json({ erreur: 'Mot de passe trop faible. Choisissez-en un plus long.' }, 400);
    console.error('accounting-inscription-tel:', error.message);
    return json({ erreur: 'Inscription impossible pour le moment. Réessayez.' }, 500);
  }
  return json({ ok: true });
});
