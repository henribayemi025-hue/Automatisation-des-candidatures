/**
 * Plats préparés : ce qu'on peut encore servir, et ce que ça coûte.
 *
 * Un article « composé » (un plat, un cocktail, un menu, un bouquet) n'a pas
 * de stock à lui. Sa disponibilité est celle de son ingrédient le plus rare,
 * et son coût de revient est la somme de ses ingrédients.
 *
 * Tout ce qui répond à « combien puis-je en servir » et « combien ça me coûte »
 * passe par ici, pour que la caisse, la fiche article et le moteur disent la
 * même chose.
 */
import type { DB, Product } from './types';

export function isComposed(product: Pick<Product, 'components'>): boolean {
  return !!product.components?.length;
}

/** Coût de revient d'un article composé, d'après ses ingrédients du moment. */
export function recipeCost(db: DB, product: Pick<Product, 'components' | 'cost'>): number {
  if (!isComposed(product)) return product.cost;
  return product.components!.reduce((somme, c) => {
    const ing = db.products.find((p) => p.id === c.productId);
    return somme + (ing ? ing.cost * c.qty : 0);
  }, 0);
}

/**
 * Combien on peut encore en servir.
 *
 * Pour un article ordinaire, c'est son stock. Pour un plat, c'est ce que
 * permet l'ingrédient le plus rare — trois portions de riz et six louches de
 * sauce ne font pas six plats si le plat prend deux louches.
 *
 * Un ingrédient effacé, ou une quantité à zéro, ne bloque pas la vente : on ne
 * refuse pas une recette à cause d'une fiche mal remplie. Un plat sans
 * ingrédient disponible renvoie 0 comme n'importe quelle rupture.
 */
export function availableQty(db: DB, product: Pick<Product, 'components' | 'stock'>): number {
  if (!isComposed(product)) return product.stock;
  let possible = Infinity;
  for (const c of product.components!) {
    if (c.qty <= 0) continue;
    const ing = db.products.find((p) => p.id === c.productId);
    if (!ing) continue;
    possible = Math.min(possible, Math.floor(ing.stock / c.qty));
  }
  return possible === Infinity ? 0 : Math.max(0, possible);
}

/** Les ingrédients qui manquent pour en servir un de plus, pour le dire à l'écran. */
export function missingFor(db: DB, product: Pick<Product, 'components'>, qty = 1): { name: string; manque: number }[] {
  if (!isComposed(product)) return [];
  const manques: { name: string; manque: number }[] = [];
  for (const c of product.components!) {
    const ing = db.products.find((p) => p.id === c.productId);
    if (!ing) continue;
    const besoin = c.qty * qty;
    if (ing.stock < besoin) manques.push({ name: ing.name, manque: besoin - ing.stock });
  }
  return manques;
}
