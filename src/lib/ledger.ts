import type { Account, JournalEntry, Minor } from './types';
import { t } from './i18n';

export interface AccountBalance {
  account: Account;
  debit: Minor;
  credit: Minor;
  /** Solde signé dans le sens naturel du compte. */
  balance: Minor;
}

export interface LedgerRow {
  entry: JournalEntry;
  debit: Minor;
  credit: Minor;
  running: Minor;
}

export function isBalanced(entry: JournalEntry): boolean {
  const d = entry.lines.reduce((s, l) => s + l.debit, 0);
  const c = entry.lines.reduce((s, l) => s + l.credit, 0);
  return d === c;
}

export function entryTotal(entry: JournalEntry): Minor {
  return entry.lines.reduce((s, l) => s + l.debit, 0);
}

export function inRange(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function entriesInRange(entries: JournalEntry[], from?: string, to?: string): JournalEntry[] {
  return entries.filter((e) => e.posted && inRange(e.date, from, to));
}

export function trialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  from?: string,
  to?: string,
): AccountBalance[] {
  const totals = new Map<string, { debit: Minor; credit: Minor }>();
  for (const entry of entriesInRange(entries, from, to)) {
    for (const line of entry.lines) {
      const acc = totals.get(line.account) ?? { debit: 0, credit: 0 };
      acc.debit += line.debit;
      acc.credit += line.credit;
      totals.set(line.account, acc);
    }
  }
  return accounts
    .map((account) => {
      const t = totals.get(account.code) ?? { debit: 0, credit: 0 };
      const raw = t.debit - t.credit;
      return {
        account,
        debit: t.debit,
        credit: t.credit,
        balance: account.normal === 'DEBIT' ? raw : -raw,
      };
    })
    .filter((b) => b.debit !== 0 || b.credit !== 0);
}

export function accountLedger(
  code: string,
  entries: JournalEntry[],
  normal: 'DEBIT' | 'CREDIT',
  from?: string,
  to?: string,
): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let running = 0;
  const sorted = entriesInRange(entries, from, to).sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of sorted) {
    for (const line of entry.lines) {
      if (line.account !== code) continue;
      const delta = normal === 'DEBIT' ? line.debit - line.credit : line.credit - line.debit;
      running += delta;
      rows.push({ entry, debit: line.debit, credit: line.credit, running });
    }
  }
  return rows;
}

export function balanceOf(
  code: string,
  entries: JournalEntry[],
  normal: 'DEBIT' | 'CREDIT',
  from?: string,
  to?: string,
): Minor {
  let total = 0;
  for (const entry of entriesInRange(entries, from, to)) {
    for (const line of entry.lines) {
      if (line.account !== code) continue;
      total += normal === 'DEBIT' ? line.debit - line.credit : line.credit - line.debit;
    }
  }
  return total;
}

export interface IncomeStatement {
  revenue: AccountBalance[];
  expenses: AccountBalance[];
  totalRevenue: Minor;
  totalExpenses: Minor;
  netIncome: Minor;
}

/**
 * Compte de résultat de la période. Les écritures de clôture sont écartées :
 * elles ramènent les comptes 6 et 7 à zéro, et sans cela le compte de résultat
 * d'un exercice clos afficherait des colonnes vides.
 */
export function incomeStatement(
  accounts: Account[],
  entries: JournalEntry[],
  from?: string,
  to?: string,
): IncomeStatement {
  const balances = trialBalance(accounts, entries.filter((e) => e.journal !== 'CL'), from, to);
  const revenue = balances.filter((b) => b.account.kind === 'REVENUE');
  const expenses = balances.filter((b) => b.account.kind === 'EXPENSE');
  const totalRevenue = revenue.reduce((s, b) => s + sheetValue(b), 0);
  const totalExpenses = expenses.reduce((s, b) => s + sheetValue(b), 0);
  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

export interface BalanceSheet {
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totalAssets: Minor;
  totalLiabilities: Minor;
  totalEquity: Minor;
  netIncome: Minor;
  /** Actif - (Passif + Capitaux + Résultat). Doit valoir 0. */
  difference: Minor;
}

/**
 * Contribution d'un compte à son côté du bilan. Presque toujours son solde
 * naturel — sauf pour un compte soustractif comme les amortissements cumulés,
 * qui est un compte d'actif au solde créditeur : il vient EN MOINS de l'actif.
 */
export function sheetValue(b: AccountBalance): Minor {
  const expected = b.account.kind === 'ASSET' || b.account.kind === 'EXPENSE' ? 'DEBIT' : 'CREDIT';
  return b.account.normal === expected ? b.balance : -b.balance;
}

export function balanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  to?: string,
): BalanceSheet {
  const balances = trialBalance(accounts, entries, undefined, to);
  const assets = balances.filter((b) => b.account.kind === 'ASSET');
  const liabilities = balances.filter((b) => b.account.kind === 'LIABILITY');
  const equity = balances.filter((b) => b.account.kind === 'EQUITY');
  // Ici on GARDE les écritures de clôture. Une fois l'exercice soldé, le
  // résultat n'est plus dans les comptes 6 et 7 mais au compte « Résultat »,
  // qui est déjà compté dans les capitaux propres : le bilan reste équilibré
  // avant comme après la clôture.
  const netIncome = balances
    .filter((b) => b.account.kind === 'REVENUE')
    .reduce((s, b) => s + sheetValue(b), 0)
    - balances.filter((b) => b.account.kind === 'EXPENSE').reduce((s, b) => s + sheetValue(b), 0);
  const totalAssets = assets.reduce((s, b) => s + sheetValue(b), 0);
  const totalLiabilities = liabilities.reduce((s, b) => s + sheetValue(b), 0);
  const totalEquity = equity.reduce((s, b) => s + sheetValue(b), 0);
  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    netIncome,
    difference: totalAssets - (totalLiabilities + totalEquity + netIncome),
  };
}

