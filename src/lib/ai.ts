import { supabase } from './supabase';
import { insights } from './assistant';
import { outstanding, productPerformance, snapshot } from './metrics';
import { formatMoney } from './money';
import { MODULE_HELP } from './guide';
import type { DB } from './types';
import { getLang } from './i18n';

export interface AIMessage {
  role: 'user' | 'assistant';
  text: string;
  image?: { mime: string; data: string };
}

export interface AIProduct {
  name: string;
  price: number;
  cost?: number;
  stock?: number;
  category?: string;
}

/** Dépense lue sur une facture ou un reçu, à confirmer par la personne. */
export interface AIExpense {
  date: string;
  supplier: string;
  category: string;
  description: string;
  amount: number;
  method: string;
}

export interface AIResult {
  text: string;
  goto: string | null;
  products: AIProduct[];
  expense: AIExpense | null;
}

/** Résumé compact et exact de l'activité : la seule source de chiffres de l'IA. */
export function buildContext(db: DB, pathname: string) {
  const s = snapshot(db);
  const money = (v: number) => formatMoney(v, db.company.currency);
  const help = MODULE_HELP[pathname];
  return {
    langue_interface: getLang() === 'en' ? 'English' : 'Français',
    entreprise: db.company.name,
    activite: db.company.sector,
    devise: db.company.currency,
    referentiel: db.company.chart,
    mode: db.company.mode,
    ecran: { route: pathname, nom: help?.title ?? pathname, role: help?.what ?? '' },
    aujourdhui: { ca: money(s.revenueToday), ventes: s.salesToday },
    ce_mois: {
      ca: money(s.revenueMonth),
      ventes: s.salesMonth,
      depenses: money(s.expensesMonth),
      marge_brute: money(s.grossMargin),
      resultat_net: money(s.netIncome),
    },
    tresorerie: money(s.cashOnHand),
    creances_clients: money(s.receivables),
    dettes_fournisseurs: money(s.payables),
    stock: { valeur: money(s.stockValue), references: db.products.filter((p) => !p.archived).length, ruptures: s.outOfStock, bas: s.lowStock },
    produits: db.products
      .filter((p) => !p.archived)
      .slice(0, 40)
      .map((p) => ({ nom: p.name, prix: money(p.price), cout: money(p.cost), stock: p.stock, seuil: p.reorderPoint, categorie: p.category })),
    meilleurs_produits_mois: productPerformance(db).slice(0, 5).map((p) => ({ nom: p.name, qte: p.qty, ca: money(p.revenue), marge: money(p.margin) })),
    qui_me_doit: db.debts
      .filter((d) => d.party === 'CUSTOMER' && outstanding(d) > 0)
      .slice(0, 10)
      .map((d) => ({ nom: d.partyName, reste: money(outstanding(d)), depuis: d.date })),
    ce_que_je_dois: db.debts
      .filter((d) => d.party === 'SUPPLIER' && outstanding(d) > 0)
      .slice(0, 10)
      .map((d) => ({ nom: d.partyName, reste: money(outstanding(d)), depuis: d.date })),
    dernieres_ventes: db.sales
      .filter((x) => x.status === 'CONFIRMED')
      .slice(0, 5)
      .map((x) => ({ numero: x.number, date: x.date, client: x.customerName, total: money(x.total), paye: money(x.paid) })),
    dernieres_depenses: db.expenses.slice(0, 5).map((e) => ({ date: e.date, poste: e.category, montant: money(e.amount) })),
    caisse_ouverte: db.sessions.some((x) => !x.closedAt),
    alertes: insights(db).map((t) => t.text),
  };
}

export function parseAI(text: string): AIResult {
  let goto: string | null = null;
  const products: AIProduct[] = [];
  let expense: AIExpense | null = null;
  let clean = text;

  const action = clean.match(/ACTION:\s*goto:(\S+)/);
  if (action) {
    goto = action[1].replace(/[.,;]+$/, '');
    clean = clean.replace(action[0], '').trim();
  }
  const block = clean.match(/```products\s*([\s\S]*?)```/);
  if (block) {
    try {
      const parsed = JSON.parse(block[1]);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && typeof p.name === 'string' && p.name.trim()) {
            products.push({
              name: p.name.trim(),
              price: Number(p.price) || 0,
              cost: Number(p.cost) || 0,
              stock: Number(p.stock) || 0,
              category: typeof p.category === 'string' ? p.category : '',
            });
          }
        }
      }
    } catch {
      // Bloc mal formé : on garde le texte, sans import.
    }
    clean = clean.replace(block[0], '').trim();
  }
  const expenseBlock = clean.match(/```expense\s*([\s\S]*?)```/);
  if (expenseBlock) {
    try {
      const p = JSON.parse(expenseBlock[1]) as Record<string, unknown>;
      const amount = Number(p.amount) || 0;
      expense = {
        date: typeof p.date === 'string' ? p.date : '',
        supplier: typeof p.supplier === 'string' ? p.supplier : '',
        category: typeof p.category === 'string' ? p.category : '',
        description: typeof p.description === 'string' ? p.description : '',
        amount,
        method: typeof p.method === 'string' ? p.method : 'CASH',
      };
    } catch {
      // Bloc mal formé : on garde le texte, sans formulaire prérempli.
    }
    clean = clean.replace(expenseBlock[0], '').trim();
  }

  return { text: clean, goto, products, expense };
}

export class AIError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function askAI(messages: AIMessage[], context: unknown): Promise<AIResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIError('unauthorized');
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages, context }),
  });
  const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok || !body.text) throw new AIError(body.error ?? `http_${res.status}`);
  return parseAI(body.text);
}

export function aiErrorMessage(code: string): string {
  switch (code) {
    case 'unauthorized':
      return 'Connectez-vous pour utiliser l’assistant IA — en attendant, je réponds avec le moteur local.';
    case 'missing_api_key':
      return 'La clé IA n’est pas encore configurée sur le serveur. Je réponds avec le moteur local.';
    case 'rate_limited':
      return 'Beaucoup de questions d’un coup — reprenons dans quelques minutes. En attendant, moteur local.';
    default:
      return 'L’IA ne répond pas pour le moment. Je réponds avec le moteur local.';
  }
}

/** Convertit une photo en base64 (sans le préfixe data:) et la réduit pour l'envoi. */
export function fileToImage(file: File): Promise<{ mime: string; data: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1280;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ mime: 'image/jpeg', data: dataUrl.split(',')[1] });
    };
    img.onerror = () => reject(new Error('image'));
    img.src = url;
  });
}
