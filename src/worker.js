// Worker Cloudflare : sert l'application (assets) et expose /api/assistant,
// qui parle à Gemini avec la clé gardée côté serveur. La clé ne quitte jamais
// Cloudflare : le navigateur n'y a pas accès.
//
// Même recette que l'assistante de la marketplace Finjaro : modèle rapide en
// tête, modèle de secours si Google refuse, réponse fondée sur les VRAIS
// chiffres envoyés par l'application (jamais sur ce que le modèle imagine).

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const GEMINI_TIMEOUT_MS = 30_000;
const SUPABASE_URL = 'https://bokwivwizghdlaedczbw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';
const MAX_MESSAGES = 16;
const RATE_LIMIT = 60; // appels par utilisateur et par heure (par isolat)

const usage = new Map();

function geminiKey(env) {
  if (env.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  // La clé peut avoir été enregistrée sous un autre nom dans le tableau de bord :
  // on accepte tout nom évocateur, ou toute valeur qui a la forme d'une clé Google.
  for (const [k, v] of Object.entries(env)) {
    if (typeof v !== 'string' || v.length < 20) continue;
    if (/gemini|google|api[_-]?key|ia|ai/i.test(k) || /^AIza[0-9A-Za-z_-]{20,}$/.test(v)) return v;
  }
  return null;
}

const ROUTES = [
  ['/', 'Accueil : chiffres du jour, guide de démarrage'],
  ['/pos', 'Vendre : le comptoir, enregistrer une vente ou un devis'],
  ['/caisse', 'Caisse : ouvrir/clôturer la session, écart'],
  ['/produits', 'Produits : catalogue, prix, mode tableau, import'],
  ['/stock', 'Stock : quantités, alertes, ajustements'],
  ['/achats', 'Achats : commandes fournisseurs et réceptions'],
  ['/tiers', 'Clients & fournisseurs'],
  ['/ventes', 'Ventes : historique des factures'],
  ['/devis', 'Devis en attente'],
  ['/dettes', 'Dettes & crédits : qui doit quoi, règlements'],
  ['/depenses', 'Dépenses'],
  ['/analyse', 'Résultats : marges, tendances, meilleurs produits'],
  ['/rapports', 'Documents à imprimer'],
  ['/livre-caisse', 'Livre de caisse'],
  ['/journal', 'Journal des écritures (mode expert)'],
  ['/grand-livre', 'Grand livre (mode expert)'],
  ['/balance', 'Balance générale (mode expert)'],
  ['/etats', 'Bilan & compte de résultat (mode expert)'],
  ['/audit', 'Audit : contrôles de cohérence'],
  ['/equipe', 'Équipe : inviter, rôles'],
  ['/parametres', 'Paramètres : entreprise, devise, mode simple/expert'],
];

function systemPrompt(context) {
  const routes = ROUTES.map(([r, d]) => `- ${r} : ${d}`).join('\n');
  return `Tu es l'assistante de Finjaro Accounting, l'application de gestion et de
comptabilité de l'environnement Finjaro, faite pour les boutiques, garages, salons,
restaurants et petites entreprises — d'abord en Afrique, ouverte au monde. Tu es
chaleureuse, concrète, et tu parles comme à quelqu'un qui n'est pas comptable,
sauf si la personne montre qu'elle l'est (alors tu peux être technique : SYSCOHADA,
PCG, partie double, lettrage, etc.).

LANGUE & REGISTRE (caméléon) : réponds dans la langue et le registre de la
personne — français, anglais, camfranglais, ton familier ou soutenu. Ne corrige
jamais sa façon de parler.

RÈGLE ABSOLUE SUR LES CHIFFRES : tu ne connais que les chiffres présents dans le
[Contexte] ci-dessous. Cite-les exactement, dans la devise indiquée. N'invente
JAMAIS un montant, un produit, un client ou une date. Si l'information n'est pas
dans le contexte, dis-le simplement et indique où la trouver dans l'application.

TON RÔLE :
1. Expliquer l'écran où la personne se trouve (à quoi ça sert, quand s'en servir,
   un exemple concret avec SES produits si possible).
2. Répondre à ses questions sur son activité avec ses vrais chiffres, puis
   proposer UNE prochaine étape utile.
3. Expliquer la comptabilité en mots simples quand on te le demande (par
   exemple : « une écriture en partie double, c'est noter d'où vient l'argent et
   où il va »), et en termes professionnels si la personne est comptable.
4. Aider à saisir plus vite : si la personne dicte ou photographie une liste de
   produits (nom, prix, éventuellement coût, quantité, catégorie), transforme-la
   en JSON et termine ta réponse par un bloc :
   \`\`\`products
   [{"name":"…","price":2500,"cost":1500,"stock":10,"category":"…"}]
   \`\`\`
   Les montants sont dans la devise de l'entreprise, en unités entières telles
   qu'écrites. L'application proposera de les importer ; ne dis jamais que
   c'est « fait », dis que tu proposes l'import.
5. Si la personne veut ALLER quelque part ou faire une action qui a son écran,
   dis en une phrase ce que c'est et termine par « ACTION: goto:<route> » avec
   une route EXACTE de cette liste (jamais une autre) :
${routes}

POSER LA QUESTION QUI MANQUE : si la demande est trop vague pour répondre
utilement, pose UNE question courte avec 2 ou 3 réponses possibles, puis avance.
Ne redemande jamais ce que le contexte t'apprend déjà.

QUAND ÇA NE MARCHE PAS : si la personne signale un bug ou un blocage, ne fais
jamais semblant (« videz le cache », « réessayez ») — dis que tu transmets à
l'équipe Finjaro et demande UNE précision utile (à quel moment ça bloque).

STYLE : 2 à 6 phrases, listes courtes si besoin, un emoji maximum, jamais de
titre en majuscules. Termine en proposant la suite ou en offrant de le faire
ensemble.

[Contexte]
${JSON.stringify(context ?? {}, null, 0)}`;
}

async function verifyUser(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

function rateLimited(userId) {
  const now = Date.now();
  const slot = usage.get(userId) ?? { count: 0, reset: now + 3_600_000 };
  if (now > slot.reset) {
    slot.count = 0;
    slot.reset = now + 3_600_000;
  }
  slot.count += 1;
  usage.set(userId, slot);
  return slot.count > RATE_LIMIT;
}

async function callGemini(apiKey, body) {
  let lastError = 'unknown';
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (text.trim()) return { text, model };
        lastError = 'empty';
        continue;
      }
      lastError = `${model} ${res.status}`;
      if (res.status === 400 || res.status === 403) break;
    } catch (e) {
      lastError = `${model} ${e?.name ?? 'error'}`;
    }
  }
  throw new Error(lastError);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function handleAssistant(req, env) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const apiKey = geminiKey(env);
  if (!apiKey) return json({ error: 'missing_api_key' }, 503);

  const user = await verifyUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (rateLimited(user.id)) return json({ error: 'rate_limited' }, 429);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-MAX_MESSAGES) : [];
  if (!messages.length) return json({ error: 'empty' }, 400);

  const contents = messages.map((m, i) => {
    const parts = [{ text: String(m.text ?? '').slice(0, 4000) }];
    if (i === messages.length - 1 && m.image && typeof m.image.data === 'string') {
      parts.push({ inline_data: { mime_type: m.image.mime || 'image/jpeg', data: m.image.data } });
    }
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt(payload.context) }] },
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  };

  try {
    const { text, model } = await callGemini(apiKey, body);
    return json({ text, model });
  } catch (e) {
    return json({ error: 'gemini_unavailable', detail: String(e?.message ?? e) }, 502);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/assistant') return handleAssistant(req, env);
    if (url.pathname === '/api/health') {
      // Noms des variables vues par le worker (jamais les valeurs), pour diagnostiquer.
      const vars = Object.keys(env).filter((k) => k !== 'ASSETS');
      return json({ ok: true, ai: !!geminiKey(env), variables: vars });
    }
    return env.ASSETS.fetch(req);
  },
};
