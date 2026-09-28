import type { Minor, Product, Sale } from './types';

/**
 * « Vous avez vendu *huile* trois fois : en faire un article ? »
 *
 * La vente rapide laisse encaisser sans fiche article (voir addQuick dans
 * PointOfSale) : c'est ce qui a débloqué les premières ventes. Mais tant que
 * tout passe en vente rapide, la caisse ne sait rien de ce qui se vend, et la
 * personne retape le même montant à chaque fois.
 *
 * Plutôt que de lui demander de remplir un catalogue (le « mur » relevé par
 * Beau le 28/09), on regarde ce qu'elle a DÉJÀ tapé. Un même libellé revenu
 * trois fois, c'est un article qu'elle vend vraiment : on le lui propose, prix
 * habituel compris, et un geste suffit pour le créer.
 */

/** À partir de combien de ventes un libellé mérite d'être proposé. */
export const SEUIL_SUGGESTION = 3;

/** Libellés que la caisse met elle-même quand rien n'est tapé : jamais un article. */
const PAR_DEFAUT = new Set(['vente', 'sale']);

/** « Huile  » , « huile », « HUILE » et « Huîle » désignent la même chose. */
export function normaliserLibelle(libelle: string): string {
  return libelle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function estEnCapitales(texte: string): boolean {
  return /\p{L}/u.test(texte) && texte === texte.toUpperCase();
}

export interface ArticleSuggere {
  /** Clé de regroupement (voir normaliserLibelle). */
  cle: string;
  /** Le libellé tel qu'elle l'écrit le plus souvent. */
  nom: string;
  /** Nombre de ventes où il apparaît. */
  fois: number;
  /** Le montant qui revient le plus souvent : c'est son prix, pas une moyenne. */
  prixHabituel: Minor;
}

export function articlesSuggeres(
  ventes: Sale[],
  articles: Product[],
  ignores: string[] = [],
  seuil = SEUIL_SUGGESTION,
): ArticleSuggere[] {
  // Un libellé qui porte déjà le nom d'un article (même archivé : elle l'a
  // retiré exprès) n'est pas à proposer.
  const dejaLa = new Set(articles.map((p) => normaliserLibelle(p.name)));
  const refus = new Set(ignores);

  const groupes = new Map<
    string,
    { fois: number; ecritures: Map<string, number>; prix: Map<Minor, { n: number; dernier: string }> }
  >();

  for (const v of ventes) {
    // Un devis n'est pas une vente, une vente annulée non plus.
    if (v.status !== 'CONFIRMED') continue;
    // Une même vente qui répète le libellé ne compte qu'une fois : « trois
    // fois », ce sont trois clientes, pas trois lignes d'un même ticket.
    const vus = new Set<string>();
    for (const l of v.lines) {
      if (l.productId) continue;
      const cle = normaliserLibelle(l.name);
      if (cle.length < 2 || PAR_DEFAUT.has(cle) || /^[\d\s.,]+$/.test(cle)) continue;
      if (dejaLa.has(cle) || refus.has(cle)) continue;
      const g = groupes.get(cle) ?? { fois: 0, ecritures: new Map(), prix: new Map() };
      if (!vus.has(cle)) {
        g.fois += 1;
        vus.add(cle);
      }
      const ecrit = l.name.trim().replace(/\s+/g, ' ');
      g.ecritures.set(ecrit, (g.ecritures.get(ecrit) ?? 0) + 1);
      const p = g.prix.get(l.unitPrice) ?? { n: 0, dernier: '' };
      p.n += 1;
      if (v.date > p.dernier) p.dernier = v.date;
      g.prix.set(l.unitPrice, p);
      groupes.set(cle, g);
    }
  }

  const res: ArticleSuggere[] = [];
  for (const [cle, g] of groupes) {
    if (g.fois < seuil) continue;
    // L'écriture la plus fréquente ; à égalité, celle qui ne crie pas.
    let nom = [...g.ecritures.entries()].sort(
      (a, b) => b[1] - a[1] || Number(estEnCapitales(a[0])) - Number(estEnCapitales(b[0])),
    )[0][0];
    // « HUILE » tapé en majuscules devient « Huile » ; un sigle court (« PMU ») reste tel quel.
    if (estEnCapitales(nom) && nom.replace(/[^\p{L}]/gu, '').length > 4) nom = nom.toLowerCase();
    // Le montant le plus fréquent ; à égalité, le plus récent (les prix montent).
    const prixHabituel = [...g.prix.entries()].sort(
      (a, b) => b[1].n - a[1].n || b[1].dernier.localeCompare(a[1].dernier),
    )[0][0];
    res.push({ cle, nom: nom.charAt(0).toUpperCase() + nom.slice(1), fois: g.fois, prixHabituel });
  }
  return res.sort((a, b) => b.fois - a.fois || a.nom.localeCompare(b.nom));
}
