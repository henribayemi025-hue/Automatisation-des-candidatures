import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { toMinor } from './money';
import type { DB, Minor } from './types';

export interface ImportRow {
  name: string;
  price: Minor;
  cost: Minor;
  stock: number;
  category: string;
  sku: string;
  source: string;
}

/** Taux indicatifs FCFA → devise, les mêmes que la marketplace. À vérifier par la personne. */
const FROM_FCFA: Record<string, number> = { XAF: 1, XOF: 1, EUR: 0.001524, USD: 0.00165, GBP: 0.0013 };

/** Les articles de la boutique Finjaro de la personne (lecture seule, ses propres boutiques). */
export async function fetchFinjaroProducts(userId: string, currency: string): Promise<{ rows: ImportRow[]; converted: boolean; shops: string[] }> {
  const { data: shops, error } = await supabase.from('shops').select('id, name').eq('owner_id', userId);
  if (error || !shops?.length) return { rows: [], converted: false, shops: [] };
  const { data: products } = await supabase
    .from('products')
    .select('name, price_fcfa, category, stock, is_active')
    .in('shop_id', shops.map((s) => s.id))
    .order('name');
  const rate = FROM_FCFA[currency] ?? null;
  const rows: ImportRow[] = (products ?? []).map((p) => {
    const fcfa = Number(p.price_fcfa) || 0;
    const price = rate === null ? fcfa : rate === 1 ? fcfa : toMinor(fcfa * rate, currency);
    return {
      name: String(p.name),
      price,
      cost: 0,
      stock: Number(p.stock) || 0,
      category: String(p.category ?? ''),
      sku: '',
      source: 'finjaro',
    };
  });
  return { rows, converted: rate !== null && rate !== 1, shops: shops.map((s) => String(s.name)) };
}

const HEADERS: Record<keyof Omit<ImportRow, 'source'>, string[]> = {
  name: ['nom', 'name', 'produit', 'article', 'désignation', 'designation', 'libellé', 'libelle'],
  price: ['prix', 'price', 'prix de vente', 'pv', 'vente', 'selling price'],
  cost: ['coût', 'cout', 'cost', "prix d'achat", 'prix achat', 'pa', 'achat', 'purchase price'],
  stock: ['stock', 'quantité', 'quantite', 'qty', 'qte', 'quantity'],
  category: ['catégorie', 'categorie', 'category', 'rayon', 'famille'],
  sku: ['référence', 'reference', 'ref', 'sku', 'code'],
};

function findColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const i = norm.indexOf(c);
    if (i >= 0) return i;
  }
  for (const c of candidates) {
    const i = norm.findIndex((h) => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

/** Lit un fichier Excel ou CSV : la première ligne donne les colonnes, dans n'importe quel ordre. */
export async function parseSpreadsheet(file: File, currency: string): Promise<{ rows: ImportRow[]; missing: string[] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });
  if (!grid.length) return { rows: [], missing: ['fichier vide'] };
  const headers = (grid[0] as unknown[]).map((h) => String(h ?? ''));
  const col = {
    name: findColumn(headers, HEADERS.name),
    price: findColumn(headers, HEADERS.price),
    cost: findColumn(headers, HEADERS.cost),
    stock: findColumn(headers, HEADERS.stock),
    category: findColumn(headers, HEADERS.category),
    sku: findColumn(headers, HEADERS.sku),
  };
  const missing: string[] = [];
  if (col.name < 0) missing.push('nom du produit');
  if (col.price < 0) missing.push('prix de vente');
  if (missing.length) return { rows: [], missing };

  const cell = (row: unknown[], i: number) => (i >= 0 ? String(row[i] ?? '').trim() : '');
  const rows: ImportRow[] = [];
  for (const raw of grid.slice(1) as unknown[][]) {
    const name = cell(raw, col.name);
    if (!name) continue;
    rows.push({
      name,
      price: toMinor(cell(raw, col.price).replace(/[^\d.,-]/g, '') || 0, currency),
      cost: toMinor(cell(raw, col.cost).replace(/[^\d.,-]/g, '') || 0, currency),
      stock: parseInt(cell(raw, col.stock).replace(/[^\d-]/g, '') || '0', 10) || 0,
      category: cell(raw, col.category),
      sku: cell(raw, col.sku),
      source: file.name,
    });
  }
  return { rows, missing: [] };
}

/** Écarte les produits déjà présents (même nom, insensible à la casse). */
export function dedupe(rows: ImportRow[], db: DB): { fresh: ImportRow[]; skipped: number } {
  const existing = new Set(db.products.filter((p) => !p.archived).map((p) => p.name.trim().toLowerCase()));
  const seen = new Set<string>();
  const fresh: ImportRow[] = [];
  let skipped = 0;
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    if (existing.has(key) || seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    fresh.push(r);
  }
  return { fresh, skipped };
}
