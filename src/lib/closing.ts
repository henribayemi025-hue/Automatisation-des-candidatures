import { accountCode } from './chart';
import { fiscalYearStart } from './kpi';
import { trialBalance } from './ledger';
import type { Account, Company, DB, JournalLine, Minor } from './types';

/**
 * Clôture d'exercice. À la fin d'une année comptable, les comptes de charges et
 * de produits doivent repartir de zéro : on les solde un par un et la
 * différence — le résultat — va au compte « Résultat ». Le premier jour de
 * l'exercice suivant, ce résultat passe en « Report à nouveau ».
 *
 * Les comptes de bilan, eux, ne se soldent pas : leur solde continue tout seul,
 * c'est justement ce qu'on appelle les à-nouveaux.
 */

export interface FiscalRange {
  from: string;
  to: string;
  label: string;
}

/** Jour suivant une date, pour dater l'affectation du résultat. */
export function dayAfter(date: string): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Veille de la date donnée. */
function dayBefore(date: string): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Même jour un an plus tard. */
function yearAfter(date: string): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Exercice en cours à la date donnée. */
export function currentFiscalYear(company: Company, todayISO: string): FiscalRange {
  const from = fiscalYearStart(company.fiscalYearStart, todayISO);
  const to = dayBefore(yearAfter(from));
  return { from, to, label: from.slice(0, 4) === to.slice(0, 4) ? from.slice(0, 4) : `${from.slice(0, 4)}–${to.slice(0, 4)}` };
}

/** Exercice précédent — celui qu'on clôture en général. */
export function previousFiscalYear(company: Company, todayISO: string): FiscalRange {
  const current = currentFiscalYear(company, todayISO);
  const from = dayBefore(current.from);
  const start = `${Number(current.from.slice(0, 4)) - 1}${current.from.slice(4)}`;
  return { from: start, to: from, label: start.slice(0, 4) === from.slice(0, 4) ? start.slice(0, 4) : `${start.slice(0, 4)}–${from.slice(0, 4)}` };
}

/**
 * Premier exercice non encore clos. On repart de la dernière clôture ; à
 * défaut, du premier exercice qui contient réellement des écritures — proposer
 * une année vide ne sert à personne.
 */
export function nextToClose(db: DB, todayISO: string): FiscalRange {
  const last = db.closings.map((c) => c.to).sort().pop();
  if (last) {
    const start = dayAfter(last);
    return { from: start, to: dayBefore(yearAfter(start)), label: start.slice(0, 4) };
  }
  const earliest = db.entries.filter((e) => e.posted).map((e) => e.date).sort()[0];
  if (!earliest) return previousFiscalYear(db.company, todayISO);
  const start = fiscalYearStart(db.company.fiscalYearStart, earliest);
  return { from: start, to: dayBefore(yearAfter(start)), label: start.slice(0, 4) };
}

export interface ClosingPlan {
  range: FiscalRange;
  /** Lignes de l'écriture de clôture : chaque compte 6 ou 7 ramené à zéro. */
  lines: JournalLine[];
  revenue: Minor;
  expenses: Minor;
  result: Minor;
  /** Vrai si l'exercice ne contient aucune écriture de gestion. */
  empty: boolean;
}

/**
 * Prépare l'écriture qui solde les comptes de gestion de l'exercice. On part
 * des cumuls réels du grand livre, jamais d'un total recalculé à part : ce qui
 * est écrit dans le journal est ce qui est soldé.
 */
export function closingPlan(accounts: Account[], db: DB, range: FiscalRange): ClosingPlan {
  const chart = db.company.chart;
  // Les écritures de clôture précédentes ne doivent pas être resoldées.
  const source = db.entries.filter((e) => e.journal !== 'CL');
  const balances = trialBalance(accounts, source, range.from, range.to);
  const lines: JournalLine[] = [];
  let revenue = 0;
  let expenses = 0;

  for (const b of balances) {
    if (b.account.kind === 'REVENUE' && b.balance !== 0) {
      revenue += b.balance;
      // Un produit a un solde créditeur : on le débite pour le ramener à zéro.
      lines.push({ account: b.account.code, label: b.account.label, debit: b.balance, credit: 0 });
    }
    if (b.account.kind === 'EXPENSE' && b.balance !== 0) {
      expenses += b.balance;
      lines.push({ account: b.account.code, label: b.account.label, debit: 0, credit: b.balance });
    }
  }

  const result = revenue - expenses;
  if (result !== 0) {
    const resultAccount = accountCode(chart, 'RESULT');
    lines.push(
      result > 0
        ? { account: resultAccount, label: "Résultat de l'exercice", debit: 0, credit: result }
        : { account: resultAccount, label: "Résultat de l'exercice", debit: -result, credit: 0 },
    );
  }

  return { range, lines, revenue, expenses, result, empty: lines.length === 0 };
}

/** Écriture du premier jour de l'exercice suivant : le résultat devient du report à nouveau. */
export function carryForwardLines(chart: Company['chart'], result: Minor): JournalLine[] {
  if (result === 0) return [];
  const resultAccount = accountCode(chart, 'RESULT');
  const retained = accountCode(chart, 'RETAINED');
  return result > 0
    ? [
        { account: resultAccount, label: 'Affectation du résultat', debit: result, credit: 0 },
        { account: retained, label: 'Report à nouveau', debit: 0, credit: result },
      ]
    : [
        { account: retained, label: 'Report à nouveau déficitaire', debit: -result, credit: 0 },
        { account: resultAccount, label: 'Affectation du résultat', debit: 0, credit: -result },
      ];
}

/** Un exercice déjà clos est verrouillé : plus aucune écriture ne doit s'y ajouter. */
export function isLocked(db: DB, date: string): boolean {
  return db.closings.some((c) => date >= c.from && date <= c.to);
}
