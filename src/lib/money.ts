import type { Currency, Minor } from './types';
import { locale, t } from './i18n';

export const CURRENCIES: Currency[] = [
  { code: 'XAF', symbol: 'FCFA', decimals: 0, name: 'franc CFA (Afrique centrale)' },
  { code: 'XOF', symbol: 'CFA', decimals: 0, name: 'franc CFA (Afrique de l’Ouest)' },
  { code: 'XPF', symbol: 'F', decimals: 0, name: 'franc Pacifique' },
  { code: 'MAD', symbol: 'DH', decimals: 2, name: 'dirham marocain' },
  { code: 'DZD', symbol: 'DA', decimals: 2, name: 'dinar algérien' },
  { code: 'TND', symbol: 'DT', decimals: 3, name: 'dinar tunisien' },
  { code: 'LYD', symbol: 'LD', decimals: 3, name: 'dinar libyen' },
  { code: 'EGP', symbol: 'E£', decimals: 2, name: 'livre égyptienne' },
  { code: 'NGN', symbol: '₦', decimals: 2, name: 'naira nigérian' },
  { code: 'GHS', symbol: 'GH₵', decimals: 2, name: 'cedi ghanéen' },
  { code: 'GMD', symbol: 'D', decimals: 2, name: 'dalasi gambien' },
  { code: 'GNF', symbol: 'FG', decimals: 0, name: 'franc guinéen' },
  { code: 'LRD', symbol: 'L$', decimals: 2, name: 'dollar libérien' },
  { code: 'SLE', symbol: 'Le', decimals: 2, name: 'leone sierra-léonais' },
  { code: 'CVE', symbol: '$', decimals: 2, name: 'escudo cap-verdien' },
  { code: 'MRU', symbol: 'UM', decimals: 2, name: 'ouguiya mauritanien' },
  { code: 'KES', symbol: 'KSh', decimals: 2, name: 'shilling kényan' },
  { code: 'TZS', symbol: 'TSh', decimals: 2, name: 'shilling tanzanien' },
  { code: 'UGX', symbol: 'USh', decimals: 0, name: 'shilling ougandais' },
  { code: 'RWF', symbol: 'FRw', decimals: 0, name: 'franc rwandais' },
  { code: 'BIF', symbol: 'FBu', decimals: 0, name: 'franc burundais' },
  { code: 'ETB', symbol: 'Br', decimals: 2, name: 'birr éthiopien' },
  { code: 'SOS', symbol: 'Sh', decimals: 2, name: 'shilling somalien' },
  { code: 'DJF', symbol: 'Fdj', decimals: 0, name: 'franc de Djibouti' },
  { code: 'SDG', symbol: 'SDG', decimals: 2, name: 'livre soudanaise' },
  { code: 'ZAR', symbol: 'R', decimals: 2, name: 'rand sud-africain' },
  { code: 'BWP', symbol: 'P', decimals: 2, name: 'pula du Botswana' },
  { code: 'NAD', symbol: 'N$', decimals: 2, name: 'dollar namibien' },
  { code: 'ZMW', symbol: 'ZK', decimals: 2, name: 'kwacha zambien' },
  { code: 'MWK', symbol: 'MK', decimals: 2, name: 'kwacha malawien' },
  { code: 'MZN', symbol: 'MT', decimals: 2, name: 'metical mozambicain' },
  { code: 'AOA', symbol: 'Kz', decimals: 2, name: 'kwanza angolais' },
  { code: 'CDF', symbol: 'FC', decimals: 2, name: 'franc congolais' },
  { code: 'MGA', symbol: 'Ar', decimals: 0, name: 'ariary malgache' },
  { code: 'MUR', symbol: '₨', decimals: 2, name: 'roupie mauricienne' },
  { code: 'SCR', symbol: '₨', decimals: 2, name: 'roupie des Seychelles' },
  { code: 'KMF', symbol: 'CF', decimals: 0, name: 'franc comorien' },
  { code: 'EUR', symbol: '€', decimals: 2, name: 'euro' },
  { code: 'GBP', symbol: '£', decimals: 2, name: 'livre sterling' },
  { code: 'CHF', symbol: 'CHF', decimals: 2, name: 'franc suisse' },
  { code: 'SEK', symbol: 'kr', decimals: 2, name: 'couronne suédoise' },
  { code: 'NOK', symbol: 'kr', decimals: 2, name: 'couronne norvégienne' },
  { code: 'DKK', symbol: 'kr', decimals: 2, name: 'couronne danoise' },
  { code: 'ISK', symbol: 'kr', decimals: 0, name: 'couronne islandaise' },
  { code: 'PLN', symbol: 'zł', decimals: 2, name: 'zloty polonais' },
  { code: 'CZK', symbol: 'Kč', decimals: 2, name: 'couronne tchèque' },
  { code: 'HUF', symbol: 'Ft', decimals: 2, name: 'forint hongrois' },
  { code: 'RON', symbol: 'lei', decimals: 2, name: 'leu roumain' },
  { code: 'BGN', symbol: 'лв', decimals: 2, name: 'lev bulgare' },
  { code: 'RSD', symbol: 'дин', decimals: 2, name: 'dinar serbe' },
  { code: 'UAH', symbol: '₴', decimals: 2, name: 'hryvnia ukrainienne' },
  { code: 'RUB', symbol: '₽', decimals: 2, name: 'rouble russe' },
  { code: 'TRY', symbol: '₺', decimals: 2, name: 'livre turque' },
  { code: 'USD', symbol: '$', decimals: 2, name: 'dollar américain' },
  { code: 'CAD', symbol: 'CA$', decimals: 2, name: 'dollar canadien' },
  { code: 'MXN', symbol: 'MX$', decimals: 2, name: 'peso mexicain' },
  { code: 'BRL', symbol: 'R$', decimals: 2, name: 'réal brésilien' },
  { code: 'ARS', symbol: 'AR$', decimals: 2, name: 'peso argentin' },
  { code: 'CLP', symbol: 'CLP$', decimals: 0, name: 'peso chilien' },
  { code: 'COP', symbol: 'COL$', decimals: 2, name: 'peso colombien' },
  { code: 'PEN', symbol: 'S/', decimals: 2, name: 'sol péruvien' },
  { code: 'UYU', symbol: '$U', decimals: 2, name: 'peso uruguayen' },
  { code: 'PYG', symbol: '₲', decimals: 0, name: 'guarani paraguayen' },
  { code: 'BOB', symbol: 'Bs', decimals: 2, name: 'boliviano' },
  { code: 'VES', symbol: 'Bs', decimals: 2, name: 'bolívar vénézuélien' },
  { code: 'HTG', symbol: 'G', decimals: 2, name: 'gourde haïtienne' },
  { code: 'DOP', symbol: 'RD$', decimals: 2, name: 'peso dominicain' },
  { code: 'JMD', symbol: 'J$', decimals: 2, name: 'dollar jamaïcain' },
  { code: 'TTD', symbol: 'TT$', decimals: 2, name: 'dollar de Trinité-et-Tobago' },
  { code: 'XCD', symbol: 'EC$', decimals: 2, name: 'dollar des Caraïbes orientales' },
  { code: 'AED', symbol: 'AED', decimals: 2, name: 'dirham des Émirats' },
  { code: 'SAR', symbol: 'SAR', decimals: 2, name: 'riyal saoudien' },
  { code: 'QAR', symbol: 'QAR', decimals: 2, name: 'riyal qatari' },
  { code: 'KWD', symbol: 'KD', decimals: 3, name: 'dinar koweïtien' },
  { code: 'BHD', symbol: 'BD', decimals: 3, name: 'dinar bahreïni' },
  { code: 'OMR', symbol: 'OMR', decimals: 3, name: 'rial omanais' },
  { code: 'JOD', symbol: 'JD', decimals: 3, name: 'dinar jordanien' },
  { code: 'ILS', symbol: '₪', decimals: 2, name: 'shekel israélien' },
  { code: 'LBP', symbol: 'L£', decimals: 2, name: 'livre libanaise' },
  { code: 'IQD', symbol: 'ع.د', decimals: 3, name: 'dinar irakien' },
  { code: 'IRR', symbol: '﷼', decimals: 2, name: 'rial iranien' },
  { code: 'PKR', symbol: '₨', decimals: 2, name: 'roupie pakistanaise' },
  { code: 'INR', symbol: '₹', decimals: 2, name: 'roupie indienne' },
  { code: 'BDT', symbol: '৳', decimals: 2, name: 'taka bangladais' },
  { code: 'LKR', symbol: '₨', decimals: 2, name: 'roupie srilankaise' },
  { code: 'NPR', symbol: '₨', decimals: 2, name: 'roupie népalaise' },
  { code: 'CNY', symbol: '¥', decimals: 2, name: 'yuan chinois' },
  { code: 'HKD', symbol: 'HK$', decimals: 2, name: 'dollar de Hong Kong' },
  { code: 'TWD', symbol: 'NT$', decimals: 2, name: 'dollar taïwanais' },
  { code: 'JPY', symbol: '¥', decimals: 0, name: 'yen japonais' },
  { code: 'KRW', symbol: '₩', decimals: 0, name: 'won sud-coréen' },
  { code: 'SGD', symbol: 'S$', decimals: 2, name: 'dollar de Singapour' },
  { code: 'MYR', symbol: 'RM', decimals: 2, name: 'ringgit malaisien' },
  { code: 'THB', symbol: '฿', decimals: 2, name: 'baht thaïlandais' },
  { code: 'IDR', symbol: 'Rp', decimals: 2, name: 'roupie indonésienne' },
  { code: 'PHP', symbol: '₱', decimals: 2, name: 'peso philippin' },
  { code: 'VND', symbol: '₫', decimals: 0, name: 'dong vietnamien' },
  { code: 'AUD', symbol: 'A$', decimals: 2, name: 'dollar australien' },
  { code: 'NZD', symbol: 'NZ$', decimals: 2, name: 'dollar néo-zélandais' },
  { code: 'FJD', symbol: 'FJ$', decimals: 2, name: 'dollar fidjien' },
  { code: 'PGK', symbol: 'K', decimals: 2, name: 'kina de Papouasie' },
  { code: 'KZT', symbol: '₸', decimals: 2, name: 'tenge kazakh' },
  { code: 'UZS', symbol: 'soʻm', decimals: 2, name: 'sum ouzbek' },
  { code: 'AZN', symbol: '₼', decimals: 2, name: 'manat azerbaïdjanais' },
  { code: 'GEL', symbol: '₾', decimals: 2, name: 'lari géorgien' },
  { code: 'AMD', symbol: '֏', decimals: 2, name: 'dram arménien' },
];

