import { accountCode } from './chart';
import { balanceOf, incomeStatement } from './ledger';
import type { DB, Minor, Sale } from './types';

export function monthStart(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function saleRevenue(sale: Sale): Minor {
  return sale.total - sale.vat;
}

export function saleCost(sale: Sale): Minor {
  return sale.lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
}

export interface Snapshot {
  revenueToday: Minor;
  salesToday: number;
  revenueMonth: Minor;
  salesMonth: number;
  expensesMonth: Minor;
  grossMargin: Minor;
  netIncome: Minor;
  receivables: Minor;
  payables: Minor;
  cashOnHand: Minor;
  outOfStock: number;
  lowStock: number;
  stockValue: Minor;
}

export function snapshot(db: DB): Snapshot {
  const today = new Date().toISOString().slice(0, 10);
  const from = monthStart();

  const confirmed = db.sales.filter((s) => s.status === 'CONFIRMED');
  const todaySales = confirmed.filter((s) => s.date === today);
  const monthSales = confirmed.filter((s) => s.date >= from);

  const income = incomeStatement(db.accounts, db.entries, from, today);
  const cogsCode = accountCode(db.company.chart, 'INVENTORY_CHANGE');
  const cogs = income.expenses.find((e) => e.account.code === cogsCode)?.balance ?? 0;

  const receivables = db.debts
    .filter((d) => d.party === 'CUSTOMER')
    .reduce((s, d) => s + Math.max(0, d.amount - d.payments.reduce((p, x) => p + x.amount, 0)), 0);
  const payables = db.debts
    .filter((d) => d.party === 'SUPPLIER')
    .reduce((s, d) => s + Math.max(0, d.amount - d.payments.reduce((p, x) => p + x.amount, 0)), 0);

  const cashOnHand =
    balanceOf(accountCode(db.company.chart, 'CASH'), db.entries, 'DEBIT') +
    balanceOf(accountCode(db.company.chart, 'MOBILE_MONEY'), db.entries, 'DEBIT') +
    balanceOf(accountCode(db.company.chart, 'BANK'), db.entries, 'DEBIT');

  const active = db.products.filter((p) => !p.archived);

  return {
    revenueToday: todaySales.reduce((s, x) => s + saleRevenue(x), 0),
    salesToday: todaySales.length,
    revenueMonth: monthSales.reduce((s, x) => s + saleRevenue(x), 0),
    salesMonth: monthSales.length,
    expensesMonth: income.totalExpenses - cogs,
    grossMargin: income.totalRevenue - cogs,
    netIncome: income.netIncome,
    receivables,
    payables,
    cashOnHand,
    outOfStock: active.filter((p) => p.stock <= 0).length,
    lowStock: active.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint).length,
    stockValue: active.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0),
  };
}

export interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
}

export function dailySeries(db: DB, days: number, majorDivisor: number): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const revenue = db.sales
      .filter((s) => s.status === 'CONFIRMED' && s.date === key)
      .reduce((s, x) => s + saleRevenue(x), 0);
    const expenses = db.expenses.filter((e) => e.date === key).reduce((s, e) => s + e.amount, 0);
    points.push({
      date: key,
      label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      revenue: revenue / majorDivisor,
      expenses: expenses / majorDivisor,
    });
  }
  return points;
}

export interface ProductPerf {
  productId: string;
  name: string;
  qty: number;
  revenue: Minor;
  cost: Minor;
  margin: Minor;
}

export function productPerformance(db: DB, from?: string, to?: string): ProductPerf[] {
  const map = new Map<string, ProductPerf>();
  for (const sale of db.sales) {
    if (sale.status !== 'CONFIRMED') continue;
    if (from && sale.date < from) continue;
    if (to && sale.date > to) continue;
    for (const line of sale.lines) {
      const cur = map.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        qty: 0,
        revenue: 0,
        cost: 0,
        margin: 0,
      };
      cur.qty += line.qty;
      cur.revenue += line.unitPrice * line.qty;
      cur.cost += line.unitCost * line.qty;
      cur.margin = cur.revenue - cur.cost;
      map.set(line.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function outstanding(debt: { amount: Minor; payments: { amount: Minor }[] }): Minor {
  return Math.max(0, debt.amount - debt.payments.reduce((s, p) => s + p.amount, 0));
}
