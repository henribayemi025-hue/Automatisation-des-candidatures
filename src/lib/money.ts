import type { Currency, Minor } from './types';
import { locale } from './i18n';

export const CURRENCIES: Currency[] = [
  { code: 'XAF', symbol: 'FCFA', decimals: 0 },
  { code: 'XOF', symbol: 'CFA', decimals: 0 },
  { code: 'EUR', symbol: '€', decimals: 2 },
  { code: 'USD', symbol: '$', decimals: 2 },
  { code: 'GBP', symbol: '£', decimals: 2 },
  { code: 'CAD', symbol: 'CA$', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', decimals: 2 },
  { code: 'MAD', symbol: 'DH', decimals: 2 },
  { code: 'NGN', symbol: '₦', decimals: 2 },
  { code: 'GHS', symbol: 'GH₵', decimals: 2 },
  { code: 'ZAR', symbol: 'R', decimals: 2 },
  { code: 'KES', symbol: 'KSh', decimals: 2 },
  { code: 'AED', symbol: 'AED', decimals: 2 },
  { code: 'INR', symbol: '₹', decimals: 2 },
  { code: 'CNY', symbol: '¥', decimals: 2 },
  { code: 'BRL', symbol: 'R$', decimals: 2 },
];

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
