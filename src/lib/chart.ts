import type { Account, AccountClass, AccountKind, Company } from './types';

/**
 * Clés fonctionnelles utilisées par le moteur d'écritures. Chaque référentiel
 * (SYSCOHADA, PCG, générique) donne son propre numéro de compte à la même clé,
 * ce qui permet de changer de plan comptable sans toucher aux règles de passage.
 */
export type AccountKey =
  | 'CAPITAL'
  | 'RESULT'
  | 'RETAINED'
  | 'EQUIPMENT'
  | 'DEPRECIATION'
  | 'INVENTORY'
  | 'SUPPLIERS'
  | 'CUSTOMERS'
  | 'STAFF_ADVANCE'
  | 'STAFF_PAYABLE'
  | 'VAT_COLLECTED'
  | 'VAT_DEDUCTIBLE'
  | 'BANK'
  | 'CASH'
  | 'MOBILE_MONEY'
  | 'PURCHASES'
  | 'INVENTORY_CHANGE'
  | 'UTILITIES'
  | 'TRANSPORT'
  | 'RENT'
  | 'SERVICES'
  | 'TAXES'
  | 'PAYROLL'
  | 'FINANCIAL'
  | 'DEPRECIATION_EXPENSE'
  | 'MISC_EXPENSE'
  | 'SALES'
  | 'SERVICE_REVENUE'
  | 'MISC_REVENUE';

interface ChartRow {
  key: AccountKey;
  label: string;
  class: AccountClass;
  kind: AccountKind;
  normal: 'DEBIT' | 'CREDIT';
  SYSCOHADA: string;
  PCG: string;
  GENERIC: string;
}

