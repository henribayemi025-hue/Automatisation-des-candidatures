import { accountCode } from './chart';
import { balanceOf } from './ledger';
import { outstanding, saleCost, saleRevenue } from './metrics';
import type { DB, Minor } from './types';

/**
 * Indicateurs du tableau de bord, avec les conventions de la finance :
 * MTD (depuis le 1er du mois), YTD (depuis le début de l'exercice), 30 jours,
 * et pour chacun la comparaison avec la période précédente équivalente.
 * Tout est calculé depuis les opérations enregistrées — rien n'est estimé.
 */

export type Period = 'MTD' | 'YTD' | '30D';

export interface Range {
  from: string;
  to: string;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

/** Début de l'exercice en cours d'après le réglage MM-JJ de l'entreprise. */
export function fiscalYearStart(fiscalYearStartMMDD: string, todayISO: string): string {
  const [mm, dd] = (fiscalYearStartMMDD || '01-01').split('-');
  const year = Number(todayISO.slice(0, 4));
  const candidate = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  return candidate <= todayISO ? candidate : `${year - 1}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** Période courante et période de comparaison (mois précédent, exercice précédent, 30 jours d'avant). */
export function periodRanges(period: Period, todayISO: string, fiscalYearStartMMDD: string): { current: Range; previous: Range; compareLabel: string } {
  if (period === 'MTD') {
    const from = `${todayISO.slice(0, 7)}-01`;
    const prevMonth = new Date(`${from}T12:00:00.000Z`);
    prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
    const prevFrom = iso(prevMonth);
    const dayOfMonth = Number(todayISO.slice(8, 10));
    const prevToDate = new Date(`${prevFrom}T12:00:00.000Z`);
    prevToDate.setUTCDate(Math.min(dayOfMonth, new Date(prevToDate.getUTCFullYear(), prevToDate.getUTCMonth() + 1, 0).getDate()));
    return { current: { from, to: todayISO }, previous: { from: prevFrom, to: iso(prevToDate) }, compareLabel: 'vs M-1' };
  }
  if (period === 'YTD') {
    const from = fiscalYearStart(fiscalYearStartMMDD, todayISO);
    const prevFrom = `${Number(from.slice(0, 4)) - 1}${from.slice(4)}`;
    const prevTo = `${Number(todayISO.slice(0, 4)) - 1}${todayISO.slice(4)}`;
    return { current: { from, to: todayISO }, previous: { from: prevFrom, to: prevTo }, compareLabel: 'vs N-1' };
  }
  const from = shiftDays(todayISO, -29);
  return { current: { from, to: todayISO }, previous: { from: shiftDays(from, -30), to: shiftDays(from, -1) }, compareLabel: 'vs 30 j précédents' };
}

export interface PeriodFigures {
  revenue: Minor;
  cost: Minor;
  grossMargin: Minor;
  marginRate: number | null;
  expenses: Minor;
  net: Minor;
  sales: number;
  averageTicket: Minor;
}

function figures(db: DB, range: Range): PeriodFigures {
  const sales = db.sales.filter((s) => s.status === 'CONFIRMED' && s.date >= range.from && s.date <= range.to);
  const revenue = sales.reduce((s, x) => s + saleRevenue(x), 0);
  const cost = sales.reduce((s, x) => s + saleCost(x), 0);
  const expenses = db.expenses.filter((e) => e.date >= range.from && e.date <= range.to).reduce((s, e) => s + e.amount, 0);
  const grossMargin = revenue - cost;
  return {
    revenue,
    cost,
    grossMargin,
    marginRate: revenue > 0 ? grossMargin / revenue : null,
    expenses,
    net: grossMargin - expenses,
    sales: sales.length,
    averageTicket: sales.length ? Math.round(revenue / sales.length) : 0,
  };
}

/** Variation en pourcentage, ou null quand la base est nulle (on n'affiche pas « +∞ »). */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export interface Series {
  dates: string[];
  revenue: number[];
  expenses: number[];
  cash: number[];
}

/** Séries journalières sur la période : recettes, dépenses, et trésorerie cumulée en fin de journée. */
export function dailySeriesFor(db: DB, range: Range, divisor: number): Series {
  const chart = db.company.chart;
  const cashCodes = new Set([accountCode(chart, 'CASH'), accountCode(chart, 'MOBILE_MONEY'), accountCode(chart, 'BANK')]);
  const dates: string[] = [];
  for (let d = range.from; d <= range.to; d = shiftDays(d, 1)) dates.push(d);

  const revenueByDay = new Map<string, number>();
  const expensesByDay = new Map<string, number>();
  for (const s of db.sales) if (s.status === 'CONFIRMED') revenueByDay.set(s.date, (revenueByDay.get(s.date) ?? 0) + saleRevenue(s));
  for (const e of db.expenses) expensesByDay.set(e.date, (expensesByDay.get(e.date) ?? 0) + e.amount);

  // Trésorerie : solde des comptes de trésorerie à la veille du début, puis cumul jour par jour.
  let cash = 0;
  const cashByDay = new Map<string, number>();
  for (const entry of db.entries) {
    if (!entry.posted) continue;
    for (const line of entry.lines) {
      if (!cashCodes.has(line.account)) continue;
      const delta = line.debit - line.credit;
      if (entry.date < range.from) cash += delta;
      else cashByDay.set(entry.date, (cashByDay.get(entry.date) ?? 0) + delta);
    }
  }
  const cashSeries: number[] = [];
  for (const d of dates) {
    cash += cashByDay.get(d) ?? 0;
    cashSeries.push(cash / divisor);
  }
  return {
    dates,
    revenue: dates.map((d) => (revenueByDay.get(d) ?? 0) / divisor),
    expenses: dates.map((d) => (expensesByDay.get(d) ?? 0) / divisor),
    cash: cashSeries,
  };
}

export interface Dashboard {
  period: Period;
  compareLabel: string;
  current: PeriodFigures;
  previous: PeriodFigures;
  series: Series;
  cashOnHand: Minor;
  cashByAccount: { label: string; value: Minor }[];
  receivables: Minor;
  receivablesCount: number;
  receivablesOverdue: number;
  payables: Minor;
  payablesCount: number;
  stockValue: Minor;
  outOfStock: number;
  lowStock: number;
  openSession: boolean;
}

export function dashboard(db: DB, period: Period, todayISO: string, divisor: number): Dashboard {
  const { current, previous, compareLabel } = periodRanges(period, todayISO, db.company.fiscalYearStart);
  const chart = db.company.chart;
  const cashByAccount = [
    { label: 'Caisse', value: balanceOf(accountCode(chart, 'CASH'), db.entries, 'DEBIT') },
    { label: 'Mobile money', value: balanceOf(accountCode(chart, 'MOBILE_MONEY'), db.entries, 'DEBIT') },
    { label: 'Banque', value: balanceOf(accountCode(chart, 'BANK'), db.entries, 'DEBIT') },
  ];
  const customerDebts = db.debts.filter((d) => d.party === 'CUSTOMER' && outstanding(d) > 0);
  const supplierDebts = db.debts.filter((d) => d.party === 'SUPPLIER' && outstanding(d) > 0);
  const overdueLimit = shiftDays(todayISO, -30);
  const active = db.products.filter((p) => !p.archived);
  return {
    period,
    compareLabel,
    current: figures(db, current),
    previous: figures(db, previous),
    series: dailySeriesFor(db, current, divisor),
    cashOnHand: cashByAccount.reduce((s, c) => s + c.value, 0),
    cashByAccount,
    receivables: customerDebts.reduce((s, d) => s + outstanding(d), 0),
    receivablesCount: customerDebts.length,
    receivablesOverdue: customerDebts.filter((d) => d.date < overdueLimit).length,
    payables: supplierDebts.reduce((s, d) => s + outstanding(d), 0),
    payablesCount: supplierDebts.length,
    stockValue: active.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0),
    outOfStock: active.filter((p) => p.stock <= 0).length,
    lowStock: active.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint).length,
    openSession: db.sessions.some((s) => !s.closedAt),
  };
}
