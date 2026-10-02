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
const RATE_LIMIT = 60; // appels par utilisateur et par heure
// Plafonds de taille (audit Alpha du 01/10, A-M3) : une requête énorme coûte
// cher chez Google et peut faire tomber l'isolat.
const MAX_BODY_BYTES = 20 * 1024 * 1024; // corps entier, pièces jointes comprises
const MAX_FILE_CHARS = 14_000_000; // une pièce jointe en base64 (≈ 10 Mo)
const MAX_CONTEXT_CHARS = 200_000; // contexte de l'application (chiffres, écran)
const FILE_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;

const usage = new Map();

// Seulement les noms convenus (audit A-m3) : accepter « toute variable qui
// ressemble à une clé » pouvait envoyer à Google un autre secret du worker.
// Vérifié le 01/10 : la production n'a que GEMINI_API_KEY.
function geminiKey(env) {
  return typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY ? env.GEMINI_API_KEY : null;
}

function deepseekKey(env) {
  return typeof env.DEEPSEEK_API_KEY === 'string' && env.DEEPSEEK_API_KEY ? env.DEEPSEEK_API_KEY : null;
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
  ['/rattrapage', 'Rattrapage : saisir plusieurs jours d’un coup, relevé mobile money, photo de facture'],
  ['/projets', 'Projets : budget, dépenses et recettes rattachées, marge d’un chantier, d’une ouverture, d’un événement'],
  ['/discussion', 'Discussion : fil d’équipe, photos, questions à l’assistant'],
  ['/equipe', 'Équipe : inviter, rôles'],
  ['/parametres', 'Paramètres : entreprise, devise, mode simple/expert'],
];

function systemPrompt(context) {
  const routes = ROUTES.map(([r, d]) => `- ${r} : ${d}`).join('\n');
  return `Tu es Finia, l'assistante de Finjaro. Ici, tu es dans Finjaro Accounting,
l'application qui gère les ventes, la caisse, le stock, les factures, le personnel
et les transactions des boutiques, garages, salons, restaurants et petites
entreprises, partout dans le monde. La comptabilité et l'audit se tiennent automatiquement, en plus, derrière
chaque opération : ce n'est pas le point de départ de l'application, c'est ce qui
vient avec. Tu es chaleureuse, concrète, et tu parles comme à quelqu'un qui n'est
pas comptable, sauf si la personne montre qu'elle l'est (alors tu peux être
technique : SYSCOHADA, PCG, partie double, lettrage, etc.).

LANGUE & REGISTRE (caméléon) : réponds TOUJOURS dans la langue de la personne,
quelle qu'elle soit — français, anglais, espagnol, portugais, arabe, swahili,
wolof, lingala, pidgin, camfranglais… Si elle écrit dans une langue et que
l'interface est dans une autre, sa langue à elle gagne. Garde aussi son registre,
familier ou soutenu, et ne corrige jamais sa façon de parler. Les noms de comptes
et de documents gardent leur libellé officiel, avec la traduction entre
parenthèses si besoin.

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
5. Lire une facture, un reçu ou une capture de paiement : si la photo (ou le
   texte) montre une dépense, sors les informations SANS RIEN INVENTER et
   termine par un bloc :
   \`\`\`expense
   {"date":"AAAA-MM-JJ","supplier":"…","category":"TRANSPORT","description":"…","amount":12000,"method":"CASH"}
   \`\`\`
   category parmi : PURCHASES, UTILITIES, TRANSPORT, RENT, SERVICES, PAYROLL,
   TAXES, FINANCIAL, MISC_EXPENSE. method parmi : CASH, MOBILE, CARD, BANK.
   Le montant est en unités entières de la devise de l'entreprise, taxes
   comprises. Si une information manque sur le document, laisse le champ vide
   plutôt que de le deviner, et dis ce qui manque. L'application affiche un
   formulaire prérempli : ne dis jamais que la dépense est enregistrée.

6. Lire un bilan, une balance ou un compte de résultat (PDF ou photo) : sors
   les soldes d'ouverture SANS RIEN INVENTER et termine par un bloc :
   \`\`\`opening
   {"date":"AAAA-MM-JJ","EQUIPMENT":0,"INVENTORY":0,"CUSTOMERS":0,"CASH":0,"MOBILE_MONEY":0,"BANK":0,"SUPPLIERS":0,"VAT_COLLECTED":0,"CAPITAL":0,"note":"ce qui manque ou ce qui est incertain"}
   \`\`\`
   Les montants sont en unités entières de la devise de l'entreprise, positifs.
   date = date de clôture du document. Vérifie que total actif = total passif
   et dis-le dans ta réponse ; si l'écart n'est pas nul, signale-le au lieu de
   corriger toi-même. Un poste absent du document vaut 0. L'application affiche
   un formulaire à valider : ne dis jamais que la reprise est enregistrée.

7. Si la personne veut ALLER quelque part ou faire une action qui a son écran,
   dis en une phrase ce que c'est et termine par « ACTION: goto:<route> » avec
   une route EXACTE de cette liste (jamais une autre) :
${routes}

8. Lire une page de cahier, un ticket ou plusieurs opérations sur un même papier :
   si on te demande un bloc \`\`\`operations, relève CHAQUE ligne lisible et
   réponds avec ce seul bloc (format donné dans la demande), sans bloc expense.

L'ENVIRONNEMENT FINJARO (une seule Finia, un seul compte pour tout) :
- La place de marché Finjaro, pour vendre en ligne : https://finjaro.net
- Finjaro Accounting, ici : https://accounting.finjaro.net
- Léo, les agents d'entreprise : https://finjaro.net/legion
Le même compte ouvre les trois, sans nouvelle inscription. Ici, tu ne vois que
les comptes de la personne : ni la place de marché ni Léo. N'invente aucune
fonction ni aucun chiffre sur ces services ; si on te demande un détail que tu
ne connais pas, donne le lien.

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

// Limite partagée par toutes les instances, tenue en base (audit A-M3) :
// finia_quota_assistant() compte les appels de la personne connectée sur
// l'heure. Tant que la fonction n'existe pas en base (migration à appliquer
// avec l'accord de Beau), on retombe sur le compteur en mémoire.
async function quotaExceeded(req, userId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/finia_quota_assistant`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, authorization: req.headers.get('authorization') || '', 'content-type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return (await res.json()) === false;
  } catch {
    /* base injoignable : compteur local */
  }
  return rateLimited(userId);
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
        // Clé dans l'en-tête, jamais dans l'adresse (audit A-m2) : une adresse
        // finit dans les journaux, un en-tête non.
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
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

