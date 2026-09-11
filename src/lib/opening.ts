import * as XLSX from 'xlsx';
import { accountCode } from './chart';
import type { AccountKey } from './chart';
import { toMinor } from './money';
import type { Company, JournalLine, Minor } from './types';

/**
 * Reprise d'un bilan existant : les soldes à la date d'ouverture deviennent une
 * écriture d'à-nouveaux, équilibrée par construction. L'entreprise qui existe
 * depuis 2012 n'a pas à ressaisir dix ans d'opérations : elle part de son
 * dernier bilan, comme le ferait son cabinet.
 */

export interface OpeningField {
  key: AccountKey;
  label: string;
  side: 'ASSET' | 'LIABILITY';
  hint: string;
}

/** Les postes qu'une petite entreprise retrouve sur son bilan, dans l'ordre du bilan. */
export const OPENING_FIELDS: OpeningField[] = [
  { key: 'EQUIPMENT', label: 'Matériel, mobilier, véhicules', side: 'ASSET', hint: 'Valeur nette (après amortissements)' },
  { key: 'INVENTORY', label: 'Stock de marchandises', side: 'ASSET', hint: 'Au coût d’achat' },
  { key: 'CUSTOMERS', label: 'Ce que les clients vous doivent', side: 'ASSET', hint: 'Créances clients' },
  { key: 'CASH', label: 'Caisse (espèces)', side: 'ASSET', hint: '' },
  { key: 'MOBILE_MONEY', label: 'Mobile money', side: 'ASSET', hint: '' },
  { key: 'BANK', label: 'Banque', side: 'ASSET', hint: '' },
  { key: 'SUPPLIERS', label: 'Ce que vous devez aux fournisseurs', side: 'LIABILITY', hint: 'Dettes fournisseurs' },
  { key: 'VAT_COLLECTED', label: 'Taxe à reverser', side: 'LIABILITY', hint: 'TVA collectée non encore reversée' },
];

export interface OpeningResult {
  lines: JournalLine[];
  totalAssets: Minor;
  totalLiabilities: Minor;
  /** Différence imputée aux capitaux propres (positive : apports ; négative : pertes cumulées). */
  equity: Minor;
}

