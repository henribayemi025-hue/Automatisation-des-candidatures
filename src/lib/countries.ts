import type { Company } from './types';

/**
 * Profil fiscal proposé par pays : devise, taux standard de la taxe sur la
 * consommation, nom local de cette taxe, référentiel comptable usuel.
 * Ce sont des valeurs STANDARD proposées à titre indicatif — la personne les
 * confirme, et son comptable a le dernier mot (taux réduits, exonérations,
 * seuils d'assujettissement ne sont pas modélisés ici).
 */
export interface CountryProfile {
  name: string;
  currency: string;
  chart: Company['chart'];
  vatRateBp: number;
  taxLabel: string;
  fiscalYearStart: string;
}

const OHADA = (name: string, currency: string, vat: number, tax = 'TVA'): CountryProfile => ({
  name,
  currency,
  chart: 'SYSCOHADA',
  vatRateBp: vat,
  taxLabel: tax,
  fiscalYearStart: '01-01',
});

export const COUNTRIES: CountryProfile[] = [
  OHADA('Cameroun', 'XAF', 1925),
  OHADA('Gabon', 'XAF', 1800),
  OHADA('Congo', 'XAF', 1800),
  OHADA('Tchad', 'XAF', 1800),
  OHADA('République centrafricaine', 'XAF', 1900),
  OHADA('Guinée équatoriale', 'XAF', 1500),
  OHADA('RD Congo', 'USD', 1600),
  OHADA('Sénégal', 'XOF', 1800),
  OHADA('Côte d’Ivoire', 'XOF', 1800),
  OHADA('Bénin', 'XOF', 1800),
  OHADA('Togo', 'XOF', 1800),
  OHADA('Mali', 'XOF', 1800),
  OHADA('Burkina Faso', 'XOF', 1800),
  OHADA('Niger', 'XOF', 1900),
  OHADA('Guinée', 'GNF', 1800),
  OHADA('Comores', 'KMF', 1000),
  { name: 'Maroc', currency: 'MAD', chart: 'GENERIC', vatRateBp: 2000, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Algérie', currency: 'DZD', chart: 'GENERIC', vatRateBp: 1900, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Tunisie', currency: 'TND', chart: 'GENERIC', vatRateBp: 1900, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Nigeria', currency: 'NGN', chart: 'GENERIC', vatRateBp: 750, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Ghana', currency: 'GHS', chart: 'GENERIC', vatRateBp: 1500, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Kenya', currency: 'KES', chart: 'GENERIC', vatRateBp: 1600, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Afrique du Sud', currency: 'ZAR', chart: 'GENERIC', vatRateBp: 1500, taxLabel: 'VAT', fiscalYearStart: '03-01' },
  { name: 'Rwanda', currency: 'RWF', chart: 'GENERIC', vatRateBp: 1800, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Éthiopie', currency: 'ETB', chart: 'GENERIC', vatRateBp: 1500, taxLabel: 'VAT', fiscalYearStart: '07-08' },
  { name: 'France', currency: 'EUR', chart: 'PCG', vatRateBp: 2000, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Belgique', currency: 'EUR', chart: 'PCG', vatRateBp: 2100, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Suisse', currency: 'CHF', chart: 'GENERIC', vatRateBp: 810, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Luxembourg', currency: 'EUR', chart: 'PCG', vatRateBp: 1700, taxLabel: 'TVA', fiscalYearStart: '01-01' },
  { name: 'Royaume-Uni', currency: 'GBP', chart: 'GENERIC', vatRateBp: 2000, taxLabel: 'VAT', fiscalYearStart: '04-06' },
  { name: 'Irlande', currency: 'EUR', chart: 'GENERIC', vatRateBp: 2300, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Allemagne', currency: 'EUR', chart: 'GENERIC', vatRateBp: 1900, taxLabel: 'MwSt', fiscalYearStart: '01-01' },
  { name: 'Espagne', currency: 'EUR', chart: 'GENERIC', vatRateBp: 2100, taxLabel: 'IVA', fiscalYearStart: '01-01' },
  { name: 'Italie', currency: 'EUR', chart: 'GENERIC', vatRateBp: 2200, taxLabel: 'IVA', fiscalYearStart: '01-01' },
  { name: 'Portugal', currency: 'EUR', chart: 'GENERIC', vatRateBp: 2300, taxLabel: 'IVA', fiscalYearStart: '01-01' },
  { name: 'Pays-Bas', currency: 'EUR', chart: 'GENERIC', vatRateBp: 2100, taxLabel: 'BTW', fiscalYearStart: '01-01' },
  { name: 'Canada', currency: 'CAD', chart: 'GENERIC', vatRateBp: 500, taxLabel: 'TPS/GST', fiscalYearStart: '01-01' },
  { name: 'États-Unis', currency: 'USD', chart: 'GENERIC', vatRateBp: 0, taxLabel: 'Sales tax', fiscalYearStart: '01-01' },
  { name: 'Émirats arabes unis', currency: 'AED', chart: 'GENERIC', vatRateBp: 500, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Arabie saoudite', currency: 'SAR', chart: 'GENERIC', vatRateBp: 1500, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Turquie', currency: 'TRY', chart: 'GENERIC', vatRateBp: 2000, taxLabel: 'KDV', fiscalYearStart: '01-01' },
  { name: 'Inde', currency: 'INR', chart: 'GENERIC', vatRateBp: 1800, taxLabel: 'GST', fiscalYearStart: '04-01' },
  { name: 'Chine', currency: 'CNY', chart: 'GENERIC', vatRateBp: 1300, taxLabel: 'VAT', fiscalYearStart: '01-01' },
  { name: 'Japon', currency: 'JPY', chart: 'GENERIC', vatRateBp: 1000, taxLabel: 'Consumption tax', fiscalYearStart: '04-01' },
  { name: 'Australie', currency: 'AUD', chart: 'GENERIC', vatRateBp: 1000, taxLabel: 'GST', fiscalYearStart: '07-01' },
  { name: 'Brésil', currency: 'BRL', chart: 'GENERIC', vatRateBp: 1800, taxLabel: 'ICMS', fiscalYearStart: '01-01' },
  { name: 'Mexique', currency: 'MXN', chart: 'GENERIC', vatRateBp: 1600, taxLabel: 'IVA', fiscalYearStart: '01-01' },
  { name: 'Haïti', currency: 'HTG', chart: 'GENERIC', vatRateBp: 1000, taxLabel: 'TCA', fiscalYearStart: '10-01' },
  { name: 'Autre', currency: '', chart: 'GENERIC', vatRateBp: 0, taxLabel: 'Taxe', fiscalYearStart: '01-01' },
];

export function countryProfile(name: string): CountryProfile | undefined {
  return COUNTRIES.find((c) => c.name === name);
}

/**
 * Indicatif téléphonique international par pays — pour fabriquer un lien
 * WhatsApp valide (wa.me exige le format international) à partir d'un
 * numéro saisi localement, sans indicatif. Trouvé le 28/09 : le même défaut
 * existait côté place de marché (wa.me/691024291 au lieu de
 * wa.me/237691024291), corrigé là-bas via le pays de la boutique — jamais
 * en devinant depuis le numéro (un mobile camerounais qui commence par
 * « 61 » commence aussi par l'indicatif australien).
 */
const DIAL_CODES: Record<string, string> = {
  Cameroun: '237', Gabon: '241', Congo: '242', Tchad: '235', 'République centrafricaine': '236',
  'Guinée équatoriale': '240', 'RD Congo': '243', Sénégal: '221', 'Côte d’Ivoire': '225', Bénin: '229',
  Togo: '228', Mali: '223', 'Burkina Faso': '226', Niger: '227', Guinée: '224', Comores: '269',
  Maroc: '212', Algérie: '213', Tunisie: '216', Nigeria: '234', Ghana: '233', Kenya: '254',
  'Afrique du Sud': '27', Rwanda: '250', Éthiopie: '251', France: '33', Belgique: '32', Suisse: '41',
  Luxembourg: '352', 'Royaume-Uni': '44', Irlande: '353', Allemagne: '49', Espagne: '34', Italie: '39',
  Portugal: '351', 'Pays-Bas': '31', Canada: '1', 'États-Unis': '1', 'Émirats arabes unis': '971',
  'Arabie saoudite': '966', Turquie: '90', Inde: '91', Chine: '86', Japon: '81', Australie: '61',
  Brésil: '55', Mexique: '52', Haïti: '509',
};

/**
 * Numéro au format international attendu par wa.me, à partir d'un numéro
 * saisi librement et du pays de l'entreprise. Un numéro qui commence déjà
 * par « + » ou « 00 » garde son indicatif tel quel ; sinon, l'indicatif du
 * pays est ajouté (après avoir retiré un éventuel 0 initial, écrit par
 * réflexe local — ex. France « 06 12 34 56 78 »).
 */
export function whatsappNumber(phone: string, country?: string): string | null {
  const trimmed = (phone ?? '').trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  // Un lien vers un numéro impossible fait croire que le message est parti
  // (Alpha, 07/10) : on rend null, et l'écran n'affiche pas le bouton.
  const ok = (n: string) => (n.length >= 8 && n.length <= 15 ? n : null);
  if (trimmed.startsWith('+')) return ok(digits);
  if (digits.startsWith('00')) return ok(digits.slice(2));
  const code = country ? DIAL_CODES[country] : undefined;
  // Numéro recopié tel que WhatsApp l'affiche, indicatif compris mais sans
  // « + » : « 237 691 02 42 91 » donnait 237237691024291 (Alpha, 07/10).
  if (code && digits.startsWith(code) && digits.length - code.length >= 7) return ok(digits);
  if (code) return ok(code + digits.replace(/^0+/, ''));
  // Sans pays connu : seulement si le numéro porte déjà un indicatif connu.
  const known = Object.values(DIAL_CODES).some((c) => digits.startsWith(c) && digits.length - c.length >= 7);
  return known ? ok(digits) : null;
}

/** Régime d'imposition effectif : l'ancien réglage « taxe activée » vaut réel. */
export function taxRegime(c: { taxRegime?: Company['taxRegime']; vatEnabled: boolean }): NonNullable<Company['taxRegime']> {
  return c.taxRegime ?? (c.vatEnabled ? 'REEL' : 'NONE');
}

type RegimeOption = { id: NonNullable<Company['taxRegime']>; label: string; hint: string };

const REEL: RegimeOption = {
  id: 'REEL',
  label: 'Régime du réel',
  hint: 'L’entreprise facture la taxe (TVA) sur ses ventes, la déduit sur ses achats et la déclare.',
};
const IGS: RegimeOption = {
  id: 'IGS',
  label: 'Impôt général synthétique (IGS)',
  hint: 'Pas de TVA facturée. Les fournisseurs peuvent retenir un précompte sur achat, comptabilisé en acompte d’impôt.',
};
const MICRO: RegimeOption = {
  id: 'MICRO',
  label: 'Micro-entreprise (micro-BIC / micro-BNC)',
  hint: 'Franchise en base : pas de TVA facturée, pas de TVA déduite. La facture doit porter la mention « TVA non applicable, art. 293 B du CGI ».',
};
const AUCUN: RegimeOption = {
  id: 'NONE',
  label: 'Non assujetti / autre',
  hint: 'Aucune taxe sur les ventes ni sur les achats.',
};

/**
 * Les régimes proposés suivent le PAYS.
 *
 * Relevé le 21/09 par une comptable française : on lui proposait l'IGS, qui
 * n'existe pas en France, et il manquait le micro-BIC/micro-BNC, qui est le
 * régime de la plupart des activités qu'on vise là-bas. Proposer à quelqu'un
 * un régime qui n'existe pas dans son pays, c'est lui dire qu'on ne connaît
 * pas son pays.
 *
 * L'IGS est un régime OHADA : il ne s'affiche que pour les pays dont le
 * référentiel est SYSCOHADA. La micro-entreprise est française : elle ne
 * s'affiche que pour la France. Ailleurs, réel ou non assujetti — on ne
 * devine pas un régime local qu'on n'a pas vérifié.
 */
export function taxRegimesFor(country: string | undefined): RegimeOption[] {
  const profil = country ? countryProfile(country) : undefined;
  if (country === 'France') return [REEL, MICRO, AUCUN];
  if (profil?.chart === 'SYSCOHADA') return [REEL, IGS, AUCUN];
  // Pays inconnu (ou « Autre ») : on garde tout, plutôt que de retirer à
  // quelqu'un le régime qui est le sien parce qu'on n'a pas listé son pays.
  if (!profil) return [REEL, MICRO, IGS, AUCUN];
  return [REEL, AUCUN];
}

/** Tous les régimes, pour retrouver le libellé d'un régime déjà enregistré. */
export const TAX_REGIMES: RegimeOption[] = [REEL, MICRO, IGS, AUCUN];

/** Les réglages qu'un profil pays propose, à appliquer d'un coup (la devise reste un choix à part). */
export function profileToCompany(p: CountryProfile): Partial<Company> {
  return {
    chart: p.chart,
    vatRateBp: p.vatRateBp,
    vatEnabled: p.vatRateBp > 0,
    taxRegime: p.vatRateBp > 0 ? 'REEL' : 'NONE',
    taxLabel: p.taxLabel,
    fiscalYearStart: p.fiscalYearStart,
  };
}