const DEEPSEEK_TIMEOUT_MS = 30_000;

// DeepSeek : moteur de secours texte seul (pas de lecture de photo/PDF, l'API
// DeepSeek ne prend pas d'image en entrée). N'est utilisé que si Google n'a
// pas de clé, ou si Google a échoué et que le dernier message n'a pas de
// pièce jointe.
async function callDeepSeek(apiKey, systemPromptText, messages) {
  const chat = [
    { role: 'system', content: systemPromptText },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.text ?? '').slice(0, 4000),
    })),
  ];
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: chat, temperature: 0.4, max_tokens: 1024 }),
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new Error('deepseek empty');
  return { text, model: 'deepseek-chat' };
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
  const dsKey = deepseekKey(env);
  if (!apiKey && !dsKey) return json({ error: 'missing_api_key' }, 503);

  const user = await verifyUser(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (await quotaExceeded(req, user.id)) return json({ error: 'rate_limited' }, 429);

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);
  let payload;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  // Un contexte trop gros est remplacé par rien plutôt que tronqué au milieu
  // d'un JSON : l'assistant répond alors sans les chiffres, et le dit.
  if (JSON.stringify(payload.context ?? {}).length > MAX_CONTEXT_CHARS) payload.context = { note: 'contexte trop volumineux, non transmis' };
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-MAX_MESSAGES) : [];
  if (!messages.length) return json({ error: 'empty' }, 400);

  const lastMessage = messages[messages.length - 1];
  const hasFiles = Array.isArray(lastMessage?.files) ? lastMessage.files.length > 0 : !!lastMessage?.image;

  // Ni Google, ni un dernier message sans photo/PDF pour DeepSeek : on ne
  // fait pas semblant de lire un document qu'on ne peut pas voir.
  if (!apiKey && hasFiles) {
    return json({
      text: "Je ne peux pas encore lire les photos ni les PDF avec le moteur disponible en ce moment. Décrivez-moi le contenu en texte, ou réessayez plus tard.",
      model: 'deepseek-chat',
    });
  }

  if (!apiKey) {
    try {
      const { text, model } = await callDeepSeek(dsKey, systemPrompt(payload.context), messages);
      return json({ text, model });
    } catch (e) {
      return json({ error: 'gemini_unavailable', detail: String(e?.message ?? e) }, 502);
    }
  }

  const contents = messages.map((m, i) => {
    const parts = [{ text: String(m.text ?? '').slice(0, 4000) }];
    // Pièces jointes du dernier message : photos ou PDF (bilan, liasse de factures).
    if (i === messages.length - 1) {
      const files = Array.isArray(m.files) ? m.files : m.image ? [m.image] : [];
      for (const f of files.slice(0, 6)) {
        if (f && typeof f.data === 'string' && f.data.length <= MAX_FILE_CHARS && FILE_TYPES.test(String(f.mime || 'image/jpeg'))) {
          parts.push({ inline_data: { mime_type: f.mime || 'image/jpeg', data: f.data } });
        }
      }
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
    if (dsKey && !hasFiles) {
      try {
        const { text, model } = await callDeepSeek(dsKey, systemPrompt(payload.context), messages);
        return json({ text, model });
      } catch (e2) {
        return json({ error: 'gemini_unavailable', detail: String(e2?.message ?? e2) }, 502);
      }
    }
    return json({ error: 'gemini_unavailable', detail: String(e?.message ?? e) }, 502);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    // L'ancienne adresse (workers.dev) renvoie vers l'adresse officielle : un
    // vieux lien ou un favori arrive au bon endroit, et la connexion Google
    // repart depuis accounting.finjaro.net, la seule adresse déclarée à
    // Supabase. L'ancre (#/…) est conservée par le navigateur.
    // Seulement l'ancienne adresse exacte : un aperçu (wrangler versions
    // upload) sur un autre alias workers.dev doit rester testable.
    if (url.hostname === 'automatisation-des-candidatures.finjaro.workers.dev' && req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      return Response.redirect(`https://accounting.finjaro.net${url.pathname}${url.search}`, 301);
    }
    if (url.pathname === '/api/assistant') return handleAssistant(req, env);
    if (url.pathname === '/api/health') {
      // Seulement « ça marche / l'IA est branchée » : les noms des variables
      // renseignaient un curieux sur la configuration (audit A-m1).
      return json({ ok: true, ai: !!geminiKey(env) || !!deepseekKey(env) });
    }
    return env.ASSETS.fetch(req);
  },
};
