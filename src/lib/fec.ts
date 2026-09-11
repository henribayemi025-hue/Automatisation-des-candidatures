import type { Account, Company, JournalEntry } from './types';

/**
 * Export FEC — Fichier des Écritures Comptables. En France, l'administration
 * peut le réclamer lors d'un contrôle : c'est le journal complet, une ligne par
 * ligne d'écriture, dans un format fixe de 18 colonnes séparées par des
 * tabulations (article A47 A-1 du Livre des procédures fiscales).
 *
 * Les montants y sont en unités principales avec une virgule décimale, les
 * dates au format AAAAMMJJ, et le fichier n'a ni total ni ligne vide.
 */

const COLUMNS = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
];

const JOURNAL_LABELS: Record<string, string> = {
  VT: 'Ventes',
  AC: 'Achats',
  CA: 'Caisse',
  BQ: 'Banque',
  OD: 'Opérations diverses',
  CL: 'Clôture',
};

function fecDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

/** Montant en unités principales, virgule décimale, sans séparateur de milliers. */
function fecAmount(minor: number, decimals: number): string {
  if (decimals === 0) return String(Math.round(minor)).replace('-', '-');
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const unit = Math.floor(abs / 10 ** decimals);
  const cents = String(abs % 10 ** decimals).padStart(decimals, '0');
  return `${sign}${unit},${cents}`;
}

/** Nettoie un libellé : ni tabulation ni saut de ligne, sinon le fichier se décale. */
function clean(value: string): string {
  return (value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

export interface FecOptions {
  from?: string;
  to?: string;
  /** Décimales de la devise (XAF 0, EUR 2). */
  decimals: number;
}

export function buildFec(
  accounts: Account[],
  entries: JournalEntry[],
  options: FecOptions,
): string {
  const labelOf = new Map(accounts.map((a) => [a.code, a.label]));
  const rows: string[] = [COLUMNS.join('\t')];

  const kept = entries
    .filter((e) => e.posted)
    .filter((e) => (!options.from || e.date >= options.from) && (!options.to || e.date <= options.to))
    .sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref));

  let num = 0;
  for (const entry of kept) {
    num += 1;
    for (const line of entry.lines) {
      rows.push(
        [
          entry.journal,
          JOURNAL_LABELS[entry.journal] ?? entry.journal,
          String(num).padStart(6, '0'),
          fecDate(entry.date),
          line.account,
          clean(labelOf.get(line.account) ?? line.label ?? ''),
          '',
          '',
          clean(entry.ref),
          fecDate(entry.date),
          clean(line.label ? `${entry.label} — ${line.label}` : entry.label),
          fecAmount(line.debit, options.decimals),
          fecAmount(line.credit, options.decimals),
          '',
          '',
          fecDate(entry.createdAt),
          '',
          '',
        ].join('\t'),
      );
    }
  }
  return rows.join('\r\n');
}

/** Nom de fichier imposé : SIREN + FEC + date de clôture. Sans SIREN, on met le nom. */
export function fecFileName(company: Company, to: string): string {
  const id = (company.name || 'entreprise').normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9) || 'ENTREPRISE';
  return `${id}FEC${fecDate(to)}.txt`;
}