export interface AuditCheck {
  id: string;
  label: string;
  severity: 'OK' | 'WARN' | 'ERROR';
  detail: string;
}

/** Contrôles de cohérence exécutés par le module Audit. */
export function runAuditChecks(
  accounts: Account[],
  entries: JournalEntry[],
): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const unbalanced = entries.filter((e) => !isBalanced(e));
  checks.push({
    id: 'balanced-entries',
    label: t('Équilibre des écritures'),
    severity: unbalanced.length ? 'ERROR' : 'OK',
    detail: unbalanced.length
      ? `${unbalanced.length} écriture(s) déséquilibrée(s) : ${unbalanced.map((e) => e.ref).join(', ')}`
      : t('Toutes les écritures sont équilibrées (débit = crédit).'),
  });

  const sheet = balanceSheet(accounts, entries);
  checks.push({
    id: 'balance-sheet',
    label: t('Équation du bilan'),
    severity: sheet.difference === 0 ? 'OK' : 'ERROR',
    detail:
      sheet.difference === 0
        ? t('Actif = Passif + Capitaux propres + Résultat.')
        : `Écart de ${sheet.difference} unités mineures entre actif et passif.`,
  });

  const known = new Set(accounts.map((a) => a.code));
  const orphans = new Set<string>();
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!known.has(line.account)) orphans.add(line.account);
    }
  }
  checks.push({
    id: 'known-accounts',
    label: t('Comptes référencés'),
    severity: orphans.size ? 'ERROR' : 'OK',
    detail: orphans.size
      ? `Comptes absents du plan comptable : ${[...orphans].join(', ')}`
      : t('Toutes les écritures pointent vers un compte du plan comptable.'),
  });

  const zeroLines = entries.filter((e) => e.lines.some((l) => l.debit === 0 && l.credit === 0));
  checks.push({
    id: 'zero-lines',
    label: t('Lignes à zéro'),
    severity: zeroLines.length ? 'WARN' : 'OK',
    detail: zeroLines.length
      ? `${zeroLines.length} écriture(s) contiennent une ligne sans montant.`
      : t('Aucune ligne sans montant.'),
  });

  const bothSides = entries.filter((e) => e.lines.some((l) => l.debit > 0 && l.credit > 0));
  checks.push({
    id: 'single-side',
    label: t('Sens unique par ligne'),
    severity: bothSides.length ? 'ERROR' : 'OK',
    detail: bothSides.length
      ? `${bothSides.length} écriture(s) ont une ligne à la fois au débit et au crédit.`
      : t('Chaque ligne porte un seul sens (débit ou crédit).'),
  });

  const cashAccounts = accounts.filter((a) => a.class === 5);
  const negativeCash = cashAccounts
    .map((a) => ({ a, b: balanceOf(a.code, entries, a.normal) }))
    .filter((x) => x.b < 0);
  checks.push({
    id: 'negative-cash',
    label: t('Trésorerie négative'),
    severity: negativeCash.length ? 'WARN' : 'OK',
    detail: negativeCash.length
      ? t('Solde négatif sur : {list}', { list: negativeCash.map((x) => `${x.a.code} ${t(x.a.label)}`).join(', ') })
      : t('Aucun compte de trésorerie négatif.'),
  });

  const chronology = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const backdated = chronology.filter((e) => e.date > e.createdAt.slice(0, 10));
  checks.push({
    id: 'future-dated',
    label: t('Écritures postdatées'),
    severity: backdated.length ? 'WARN' : 'OK',
    detail: backdated.length
      ? `${backdated.length} écriture(s) portent une date postérieure à leur saisie.`
      : t('Aucune écriture postdatée.'),
  });

  return checks;
}
