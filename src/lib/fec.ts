import type { Account, Company, DB, JournalEntry } from './types';
import { accountCode } from './chart';

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

/**
 * Comptes auxiliaires : sur une ligne 411 ou 401, le FEC attend QUI est le
 * client ou le fournisseur (CompAuxNum, CompAuxLib). Sans ça, l'administration
 * voit un 411 global et ne peut pas rapprocher une créance d'une personne.
 *
 * Relevé le 21/09 avec le retour d'une comptable française : les deux
 * colonnes étaient vides depuis le début. Le journal savait pourtant tout —
 * chaque écriture porte sa source (vente, achat, règlement), et la source
 * porte son tiers.
 *
 * Une vente au comptoir n'a pas de tiers : ses colonnes restent vides, c'est
 * exact. Le numéro auxiliaire est stable dans le temps (dérivé de
 * l'identifiant de la fiche), jamais de la position dans une liste.
 */
export interface FecParties {
  customersAccount: string;
  suppliersAccount: string;
  /** Pour une écriture, le tiers concerné — ou rien pour une vente au comptoir. */
  resolve(entry: JournalEntry): { num: string; lib: string } | undefined;
}

export function fecPartiesFrom(db: Pick<DB, 'company' | 'sales' | 'purchases' | 'debts' | 'customers' | 'suppliers'>): FecParties {
  const chart = db.company.chart;
  const aux = (prefix: 'C' | 'F', id: string | null, name: string) =>
    id ? { num: `${prefix}${id.replace(/-/g, '').slice(0, 10).toUpperCase()}`, lib: name } : undefined;
  return {
    customersAccount: accountCode(chart, 'CUSTOMERS'),
    suppliersAccount: accountCode(chart, 'SUPPLIERS'),
    resolve(entry) {
      switch (entry.sourceType) {
        case 'sale': {
          const sale = db.sales.find((x) => x.id === entry.sourceId);
          return sale ? aux('C', sale.customerId, sale.customerName) : undefined;
        }
        case 'purchase': {
          const purchase = db.purchases.find((x) => x.id === entry.sourceId);
          return purchase ? aux('F', purchase.supplierId, purchase.supplierName) : undefined;
        }
        case 'debt': {
          const debt = db.debts.find((x) => x.id === entry.sourceId);
          return debt ? aux(debt.party === 'CUSTOMER' ? 'C' : 'F', debt.partyId, debt.partyName) : undefined;
        }
        default:
          return undefined;
      }
    },
  };
}

export interface FecOptions {
  from?: string;
  to?: string;
  /** Décimales de la devise (XAF 0, EUR 2). */
  decimals: number;
  /** Absent : colonnes auxiliaires vides — à réserver aux contrôles de format. */
  parties?: FecParties;
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
    const tiers = options.parties?.resolve(entry);
    for (const line of entry.lines) {
      const auxiliaire =
        tiers && (line.account === options.parties?.customersAccount || line.account === options.parties?.suppliersAccount)
          ? tiers
          : undefined;
      rows.push(
        [
          entry.journal,
          JOURNAL_LABELS[entry.journal] ?? entry.journal,
          String(num).padStart(6, '0'),
          fecDate(entry.date),
          line.account,
          clean(labelOf.get(line.account) ?? line.label ?? ''),
          clean(auxiliaire?.num ?? ''),
          clean(auxiliaire?.lib ?? ''),
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
