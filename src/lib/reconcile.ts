import type { DB, ISODate, JournalEntry, Minor, Reconciliation } from './types';

/**
 * Rapprochement bancaire. La banque et la comptabilité ne disent jamais tout à
 * fait la même chose au même moment : un chèque mis à l'encaissement met des
 * jours à passer. Pointer, c'est cocher ce qui apparaît des deux côtés ; ce qui
 * reste non pointé explique l'écart entre le solde du relevé et le solde des
 * comptes.
 */

export interface CashLine {
  entry: JournalEntry;
  /** Entrée d'argent (débit) moins sortie (crédit), sur ce compte. */
  amount: Minor;
  reconciled: boolean;
  statementDate: ISODate | null;
}

export function cashLines(db: DB, account: string, from?: string, to?: string): CashLine[] {
  const marks = new Map<string, Reconciliation>();
  for (const r of db.reconciliations) if (r.account === account) marks.set(r.entryId, r);

  const rows: CashLine[] = [];
  for (const entry of db.entries) {
    if (!entry.posted) continue;
    if (from && entry.date < from) continue;
    if (to && entry.date > to) continue;
    const amount = entry.lines
      .filter((l) => l.account === account)
      .reduce((s, l) => s + l.debit - l.credit, 0);
    if (amount === 0 && !entry.lines.some((l) => l.account === account)) continue;
    const mark = marks.get(entry.id) ?? null;
    rows.push({ entry, amount, reconciled: !!mark, statementDate: mark?.statementDate ?? null });
  }
  return rows.sort((a, b) => a.entry.date.localeCompare(b.entry.date));
}

export interface ReconcileSummary {
  /** Solde comptable de toutes les lignes de la période. */
  book: Minor;
  /** Solde des seules lignes pointées : ce que la banque devrait afficher. */
  reconciled: Minor;
  /** Lignes en attente et leur poids. */
  pending: Minor;
  pendingCount: number;
  /** Écart entre le solde du relevé saisi et le solde pointé. */
  gap: Minor;
}

export function reconcileSummary(lines: CashLine[], statementBalance: Minor | null): ReconcileSummary {
  const book = lines.reduce((s, l) => s + l.amount, 0);
  const reconciled = lines.filter((l) => l.reconciled).reduce((s, l) => s + l.amount, 0);
  const pendingLines = lines.filter((l) => !l.reconciled);
  return {
    book,
    reconciled,
    pending: pendingLines.reduce((s, l) => s + l.amount, 0),
    pendingCount: pendingLines.length,
    gap: statementBalance === null ? 0 : statementBalance - reconciled,
  };
}

/**
 * Propose un pointage automatique : une ligne du relevé et une écriture qui ont
 * le même montant et une date proche. On ne coche jamais tout seul deux
 * candidats pour un même montant — l'ambiguïté revient à la personne.
 */
export interface StatementRow {
  date: ISODate;
  label: string;
  amount: Minor;
}

export interface Suggestion {
  row: StatementRow;
  entryId: string | null;
  reason: string;
}

export function suggestMatches(lines: CashLine[], rows: StatementRow[], toleranceDays = 5): Suggestion[] {
  const free = lines.filter((l) => !l.reconciled);
  const used = new Set<string>();
  return rows.map((row) => {
    const candidates = free.filter(
      (l) => !used.has(l.entry.id) && l.amount === row.amount && Math.abs(daysBetween(l.entry.date, row.date)) <= toleranceDays,
    );
    if (candidates.length === 1) {
      used.add(candidates[0].entry.id);
      return { row, entryId: candidates[0].entry.id, reason: 'Même montant, même date' };
    }
    return {
      row,
      entryId: null,
      reason: candidates.length ? `${candidates.length} écritures possibles` : 'Aucune écriture correspondante',
    };
  });
}

function daysBetween(a: string, b: string): number {
  return (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}