const ROWS: ChartRow[] = [
  { key: 'CAPITAL', label: 'Capital social', class: 1, kind: 'EQUITY', normal: 'CREDIT', SYSCOHADA: '101', PCG: '101', GENERIC: '3000' },
  { key: 'RESULT', label: "Résultat de l'exercice", class: 1, kind: 'EQUITY', normal: 'CREDIT', SYSCOHADA: '120', PCG: '120', GENERIC: '3900' },
  { key: 'RETAINED', label: 'Report à nouveau', class: 1, kind: 'EQUITY', normal: 'CREDIT', SYSCOHADA: '121', PCG: '110', GENERIC: '3800' },
  { key: 'EQUIPMENT', label: 'Matériel et mobilier', class: 2, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '244', PCG: '218', GENERIC: '1500' },
  // Amortissements cumulés : compte d'actif soustractif. Il vient en moins du
  // matériel au bilan, donc son solde est créditeur.
  { key: 'DEPRECIATION', label: 'Amortissements du matériel', class: 2, kind: 'ASSET', normal: 'CREDIT', SYSCOHADA: '2844', PCG: '2818', GENERIC: '1590' },
  { key: 'INVENTORY', label: 'Stock de marchandises', class: 3, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '311', PCG: '370', GENERIC: '1300' },
  { key: 'SUPPLIERS', label: 'Fournisseurs', class: 4, kind: 'LIABILITY', normal: 'CREDIT', SYSCOHADA: '401', PCG: '401', GENERIC: '2000' },
  { key: 'CUSTOMERS', label: 'Clients', class: 4, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '411', PCG: '411', GENERIC: '1200' },
  // Une avance sur salaire est de l'argent que le salarié doit encore à
  // l'entreprise : c'est une créance, pas une charge.
  { key: 'STAFF_ADVANCE', label: 'Personnel — avances et acomptes', class: 4, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '421', PCG: '425', GENERIC: '1260' },
  { key: 'STAFF_PAYABLE', label: 'Personnel — rémunérations dues', class: 4, kind: 'LIABILITY', normal: 'CREDIT', SYSCOHADA: '422', PCG: '421', GENERIC: '2100' },
  { key: 'VAT_COLLECTED', label: 'TVA collectée', class: 4, kind: 'LIABILITY', normal: 'CREDIT', SYSCOHADA: '4431', PCG: '44571', GENERIC: '2200' },
  { key: 'VAT_DEDUCTIBLE', label: 'TVA déductible', class: 4, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '4451', PCG: '44566', GENERIC: '1250' },
  { key: 'BANK', label: 'Banque', class: 5, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '521', PCG: '512', GENERIC: '1010' },
  { key: 'MOBILE_MONEY', label: 'Compte mobile / e-wallet', class: 5, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '523', PCG: '5115', GENERIC: '1015' },
  { key: 'CASH', label: 'Caisse', class: 5, kind: 'ASSET', normal: 'DEBIT', SYSCOHADA: '571', PCG: '530', GENERIC: '1000' },
  { key: 'PURCHASES', label: 'Achats de marchandises', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '601', PCG: '607', GENERIC: '5000' },
  { key: 'INVENTORY_CHANGE', label: 'Variation des stocks', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '6031', PCG: '6037', GENERIC: '5010' },
  { key: 'UTILITIES', label: 'Eau, électricité, énergie', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '605', PCG: '606', GENERIC: '6100' },
  { key: 'TRANSPORT', label: 'Transports', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '611', PCG: '624', GENERIC: '6200' },
  { key: 'RENT', label: 'Loyers et charges locatives', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '622', PCG: '613', GENERIC: '6300' },
  { key: 'SERVICES', label: 'Services extérieurs', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '628', PCG: '628', GENERIC: '6400' },
  { key: 'TAXES', label: 'Impôts et taxes', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '641', PCG: '635', GENERIC: '6500' },
  { key: 'PAYROLL', label: 'Charges de personnel', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '661', PCG: '641', GENERIC: '6600' },
  { key: 'FINANCIAL', label: 'Frais financiers', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '671', PCG: '661', GENERIC: '6700' },
  { key: 'DEPRECIATION_EXPENSE', label: 'Dotations aux amortissements', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '681', PCG: '6811', GENERIC: '6800' },
  { key: 'MISC_EXPENSE', label: 'Charges diverses', class: 6, kind: 'EXPENSE', normal: 'DEBIT', SYSCOHADA: '658', PCG: '658', GENERIC: '6900' },
  { key: 'SALES', label: 'Ventes de marchandises', class: 7, kind: 'REVENUE', normal: 'CREDIT', SYSCOHADA: '701', PCG: '707', GENERIC: '4000' },
  { key: 'SERVICE_REVENUE', label: 'Prestations de services', class: 7, kind: 'REVENUE', normal: 'CREDIT', SYSCOHADA: '706', PCG: '706', GENERIC: '4100' },
  { key: 'MISC_REVENUE', label: 'Produits divers', class: 7, kind: 'REVENUE', normal: 'CREDIT', SYSCOHADA: '758', PCG: '758', GENERIC: '4900' },
];

export function buildChart(chart: Company['chart']): Account[] {
  return ROWS.map((row) => ({
    code: row[chart],
    label: row.label,
    class: row.class,
    kind: row.kind,
    normal: row.normal,
    system: true,
  }));
}

export function accountCode(chart: Company['chart'], key: AccountKey): string {
  const row = ROWS.find((r) => r.key === key);
  if (!row) throw new Error(`Compte inconnu: ${key}`);
  return row[chart];
}

/** Comptes proposés dans le formulaire de dépense, par ordre d'usage courant. */
export const EXPENSE_KEYS: AccountKey[] = [
  'PURCHASES',
  'UTILITIES',
  'TRANSPORT',
  'RENT',
  'SERVICES',
  'PAYROLL',
  'TAXES',
  'FINANCIAL',
  'MISC_EXPENSE',
];

export const CLASS_LABELS: Record<AccountClass, string> = {
  1: 'Capitaux',
  2: 'Immobilisations',
  3: 'Stocks',
  4: 'Tiers',
  5: 'Trésorerie',
  6: 'Charges',
  7: 'Produits',
};
