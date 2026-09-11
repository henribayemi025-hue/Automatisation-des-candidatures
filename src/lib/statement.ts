import { toMinor } from './money';
import type { Minor } from './types';

/**
 * Lecture d'un relevé collé ou importé : messages mobile money, export bancaire,
 * CSV, ou simple liste écrite à la main. Rien n'est enregistré ici — chaque
 * ligne est proposée à la personne, qui confirme le sens et le poste.
 */

export type Direction = 'IN' | 'OUT' | 'UNKNOWN';

export interface StatementRow {
  /** Date au format AAAA-MM-JJ, vide si la ligne n'en porte pas. */
  date: string;
  label: string;
  amount: Minor;
  direction: Direction;
  raw: string;
}

const IN_WORDS = /\b(re[cç]u|re[cç]ue|received|cr[eé]dit[eé]?|credit|d[eé]p[oô]t|deposit|encaiss|versement|entr[eé]e|remboursement|paid you|payment received)\b/i;
const OUT_WORDS = /\b(envoy[eé]|sent|retrait|withdraw\w*|d[eé]bit[eé]?|debit|paiement|payment|achat|purchase|transfert|transfer|frais|fee|charge|facture|abonnement|sortie|loyer|salaire|imp[oô]t|taxe)\b/i;
const BALANCE_WORDS = /\b(solde|balance|nouveau solde|new balance)\b\s*[:=]?\s*[\d\s.,]+/gi;
const DATE_LIKE = /\b(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/g;
const TIME_LIKE = /\b\d{1,2}[:h]\d{2}(:\d{2})?\b/g;

/** Reconnaît 12/09/2026, 12-09-26, 2026-09-12, 12.09.2026. */
function findDate(text: string, todayISO: string): string {
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const today = new Date(todayISO);
  if (/\bhier|yesterday\b/i.test(text)) {
    today.setDate(today.getDate() - 1);
    return today.toISOString().slice(0, 10);
  }
  if (/\baujourd|today\b/i.test(text)) return todayISO;
  return '';
}

/** Premier montant de la ligne, une fois le solde retiré. */
function findAmount(text: string, currency: string): Minor {
  // Les dates et heures ne sont pas des montants : on les retire d'abord.
  const cleaned = text.replace(BALANCE_WORDS, ' ').replace(DATE_LIKE, ' ').replace(TIME_LIKE, ' ');
  // 12 500 · 12,500.50 · 12.500,50 · 1250
  const match = cleaned.match(/\d[\d\s.,]{0,15}\d|\d/g);
  if (!match) return 0;
  for (const raw of match) {
    const compact = raw.replace(/\s/g, '');
    // Une date résiduelle ou un numéro de téléphone ne sont pas des montants.
    if (/^\d{2}[-/.]\d{2}/.test(compact) || compact.length > 12) continue;
    let normalized = compact;
    if (compact.includes(',') && compact.includes('.')) {
      normalized = compact.lastIndexOf(',') > compact.lastIndexOf('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(/,/g, '');
    } else if ((compact.match(/,/g) ?? []).length === 1 && /,\d{1,2}$/.test(compact)) {
      normalized = compact.replace(',', '.');
    } else {
      normalized = compact.replace(/[,]/g, '');
    }
    const value = toMinor(normalized, currency);
    if (value > 0) return value;
  }
  return 0;
}

function direction(text: string, csvSign?: number): Direction {
  if (csvSign !== undefined && csvSign !== 0) return csvSign > 0 ? 'IN' : 'OUT';
  const isIn = IN_WORDS.test(text);
  const isOut = OUT_WORDS.test(text);
  if (isIn && !isOut) return 'IN';
  if (isOut && !isIn) return 'OUT';
  if (isIn && isOut) return IN_WORDS.exec(text)!.index < OUT_WORDS.exec(text)!.index ? 'IN' : 'OUT';
  return 'UNKNOWN';
}

/** Libellé lisible : on retire dates, montants, codes de transaction et devise. */
function cleanLabel(text: string, currency: string): string {
  return text
    .replace(BALANCE_WORDS, ' ')
    .replace(/\b(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/g, ' ')
    .replace(/\b\d{1,2}[:h]\d{2}(:\d{2})?\b/g, ' ')
    .replace(new RegExp(`\\b${currency}\\b|\\bFCFA\\b|\\bCFA\\b`, 'gi'), ' ')
    .replace(/\b(id|ref|txn|transaction)\s*[:.#]?\s*[A-Z0-9]{4,}\b/gi, ' ')
    .replace(/\d[\d\s.,]{2,}\d/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:;,.]+|[\s\-–—:;,.]+$/g, '')
    // Mots de liaison restés en fin de phrase une fois la date retirée.
    .replace(/\s+(le|la|du|de|a|à|on|the|at|from|pour|par)$/i, '')
    .slice(0, 80);
}

/** Découpe une ligne de CSV (`;`, tabulation ou `,` si la ligne n'a pas de point-virgule). */
function splitCsv(line: string): string[] | null {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  const commas = (line.match(/,/g) ?? []).length;
  if (commas >= 2 && !/\d,\d{3}\b/.test(line)) return line.split(',');
  return null;
}

/** Poste de dépense probable d'après le libellé — proposé, jamais imposé. */
export function guessCategory(label: string): string {
  const l = label.toLowerCase();
  if (/(eneo|electric|électric|eau|camwater|energie|énergie|gaz|edf|water|power)/.test(l)) return 'UTILITIES';
  if (/(loyer|bail|rent|location)/.test(l)) return 'RENT';
  if (/(carburant|essence|gasoil|taxi|moto|transport|livraison|fuel|petrol)/.test(l)) return 'TRANSPORT';
  if (/(salaire|paie|payroll|wage|employ)/.test(l)) return 'PAYROLL';
  if (/(frais|commission|bank|banque|agios|fee)/.test(l)) return 'FINANCIAL';
  if (/(imp[oô]t|taxe|tax|douane|patente)/.test(l)) return 'TAXES';
  if (/(internet|t[ée]l[ée]phone|forfait|abonnement|orange|mtn|camtel|airtime|cr[ée]dit t[ée]l)/.test(l)) return 'SERVICES';
  if (/(fournisseur|grossiste|achat|stock|marchandise|supplier|wholesale)/.test(l)) return 'PURCHASES';
  return 'MISC_EXPENSE';
}

export function parseStatement(text: string, currency: string, todayISO: string): StatementRow[] {
  const rows: StatementRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length < 4) continue;
    if (/^(date|libell|label|description|montant|amount)\b/i.test(line) && !/\d/.test(line.replace(/\d{4}/g, ''))) continue;

    const cells = splitCsv(line);
    let date = '';
    let label = '';
    let amount = 0;
    let sign: number | undefined;

    if (cells && cells.length >= 2) {
      const joined = cells.join(' ');
      date = findDate(joined, todayISO);
      // Colonne montant : la dernière cellule qui contient un nombre.
      for (let i = cells.length - 1; i >= 0; i -= 1) {
        const value = findAmount(cells[i], currency);
        if (value > 0) {
          amount = value;
          if (/^\s*-/.test(cells[i])) sign = -1;
          if (/^\s*\+/.test(cells[i])) sign = 1;
          break;
        }
      }
      label = cleanLabel(cells.filter((c) => !/^\s*[-+]?[\d\s.,]+$/.test(c)).join(' '), currency);
      if (!label) label = cleanLabel(joined, currency);
    } else {
      date = findDate(line, todayISO);
      amount = findAmount(line, currency);
      label = cleanLabel(line, currency);
    }

    if (amount <= 0) continue;
    const text = label || raw.trim().slice(0, 60);
    let sense = direction(line, sign);
    // Un libellé qui désigne clairement un poste de charge (loyer, électricité,
    // carburant…) est une sortie, même sans mot-clé de sens.
    if (sense === 'UNKNOWN' && guessCategory(text) !== 'MISC_EXPENSE') sense = 'OUT';
    rows.push({ date: date || todayISO, label: text, amount, direction: sense, raw: line });
  }
  return rows;
}
