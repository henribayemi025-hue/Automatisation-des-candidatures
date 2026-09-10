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

/** Les réglages qu'un profil pays propose, à appliquer d'un coup (la devise reste un choix à part). */
export function profileToCompany(p: CountryProfile): Partial<Company> {
  return {
    chart: p.chart,
    vatRateBp: p.vatRateBp,
    vatEnabled: p.vatRateBp > 0,
    taxLabel: p.taxLabel,
    fiscalYearStart: p.fiscalYearStart,
  };
}
