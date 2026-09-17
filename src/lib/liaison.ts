/**
 * Ventes venues de la place de marché Finjaro.
 *
 * Elles arrivent sans coût d'achat (la place de marché ne le connaît pas).
 * Tant que la vendeuse ne l'a pas complété, chaque vente pèse son prix entier
 * dans le résultat : c'est faux, et à la clôture ce serait de l'impôt sur un
 * bénéfice qui n'existe pas. Tout ce qui compte ou bloque là-dessus passe ici.
 */
import type { DB, Sale } from './types';

export function needsCost(sale: Sale): boolean {
  return sale.source === 'finjaro' && sale.status === 'CONFIRMED' && !sale.costResolved && sale.lines.some((l) => l.unitCost === 0 && l.unitPrice > 0);
}

/** Les ventes sans coût sur une période, et le montant dont le résultat peut être surestimé (leur prix hors taxe). */
export function salesWithoutCost(db: DB, from?: string, to?: string): { sales: Sale[]; exposure: number } {
  const sales = db.sales.filter((s) => needsCost(s) && (!from || s.date >= from) && (!to || s.date <= to)).sort((a, b) => a.date.localeCompare(b.date));
  const exposure = sales.reduce((sum, s) => sum + s.total - s.vat, 0);
  return { sales, exposure };
}

/** Coût proposé pour une ligne : la fiche article du même nom, si elle existe. */
export function suggestedCost(db: DB, lineName: string): number {
  const bare = lineName.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
  const product = db.products.find((p) => !p.archived && p.name.trim().toLowerCase() === bare);
  return product?.cost ?? 0;
}
