/**
 * Le catalogue de la place de marché Finjaro, vu depuis Accounting.
 *
 * Contrat du 14/10 avec la place de marché (migration 0244) :
 * - `finia_publier_article` met (ou remet) un article dans la boutique de la
 *   propriétaire de l'espace, avec une photo obligatoire ;
 * - `finia_synchroniser_stock` recopie notre stock réel sur les articles déjà
 *   publiés. Le serveur retire lui-même les quantités commandées et pas encore
 *   livrées : on envoie TOUJOURS le stock réel, sans rien soustraire.
 *
 * Les deux fonctions refusent tout autre que la propriétaire de l'espace.
 */
import { supabase } from './supabase';
import type { Company, Product } from './types';

export interface FinjaroShop {
  id: string;
  name: string;
}

export interface PublishedArticle {
  id: string;
  ref: string;
  image: string | null;
  description: string;
}

/** Les boutiques actives de la personne sur Finjaro. */
export async function activeShops(userId: string): Promise<FinjaroShop[]> {
  const { data, error } = await supabase.from('shops').select('id, name').eq('owner_id', userId).eq('status', 'active').order('name');
  if (error) throw error;
  return (data ?? []).map((s) => ({ id: String(s.id), name: String(s.name) }));
}

/** Les articles d'Accounting déjà publiés dans ses boutiques, par référence. */
export async function publishedArticles(userId: string): Promise<Map<string, PublishedArticle>> {
  const { data: shops, error } = await supabase.from('shops').select('id').eq('owner_id', userId);
  if (error) throw error;
  const out = new Map<string, PublishedArticle>();
  if (!shops?.length) return out;
  const { data, error: e2 } = await supabase
    .from('products')
    .select('id, accounting_ref, images, description')
    .in('shop_id', shops.map((s) => s.id))
    .not('accounting_ref', 'is', null);
  if (e2) throw e2;
  for (const p of data ?? []) {
    const ref = String(p.accounting_ref);
    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    out.set(ref, { id: String(p.id), ref, image: images[0] ?? null, description: String(p.description ?? '') });
  }
  return out;
}

/**
 * Peut-on proposer « Publier sur Finjaro » pour cet article ?
 * Un plat composé n'a pas de stock à lui (il vient des ingrédients), une
 * prestation n'en a pas du tout : version 1, on ne les publie pas.
 */
export function publishable(product: Product): boolean {
  return !product.archived && !product.components?.length && product.kind !== 'SERVICE';
}

/** Le prix que la cliente paie, celui qu'on affiche sur Finjaro. */
export function buyerPrice(company: Company, product: Product): number {
  const rate = company.vatEnabled ? company.vatRateBp : 0;
  if (!rate || company.pricesIncludeTax !== false) return product.price;
  return product.price + Math.round((product.price * rate) / 10000);
}

/** Le catalogue compte en pièces entières ; un stock négatif s'affiche 0. */
export function catalogStock(stock: number): number {
  return Math.max(0, Math.floor(Number.isFinite(stock) ? stock : 0));
}

/** Réduit la photo (1 200 px, WebP ou JPEG) avant l'envoi : une photo de téléphone pèse plusieurs Mo. */
async function shrink(file: File, max: number, quality = 0.82): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const type of ['image/webp', 'image/jpeg']) {
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, quality));
      if (blob && blob.type === type) return { blob, ext: type === 'image/webp' ? 'webp' : 'jpg', type };
    }
  } catch {
    /* format que le navigateur ne sait pas décoder : on envoie l'original */
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, ext, type: file.type || 'image/jpeg' };
}

/**
 * Dépose la photo dans le dossier de la personne (bucket `products`, comme la
 * place de marché : `<user>/<uuid>.<ext>`, plus une vignette `_thumb`).
 * Renvoie le chemin à passer à `finia_publier_article`.
 */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const full = await shrink(file, 1200);
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.${full.ext}`;
  const { error } = await supabase.storage.from('products').upload(path, full.blob, { upsert: false, contentType: full.type });
  if (error) throw error;
  // La vignette sert aux listes de la place de marché ; si elle échoue, la
  // place de marché retombe sur la photo pleine taille.
  shrink(file, 400)
    .then((thumb) => supabase.storage.from('products').upload(`${userId}/${uuid}_thumb.${full.ext}`, thumb.blob, { upsert: false, contentType: thumb.type }))
    .catch(() => {});
  return path;
}

export function photoUrl(path: string): string {
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return supabase.storage.from('products').getPublicUrl(path).data.publicUrl;
}

export interface PublishInput {
  workspaceId: string;
  product: Product;
  priceMinor: number;
  currency: string;
  description: string;
  imagePath: string;
  shopId: string | null;
}

/** Erreurs du serveur traduites en une phrase utile ; `code` sert à l'écran. */
export class PublishError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

export async function publishArticle(input: PublishInput): Promise<string> {
  const { data, error } = await supabase.rpc('finia_publier_article', {
    p_workspace: input.workspaceId,
    p_article: {
      ref: input.product.id,
      name: input.product.name,
      description: input.description.trim(),
      price_minor: input.priceMinor,
      currency: input.currency,
      stock: catalogStock(input.product.stock),
      image_path: input.imagePath,
    },
    // Toujours présent, même à null : la base a deux versions de la fonction
    // (2 et 3 paramètres) et un appel sans p_shop est refusé comme ambigu
    // (PGRST203, relevé par Alpha le 20/10).
    p_shop: input.shopId,
  });
  if (error) throw new PublishError(error.message, error.hint || error.code || '');
  return String(data);
}

/** Recopie le stock réel des articles publiés. Renvoie le nombre d'articles modifiés au catalogue. */
export async function syncStocks(workspaceId: string, items: { ref: string; stock: number }[]): Promise<number> {
  let changed = 0;
  for (let i = 0; i < items.length; i += 500) {
    const chunk = items.slice(i, i + 500).map((x) => ({ ref: x.ref, stock: catalogStock(x.stock) }));
    const { data, error } = await supabase.rpc('finia_synchroniser_stock', { p_workspace: workspaceId, p_stocks: chunk });
    if (error) throw error;
    changed += Number(data) || 0;
  }
  return changed;
}

/**
 * Ce qui a changé depuis le dernier envoi : seuls les articles publiés dont le
 * stock entier n'est plus celui qu'on a envoyé. `sent` vide (ouverture de
 * l'application) : tout part.
 */
export function stockChanges(products: Product[], published: Set<string>, sent: Map<string, number>): { ref: string; stock: number }[] {
  const out: { ref: string; stock: number }[] = [];
  for (const p of products) {
    if (!published.has(p.id)) continue;
    const stock = catalogStock(p.stock);
    if (sent.get(p.id) !== stock) out.push({ ref: p.id, stock });
  }
  return out;
}