/** Libellé lisible d'une devise : « XAF — franc CFA (Afrique centrale) · FCFA ». */
export function currencyLabel(code: string): string {
  const c = currency(code);
  return c.name ? `${c.code} — ${t(c.name)} · ${c.symbol}` : `${c.code} — ${c.symbol}`;
}

export function currency(code: string): Currency {
  // Aucune devise n'est supposée : sans choix explicite, on affiche le code tel quel.
  return CURRENCIES.find((c) => c.code === code) ?? { code, symbol: code, decimals: 2 };
}

export function factor(code: string): number {
  return Math.pow(10, currency(code).decimals);
}

/** Convertit une saisie utilisateur ("12,50") en unités mineures. */
export function toMinor(input: string | number, code: string): Minor {
  const raw = typeof input === 'number' ? input : parseFloat(String(input).replace(',', '.'));
  if (!isFinite(raw)) return 0;
  return Math.round(raw * factor(code));
}

/** Convertit des unités mineures en nombre affichable. */
export function toMajor(amount: Minor, code: string): number {
  return amount / factor(code);
}

export function formatMoney(amount: Minor, code: string): string {
  const c = currency(code);
  const value = toMajor(amount, code);
  const formatted = new Intl.NumberFormat(locale(), {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(value);
  return `${formatted} ${c.symbol}`;
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value)} %`;
}
