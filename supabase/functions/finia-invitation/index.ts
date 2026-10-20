// FINJARO ACCOUNTING — l'e-mail d'invitation (Beau, 14/10 : un collègue invité
// s'attendait à recevoir un e-mail avec un lien).
//
// Appelée par l'application juste après l'ajout d'un membre (écran Équipe),
// avec le jeton de la personne connectée. Garde-fous :
//   - seule la propriétaire ou un gérant de l'espace peut déclencher l'envoi ;
//   - l'adresse doit être une invitation EN ATTENTE de cet espace (membre pas
//     encore connecté) : impossible d'écrire à n'importe qui ;
//   - l'invitation doit dater de moins de 10 minutes : l'e-mail accompagne un
//     geste d'invitation, on ne peut pas renvoyer en boucle sans réinviter ;
//   - jamais d'adresse interne de téléphone (@tel.finjaro.net) ;
//   - aucun lien de connexion ni jeton : ni l'authentification ni le Site URL
//     ne sont touchés.
//
// Fonction commune à la préproduction et à la production, et partagée avec la
// place de marché : ne se déploie qu'avec le mot de Beau.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { invitation } from './contenu.ts';

const SUPPORT_EMAIL = 'fin.finjaro@gmail.com';
const PHONE_DOMAIN = '@tel.finjaro.net';
const ORIGINS = new Set(['https://accounting.finjaro.net', 'http://localhost:5173']);

function cors(req: Request): Record<string, string> {
  const o = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.has(o) ? o : 'https://accounting.finjaro.net',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const h = cors(req);
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const jeton = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jeton) return json({ erreur: 'Connexion requise.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: qui, error: eQui } = await service.auth.getUser(jeton);
  if (eQui || !qui?.user) return json({ erreur: 'Connexion requise.' }, 401);
  const moi = qui.user;

  const corps = (await req.json().catch(() => ({}))) as { workspace_id?: string; email?: string };
  const espaceId = String(corps.workspace_id ?? '');
  const email = String(corps.email ?? '').trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(espaceId) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ erreur: 'Demande incomplète.' }, 400);
  if (email.endsWith(PHONE_DOMAIN)) return json({ envoye: false, raison: 'telephone' });

  // Qui demande : la propriétaire, ou un gérant actif de l'espace.
  const { data: espace } = await service.from('finia_workspaces').select('id, name, owner_id').eq('id', espaceId).maybeSingle();
  if (!espace) return json({ erreur: 'Espace introuvable.' }, 404);
  let autorise = espace.owner_id === moi.id;
  if (!autorise) {
    const { data: m } = await service.from('finia_members').select('role, status').eq('workspace_id', espaceId).eq('user_id', moi.id).maybeSingle();
    autorise = m?.status === 'active' && m?.role === 'manager';
  }
  if (!autorise) return json({ erreur: 'Seuls la propriétaire et les gérants invitent.' }, 403);

  // L'invitation : en attente (personne pas encore connectée), récente.
  const { data: inv } = await service
    .from('finia_members')
    .select('role, status, user_id, updated_at')
    .eq('workspace_id', espaceId)
    .eq('email', email)
    .maybeSingle();
  if (!inv || inv.status === 'removed' || inv.user_id) return json({ erreur: 'Aucune invitation en attente pour cette adresse.' }, 409);
  if (Date.now() - new Date(inv.updated_at as string).getTime() > 10 * 60_000) return json({ erreur: 'Invitation trop ancienne : invitez à nouveau pour renvoyer l’e-mail.' }, 409);

  const { data: profil } = await service.from('profiles').select('name').eq('id', moi.id).maybeSingle();
  const inviteur = String(profil?.name ?? moi.user_metadata?.full_name ?? '').trim();
  const { sujet, html, texte } = invitation({ inviteur, espace: String(espace.name ?? ''), role: String(inv.role ?? ''), email });

  const { data: cfg } = await service.from('app_config').select('value').eq('key', 'resend').maybeSingle();
  const conf = (cfg?.value ?? null) as { api_key?: string; from?: string } | null;
  const cle = Deno.env.get('RESEND_API_KEY') ?? conf?.api_key;
  if (!cle) return json({ erreur: 'Envoi d’e-mails non configuré.' }, 500);
  const from = conf?.from ?? 'Finjaro <notifications@finjaro.net>';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], reply_to: [SUPPORT_EMAIL], subject: sujet, html, text: texte }),
    signal: AbortSignal.timeout(15_000),
  }).catch((e) => { console.error('finia-invitation:', (e as Error).message); return null; });
  if (!r?.ok) {
    if (r) console.error('finia-invitation:', r.status, (await r.text()).slice(0, 300));
    return json({ erreur: 'L’e-mail n’est pas parti.' }, 502);
  }
  return json({ envoye: true });
});
