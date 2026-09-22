import { currentFiscalYear } from './closing';
import { saleRevenue } from './metrics';
import type { Company, DB, Minor } from './types';

/**
 * Les seuils fiscaux camerounais, et l'avertissement qui va avec.
 *
 * Pourquoi ça existe : une commerçante ne suit pas son chiffre d'affaires
 * cumulé. Elle le découvre quand l'administration le lui dit, c'est-à-dire
 * trop tard. Nous l'avons déjà à l'écran — il ne manquait qu'une comparaison.
 *
 * C'est aussi la réponse à la question « faut-il un mode simple et un mode
 * expert ». Non : ce n'est pas un réglage qu'on demande à quelqu'un de choisir
 * avant de savoir de quoi on parle, c'est une chose qui apparaît quand elle
 * sert. Le seuil est un déclencheur, pas une case à cocher.
 *
 * TOUS les chiffres ci-dessous ont été lus dans le projet de loi de finances
 * 2026 (PDF officiel, dgb.cm), le 22/09/2026. Aucun ne vient d'un blog. Les
 * articles sont cités pour qu'on puisse les revérifier l'an prochain, parce
 * qu'une loi de finances change tous les ans.
 */

/** Article C 44 : comptabilité SMT et déclaration statistique et fiscale. */
export const SEUIL_COMPTABILITE: Minor = 10_000_000;

/** Article C 39 (1) a : commerce, industrie, artisanat, agropastoral. */
export const SEUIL_IGS_COMMERCE: Minor = 50_000_000;

/** Article C 39 (1) b : professions libérales. */
export const SEUIL_IGS_LIBERAL: Minor = 30_000_000;

/**
 * Les métiers que nous appelons des prestations et que le texte range dans les
 * professions libérales. Volontairement court : dans le doute, on applique le
 * seuil le plus élevé, qui avertit plus tard — se tromper en avertissant trop
 * tôt affole quelqu'un pour rien, et c'est ce qu'on veut le moins.
 */
const LIBERAL = new Set(['health', 'services']);

export function seuilReclassement(company: Pick<Company, 'sector'>): Minor {
  return LIBERAL.has(company.sector) ? SEUIL_IGS_LIBERAL : SEUIL_IGS_COMMERCE;
}

/**
 * Ces seuils sont camerounais. Ailleurs, on se tait : un seuil inventé pour un
 * pays qu'on n'a pas vérifié serait pire que pas de seuil du tout.
 */
export function seuilsApplicables(company: Pick<Company, 'country'>): boolean {
  return company.country === 'Cameroun';
}

export interface AlerteSeuil {
  tone: 'warn' | 'bad';
  text: string;
}

/**
 * Le chiffre d'affaires encaissé depuis le début de l'exercice en cours.
 *
 * On compte les ventes confirmées, pas les devis. Le texte parle de chiffre
 * d'affaires hors taxes : `saleRevenue` donne déjà le net.
 */
export function caExercice(db: DB, todayISO: string): Minor {
  const { from, to } = currentFiscalYear(db.company, todayISO);
  return db.sales
    .filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to)
    .reduce((somme, s) => somme + saleRevenue(s), 0);
}

/**
 * L'avertissement, ou rien.
 *
 * Trois moments, et un seul message à la fois — on ne submerge pas quelqu'un
 * de mises en garde le même jour :
 *
 * 1. le seuil de comptabilité est franchi : elle DOIT tenir des comptes et
 *    déposer sa déclaration au 15 mai. C'est le moment où l'application cesse
 *    d'être un confort ;
 * 2. le seuil de reclassement approche (neuf dixièmes) : encore le temps d'en
 *    parler à un comptable ;
 * 3. il est franchi : un seul dépassement suffit, et on n'en revient qu'après
 *    deux exercices sous le seuil.
 *
 * `formatMoney` est passé en argument plutôt qu'importé : ce fichier ne doit
 * rien savoir de l'affichage, et les contrôles peuvent le remplacer.
 */
export function alerteSeuil(
  db: DB,
  todayISO: string,
  money: (v: Minor) => string,
  t: (s: string, vars?: Record<string, string | number>) => string,
): AlerteSeuil | null {
  if (!seuilsApplicables(db.company)) return null;

  const ca = caExercice(db, todayISO);
  const reclassement = seuilReclassement(db.company);

  if (ca >= reclassement) {
    return {
      tone: 'bad',
      text: t(
        'Votre chiffre d’affaires de l’exercice ({ca}) dépasse {seuil}. Un seul dépassement fait passer au régime du réel l’exercice suivant, et on n’en revient qu’après deux exercices sous le seuil. Parlez-en à un comptable.',
        { ca: money(ca), seuil: money(reclassement) },
      ),
    };
  }

  if (ca >= Math.round((reclassement * 9) / 10)) {
    return {
      tone: 'warn',
      text: t(
        'Vous approchez de {seuil} de chiffre d’affaires sur l’exercice ({ca}). Au-delà, vous passez au régime du réel : TVA à facturer et déclarations. Il est encore temps de vous y préparer.',
        { ca: money(ca), seuil: money(reclassement) },
      ),
    };
  }

  if (ca >= SEUIL_COMPTABILITE) {
    return {
      tone: 'warn',
      text: t(
        'Au-delà de {seuil} de chiffre d’affaires, tenir une comptabilité et déposer la déclaration statistique et fiscale avant le 15 mai deviennent obligatoires. Vous y êtes ({ca}) — et c’est déjà ce que fait cette application.',
        { ca: money(ca), seuil: money(SEUIL_COMPTABILITE) },
      ),
    };
  }

  return null;
}
