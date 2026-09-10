// Tous les montants sont stockés en unités mineures entières (centimes, francs, ...)
// pour éviter les erreurs d'arrondi flottantes interdites en comptabilité.
export type Minor = number;

export type ISODate = string;

export interface Currency {
  code: string;
  symbol: string;
  /** Nombre de décimales de l'unité mineure. XAF/XOF = 0, EUR/USD = 2. */
  decimals: number;
}

/** SIMPLE : vocabulaire courant, comptabilité masquée. EXPERT : tout est visible. */
export type AppMode = 'SIMPLE' | 'EXPERT';

export interface Company {
  name: string;
  currency: string;
  country: string;
  city: string;
  sector: string;
  phone: string;
  /** Référentiel du plan comptable utilisé. */
  chart: 'SYSCOHADA' | 'PCG' | 'GENERIC';
  vatEnabled: boolean;
  /** Taux de TVA en points de base (1950 = 19,5 %). */
  vatRateBp: number;
  fiscalYearStart: string; // MM-DD
  mode: AppMode;
  onboarded: boolean;
  goals: string[];
}

export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type AccountKind = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  code: string;
  label: string;
  class: AccountClass;
  kind: AccountKind;
  /** Sens naturel du solde : DEBIT pour actif/charge, CREDIT pour passif/produit. */
  normal: 'DEBIT' | 'CREDIT';
  system?: boolean;
}

export interface JournalLine {
  account: string;
  label?: string;
  debit: Minor;
  credit: Minor;
}

export type JournalCode = 'VT' | 'AC' | 'CA' | 'BQ' | 'OD';

export interface JournalEntry {
  id: string;
  date: ISODate;
  journal: JournalCode;
  ref: string;
  label: string;
  lines: JournalLine[];
  /** Origine métier de l'écriture, pour la traçabilité. */
  sourceType?: string;
  sourceId?: string;
  createdAt: ISODate;
  createdBy: string;
  /** Une écriture validée ne peut plus être modifiée, seulement extournée. */
  posted: boolean;
  reversedBy?: string;
  reverses?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  /** Prix de vente unitaire HT. */
  price: Minor;
  /** Coût d'achat unitaire (PMP). */
  cost: Minor;
  stock: number;
  reorderPoint: number;
  unit: string;
  archived?: boolean;
  createdAt: ISODate;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: ISODate;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: ISODate;
}

export type PaymentMethod = 'CASH' | 'MOBILE' | 'CARD' | 'BANK' | 'CREDIT';

export interface SaleLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: Minor;
  unitCost: Minor;
}

export type SaleStatus = 'QUOTE' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface Sale {
  id: string;
  number: string;
  date: ISODate;
  customerId: string | null;
  customerName: string;
  lines: SaleLine[];
  discount: Minor;
  vat: Minor;
  total: Minor;
  paid: Minor;
  method: PaymentMethod;
  status: SaleStatus;
  cashier: string;
  createdAt: ISODate;
}

export interface PurchaseLine {
  productId: string;
  name: string;
  qty: number;
  unitCost: Minor;
}

export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface Purchase {
  id: string;
  number: string;
  date: ISODate;
  supplierId: string | null;
  supplierName: string;
  lines: PurchaseLine[];
  total: Minor;
  paid: Minor;
  status: PurchaseStatus;
  createdAt: ISODate;
}

export interface Expense {
  id: string;
  date: ISODate;
  category: string;
  account: string;
  description: string;
  amount: Minor;
  method: PaymentMethod;
  createdAt: ISODate;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  id: string;
  date: ISODate;
  productId: string;
  productName: string;
  type: MovementType;
  qty: number;
  resulting: number;
  reason: string;
  ref: string;
  by: string;
}

export interface DebtPayment {
  id: string;
  date: ISODate;
  amount: Minor;
  method: PaymentMethod;
}

export type DebtParty = 'CUSTOMER' | 'SUPPLIER';

export interface Debt {
  id: string;
  party: DebtParty;
  partyId: string | null;
  partyName: string;
  origin: string;
  sourceId?: string;
  date: ISODate;
  amount: Minor;
  payments: DebtPayment[];
  createdAt: ISODate;
}

export interface CashSession {
  id: string;
  openedAt: ISODate;
  closedAt: ISODate | null;
  cashier: string;
  opening: Minor;
  expected: Minor | null;
  counted: Minor | null;
  variance: Minor | null;
}

export interface AuditLog {
  id: string;
  at: ISODate;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
}

export interface DB {
  company: Company;
  accounts: Account[];
  entries: JournalEntry[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  movements: StockMovement[];
  debts: Debt[];
  sessions: CashSession[];
  audit: AuditLog[];
}

/**
 * Un événement = une action métier, immuable, rejouable dans l'ordre.
 * L'état complet se reconstruit depuis un instantané + les événements suivants.
 */
export interface WorkspaceEvent {
  id: string;
  seq?: number;
  at: ISODate;
  actorId: string | null;
  actorName: string;
  type: string;
  payload: Record<string, unknown>;
}

export type MemberRole = 'owner' | 'manager' | 'cashier' | 'accountant';

export interface Member {
  workspaceId: string;
  email: string;
  userId: string | null;
  role: MemberRole;
  displayName: string | null;
  status: 'invited' | 'active' | 'removed';
}

export interface Presence {
  key: string;
  name: string;
  avatar: string | null;
  page: string;
}
