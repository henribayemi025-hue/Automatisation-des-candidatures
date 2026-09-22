import { factor } from './money';
import type { Minor } from './types';

/**
 * Le rendu de monnaie, au comptoir.
 *
 * Repris de GestPro, le prototype que Beau avait fait dans AI Studio : le
 * client tend un billet, la caissière doit savoir tout de suite combien
 * rendre. Chez nous, rien ne le calculait — elle le faisait de tête, et c'est
 * là que la caisse se met à ne plus tomber juste le soir.
 *
 * Ce calcul n'écrit rien. Le montant de la vente ne change pas : ce qui est
 * reçu puis rendu dans la minute ne passe pas en comptabilité.
 */

/**
 * Les billets que le client a probablement dans la main.
 *
 * Aucune liste de billets par pays : on ne la tiendrait pas à jour pour le
 * monde entier. On prend les montants ronds 1-2-5 (…, 500, 1 000, 2 000,
 * 5 000, 10 000…) qui suivent le total, en ignorant les pas trop petits
 * devant lui — pour 3 750, personne ne tend 3 800. Ça donne 4 000, 5 000,
 * 10 000 en FCFA, et 15, 20, 50 pour 12,40 €.
 */
export function billetsProposes(total: Minor, devise: string): Minor[] {
  if (total <= 0) return [];
  const f = factor(devise);
  const plancher = total / 5;
  const valeurs = new Set<Minor>();
  for (let puissance = 1; puissance <= 1e9 && valeurs.size < 3; puissance *= 10) {
    for (const chiffre of [1, 2, 5]) {
      const pas = chiffre * puissance * f;
      if (pas < plancher) continue;
      const arrondi = Math.ceil(total / pas) * pas;
      if (arrondi > total) valeurs.add(arrondi);
      if (valeurs.size === 3) break;
    }
  }
  return [...valeurs].sort((a, b) => a - b);
}

/** Ce qu'il faut rendre, ou ce qui manque encore (nombre négatif). */
export function aRendre(total: Minor, recu: Minor): Minor {
  return recu - total;
}
