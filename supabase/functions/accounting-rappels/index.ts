// FINJARO ACCOUNTING — e-mails aux utilisateurs (Beau, 29/09).
//
//   mode « soir »    : chaque soir, un rappel court de noter la journée, SEULEMENT
//                      à qui a utilisé l'application ces 14 derniers jours et n'a
//                      encore rien noté depuis ce matin (pas de rappel inutile).
//   mode « semaine » : une fois par semaine, à tous les utilisateurs : les
//                      nouveautés et « comment ça se passe ? ».
//
// Règles tenues : jamais les comptes de test (profiles.is_test), jamais les
// numéros de téléphone (adresse interne @tel.finjaro.net, aucun courrier),
// toujours le choix de la personne (emails_for_users ne renvoie pas qui a coupé
// les e-mails), signé « L'équipe Finjaro », « Répondre » vers la boîte de
// l'équipe, et un moyen de ne plus recevoir. Aucun chiffre inventé : les
// nouveautés citées sont en ligne et vérifiées.
//
// Appelée par la tâche planifiée (voir la migration accounting_rappels), avec
// le jeton app_secrets 'accounting_rappels' dans l'en-tête x-finjaro-token.
// `{"dry_run": true}` renvoie les destinataires comptés sans rien envoyer.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const APP_URL = 'https://accounting.finjaro.net';
const SUPPORT_EMAIL = 'fin.finjaro@gmail.com';
const PHONE_DOMAIN = '@tel.finjaro.net';

type Mode = 'soir' | 'semaine';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

function pied(): string {
  return `<p style="margin-top:24px;color:#6B6B6B;font-size:13px">L'équipe Finjaro<br>
Une question, une idée ? Répondez simplement à cet e-mail.<br>
Pour ne plus recevoir ces e-mails : <a href="${APP_URL}/#/parametres">Paramètres → E-mails de Finjaro</a>, ou répondez « STOP ».</p>`;
}