/** Construit l'écriture d'à-nouveaux : l'écart actif − dettes va au capital (ou à la perte cumulée). */
export function buildOpeningEntry(company: Company, amounts: Partial<Record<AccountKey, Minor>>, equityOverride?: Minor): OpeningResult {
  const chart = company.chart;
  const lines: JournalLine[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  for (const f of OPENING_FIELDS) {
    const v = amounts[f.key] ?? 0;
    if (v <= 0) continue;
    if (f.side === 'ASSET') {
      totalAssets += v;
      lines.push({ account: accountCode(chart, f.key), label: f.label, debit: v, credit: 0 });
    } else {
      totalLiabilities += v;
      lines.push({ account: accountCode(chart, f.key), label: f.label, debit: 0, credit: v });
    }
  }
  const equity = equityOverride ?? totalAssets - totalLiabilities;
  const capitalCode = accountCode(chart, 'CAPITAL');
  const resultCode = accountCode(chart, 'RESULT');
  if (equity > 0) lines.push({ account: capitalCode, label: 'Capitaux propres à l’ouverture', debit: 0, credit: equity });
  if (equity < 0) lines.push({ account: resultCode, label: 'Pertes cumulées à l’ouverture', debit: -equity, credit: 0 });
  // Si un capital est imposé, l'écart restant est un report à nouveau.
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  if (debit !== credit) {
    const gap = debit - credit;
    lines.push({ account: resultCode, label: gap > 0 ? 'Report à nouveau (créditeur)' : 'Report à nouveau (débiteur)', debit: gap < 0 ? -gap : 0, credit: gap > 0 ? gap : 0 });
  }
  return { lines, totalAssets, totalLiabilities, equity };
}

export interface BalanceRow {
  code: string;
  label: string;
  debit: Minor;
  credit: Minor;
  /** Clé du plan Finjaro retenue, ou vide si le compte n'a pas pu être rattaché. */
  key: AccountKey | '';
}

/** Rattache un numéro de compte (SYSCOHADA ou PCG) à un poste Finjaro d'après ses premiers chiffres. */
export function guessKey(code: string, chart: Company['chart']): AccountKey | '' {
  const c = code.replace(/\D/g, '');
  if (!c) return '';
  const two = c.slice(0, 2);
  const three = c.slice(0, 3);
  if (c.startsWith('1')) return c.startsWith('12') || c.startsWith('13') ? 'RESULT' : 'CAPITAL';
  if (c.startsWith('2')) return 'EQUIPMENT';
  if (c.startsWith('3')) return 'INVENTORY';
  if (two === '40') return 'SUPPLIERS';
  if (two === '41') return 'CUSTOMERS';
  if (chart === 'PCG' ? three === '445' : two === '44') return c.includes('4457') || c.includes('443') ? 'VAT_COLLECTED' : 'VAT_DEDUCTIBLE';
  if (two === '52' || two === '51') return chart === 'PCG' && three === '511' ? 'MOBILE_MONEY' : 'BANK';
  if (two === '53' || two === '57') return 'CASH';
  if (c.startsWith('6')) return 'MISC_EXPENSE';
  if (c.startsWith('7')) return 'MISC_REVENUE';
  return '';
}

/** Lit une balance exportée d'un autre logiciel (Excel ou CSV) : compte, libellé, débit, crédit — ou solde signé. */
export async function parseBalanceFile(file: File, currency: string, chart: Company['chart']): Promise<BalanceRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });
  const rows: BalanceRow[] = [];
  const num = (v: unknown) => {
    const s = String(v ?? '').replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? toMinor(Math.abs(n), currency) : 0;
  };
  for (const raw of grid) {
    const cells = (raw as unknown[]).map((c) => String(c ?? '').trim());
    const codeIdx = cells.findIndex((c) => /^\d{3,8}$/.test(c));
    if (codeIdx < 0) continue;
    const code = cells[codeIdx];
    const label = cells.slice(codeIdx + 1).find((c) => c && !/^[-+]?[\d\s.,]+$/.test(c)) ?? '';
    const numbers = cells.slice(codeIdx + 1).filter((c) => /^[-+]?\d[\d\s.,]*$/.test(c));
    let debit = 0;
    let credit = 0;
    if (numbers.length >= 2) {
      debit = num(numbers[numbers.length - 2]);
      credit = num(numbers[numbers.length - 1]);
      // Une balance donne souvent les totaux puis les soldes : on garde le solde net.
      if (debit && credit) {
        const net = debit - credit;
        debit = net > 0 ? net : 0;
        credit = net < 0 ? -net : 0;
      }
    } else if (numbers.length === 1) {
      const signed = String(numbers[0]).startsWith('-');
      const v = num(numbers[0]);
      if (signed) credit = v;
      else debit = v;
    }
    if (!debit && !credit) continue;
    rows.push({ code, label, debit, credit, key: guessKey(code, chart) });
  }
  return rows;
}

/** Transforme une balance rattachée en écriture d'à-nouveaux (les comptes non rattachés sont ignorés et signalés). */
export function balanceToLines(company: Company, rows: BalanceRow[]): { lines: JournalLine[]; skipped: BalanceRow[] } {
  const chart = company.chart;
  const totals = new Map<AccountKey, { debit: Minor; credit: Minor; label: string }>();
  const skipped: BalanceRow[] = [];
  for (const r of rows) {
    if (!r.key) {
      skipped.push(r);
      continue;
    }
    const cur = totals.get(r.key) ?? { debit: 0, credit: 0, label: r.label };
    cur.debit += r.debit;
    cur.credit += r.credit;
    totals.set(r.key, cur);
  }
  const lines: JournalLine[] = [];
  for (const [key, v] of totals) {
    const net = v.debit - v.credit;
    if (net === 0) continue;
    lines.push({ account: accountCode(chart, key), label: v.label || key, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 });
  }
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  if (debit !== credit) {
    const gap = debit - credit;
    lines.push({ account: accountCode(chart, 'RESULT'), label: 'Écart de reprise (report à nouveau)', debit: gap < 0 ? -gap : 0, credit: gap > 0 ? gap : 0 });
  }
  return { lines, skipped };
}