function contenu(mode: Mode, prenom: string): { sujet: string; html: string } {
  const sur = prenom.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const bonjour = sur ? `Bonjour ${sur},` : 'Bonjour,';
  if (mode === 'soir') {
    return {
      sujet: 'Vos ventes du jour sont-elles notées ?',
      html: `<p>${bonjour}</p>
<p>Deux minutes avant de fermer : notez vos ventes et vos dépenses de la journée dans Finjaro Accounting. Vos comptes restent justes et votre bénéfice du mois aussi.</p>
<p><a href="${APP_URL}/#/pos" style="display:inline-block;background:#C25E38;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">Noter ma journée</a></p>
<p>Pas de réseau ? L'application s'ouvre quand même sur votre téléphone si vous l'avez déjà ouverte une fois : vos ventes partent dès que la connexion revient.</p>
${pied()}`,
    };
  }
  return {
    sujet: 'Comment ça se passe avec Finjaro Accounting ?',
    html: `<p>${bonjour}</p>
<p>Comment ça se passe dans votre commerce ? Dites-le-nous en répondant à cet e-mail : ce qui marche, ce qui gêne, ce qui manque. On lit tout.</p>
<p><b>Ce qui est nouveau :</b></p>
<ul>
<li>Vous vendez en ligne sur Finjaro ? Vos articles se reprennent en un clic dans votre catalogue.</li>
<li>Vous ne voulez pas gérer de stock ? Dans Paramètres, décochez « Je suis des quantités en stock » : vous encaissez des montants, et le bénéfice se calcule tout seul (ce qui est rentré moins ce qui est sorti), à condition de noter vos achats en dépenses.</li>
<li>L'accueil vous signale les jours où rien n'a été noté, pour rattraper en une fois.</li>
<li>Un bouton « Nous contacter » et « Une suggestion » dans le menu.</li>
</ul>
<p>Et toujours : sans réseau, l'application s'ouvre sur votre téléphone (si vous l'avez déjà ouverte une fois) et vos ventes partent dès que la connexion revient.</p>
<p><a href="${APP_URL}" style="display:inline-block;background:#C25E38;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">Ouvrir Finjaro Accounting</a></p>
${pied()}`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const { data: secret } = await service.from('app_secrets').select('value').eq('name', 'accounting_rappels').maybeSingle();
  if (!secret?.value || req.headers.get('x-finjaro-token') !== secret.value) return json({ erreur: 'Non autorisé.' }, 401);

  let corps: { mode?: string; dry_run?: boolean } = {};
  try { corps = await req.json(); } catch { /* corps vide : valeurs par défaut */ }
  const mode: Mode = corps.mode === 'semaine' ? 'semaine' : 'soir';

  // Qui utilise Accounting : propriétaires d'un espace et membres actifs.
  const [{ data: espaces }, { data: membres }] = await Promise.all([
    service.from('finia_workspaces').select('owner_id'),
    service.from('finia_members').select('user_id').eq('status', 'active').not('user_id', 'is', null),
  ]);
  let ids = [...new Set([
    ...((espaces ?? []) as Array<{ owner_id: string }>).map((w) => w.owner_id),
    ...((membres ?? []) as Array<{ user_id: string }>).map((m) => m.user_id),
  ].filter(Boolean))];

  // Jamais les comptes de test.
  if (ids.length) {
    const { data: tests } = await service.from('profiles').select('id').in('id', ids).eq('is_test', true);
    const exclus = new Set(((tests ?? []) as Array<{ id: string }>).map((p) => p.id));
    ids = ids.filter((id) => !exclus.has(id));
  }

  if (mode === 'soir' && ids.length) {
    // Actifs ces 14 jours, mais rien noté depuis 12 h (l'envoi part vers 19 h au Cameroun).
    const depuis14 = new Date(Date.now() - 14 * 86400_000).toISOString();
    const depuis12h = new Date(Date.now() - 12 * 3600_000).toISOString();
    const { data: recents } = await service.from('finia_events').select('actor_id, at').in('actor_id', ids).gte('at', depuis14);
    const actifs = new Set<string>();
    const aujourdhui = new Set<string>();
    for (const e of (recents ?? []) as Array<{ actor_id: string; at: string }>) {
      actifs.add(e.actor_id);
      if (e.at >= depuis12h) aujourdhui.add(e.actor_id);
    }
    ids = ids.filter((id) => actifs.has(id) && !aujourdhui.has(id));
  }

  // Adresses : la fonction ne renvoie pas qui a coupé les e-mails.
  const { data: adresses } = ids.length ? await service.rpc('emails_for_users', { p_ids: ids }) : { data: [] };
  const cibles = ((adresses ?? []) as Array<{ id: string; email: string }>).filter((a) => a.email && !a.email.endsWith(PHONE_DOMAIN));
  if (corps.dry_run) return json({ mode, destinataires: cibles.length });
  if (!cibles.length) return json({ mode, envoyes: 0 });

  const { data: profils } = await service.from('profiles').select('id, name').in('id', cibles.map((c) => c.id));
  const prenomDe = new Map(((profils ?? []) as Array<{ id: string; name: string | null }>).map((p) => [p.id, String(p.name ?? '').trim().split(/\s+/)[0] ?? '']));

  const { data: cfg } = await service.from('app_config').select('value').eq('key', 'resend').maybeSingle();
  const conf = (cfg?.value ?? null) as { api_key?: string; from?: string } | null;
  const cle = Deno.env.get('RESEND_API_KEY') ?? conf?.api_key;
  if (!cle) return json({ erreur: 'Envoi d’e-mails non configuré.' }, 500);
  const from = conf?.from ?? 'Finjaro <notifications@finjaro.net>';

  let envoyes = 0;
  for (let i = 0; i < cibles.length; i += 100) {
    const lot = cibles.slice(i, i + 100).map((c) => {
      const { sujet, html } = contenu(mode, prenomDe.get(c.id) ?? '');
      return {
        from,
        to: [c.email],
        reply_to: [SUPPORT_EMAIL],
        subject: sujet,
        html,
        headers: { 'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}?subject=STOP>` },
      };
    });
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lot),
      signal: AbortSignal.timeout(20_000),
    }).catch((e) => { console.error('accounting-rappels:', (e as Error).message); return null; });
    if (r?.ok) envoyes += lot.length;
    else if (r) console.error('accounting-rappels:', r.status, (await r.text()).slice(0, 300));
  }
  return json({ mode, envoyes, sur: cibles.length });
});
