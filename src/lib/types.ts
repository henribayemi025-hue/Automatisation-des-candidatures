// Tous les montants sont stockés en unités mineures entières (centimes, francs, ...)
// pour éviter les erreurs d'arrondi flottantes interdites en comptabilité.
export type Minor = number;

export type ISODate = string;

export interface Currency {
  code: string;
  symbol: string;
  /** Nom courant de la devise, affiché dans les listes de choix. */
  name?: string;
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
  /**
   * Vrai si les prix saisis incluent déjà la taxe — le cas courant d'une
   * boutique : l'étiquette est ce que le client paie. Faux pour une entreprise
   * qui facture hors taxe et ajoute la TVA sur la facture.
   */
  pricesIncludeTax: boolean;
  /** Nom local de la taxe sur la consommation : TVA, VAT, GST, IVA… */
  taxLabel: string;
  /**
   * Suit-on des quantités en stock ? Non renseigné, le métier décide : une
   * boutique oui, un salon de coiffure non. Le réglage explicite gagne.
   */
  tracksStock?: boolean;
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

/** 'CL' = journal de clôture : ces écritures soldent les comptes de gestion. */
export type JournalCode = 'VT' | 'AC' | 'CA' | 'BQ' | 'OD' | 'CL';

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
  /** Fiche retirée des listes. On archive au lieu d'effacer dès qu'il y a eu une opération. */
  archived?: boolean;
  createdAt: ISODate;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  archived?: boolean;
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
  /** Projet auquel l'opération est rattachée (suivi analytique), facultatif. */
  projectId?: string | null;
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

/**
 * Frais d'approche d'une importation : ce qu'on paie en plus de la facture du
 * fournisseur pour que la marchandise arrive au magasin. En comptabilité ils
 * ne sont pas des charges du mois : ils entrent dans le coût du stock, sinon
 * la marge affichée sur un conteneur serait fausse.
 */
export type LandedCostKind = 'CUSTOMS' | 'FREIGHT' | 'FORWARDING' | 'INSURANCE' | 'HANDLING' | 'OTHER';

export interface LandedCost {
  kind: LandedCostKind;
  label: string;
  /** Hors taxe, dans la devise de l'entreprise. */
  amount: Minor;
}

/** Facture reçue dans une autre devise, convertie au taux du jour de la commande. */
export interface ForeignAmount {
  currency: string;
  /** Total de la facture dans sa devise, en unités mineures de cette devise. */
  total: Minor;
  /** Combien vaut 1 unité de la devise étrangère dans la devise de l'entreprise. */
  rate: number;
}

export interface Purchase {
  id: string;
  number: string;
  date: ISODate;
  projectId?: string | null;
  supplierId: string | null;
  supplierName: string;
  /** Lignes toujours dans la devise de l'entreprise, déjà converties. */
  lines: PurchaseLine[];
  /** Montant de la facture fournisseur, devise de l'entreprise. */
  total: Minor;
  paid: Minor;
  status: PurchaseStatus;
  /** Renseigné quand la facture était dans une autre devise. */
  foreign?: ForeignAmount | null;
  /** Douane, fret, transit… payés à la réception, ajoutés au coût du stock. */
  landed?: LandedCost[];
  /** TVA payée en douane à l'importation : déductible, comme celle d'un achat local. */
  importVat?: Minor;
  /** Avec quoi les frais d'approche et la TVA de douane ont été payés. */
  landedPaidWith?: PaymentMethod;
  createdAt: ISODate;
}

export interface Expense {
  id: string;
  date: ISODate;
  projectId?: string | null;
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

export type ProjectStatus = 'ACTIVE' | 'DONE' | 'CANCELLED';

/**
 * Un projet regroupe des opérations qui sortent du quotidien — ouverture d'un
 * point de vente, chantier, événement, achat de matériel — pour répondre à
 * « ça m'a coûté combien, ça m'a rapporté combien ».
 */
export interface Project {
  id: string;
  name: string;
  kind: string;
  budget: Minor;
  startDate: ISODate;
  endDate: ISODate | '';
  status: ProjectStatus;
  notes: string;
  createdAt: ISODate;
}

/** Message du fil de discussion : général (projectId vide) ou rattaché à un projet. */
export interface Message {
  id: string;
  projectId: string | null;
  authorId: string | null;
  authorName: string;
  /** 'assistant' pour une réponse de l'IA, 'system' pour une note automatique. */
  kind: 'user' | 'assistant' | 'system';
  text: string;
  /** Photo jointe, hébergée en ligne (jamais dans l'état lui-même). */
  imageUrl?: string;
  /** Dépense lue par l'assistant sur une photo, proposée à l'enregistrement. */
  expense?: { date: string; supplier: string; category: string; description: string; amount: number; method: string } | null;
  createdAt: ISODate;
}

/**
 * Comment la personne est payée. Le salaire mensuel est le cas des contrats
 * fixes ; le journalier et l'horaire sont la réalité de beaucoup de petites
 * structures, où l'on paie ce qui a été travaillé.
 */
export type PayKind = 'MONTHLY' | 'DAILY' | 'HOURLY';

export interface Employee {
  id: string;
  name: string;
  /** Poste occupé, en mots courants : vendeuse, cuisinier, apprenti… */
  role: string;
  phone: string;
  payKind: PayKind;
  /** Montant du salaire mensuel, ou du taux journalier / horaire. */
  rate: Minor;
  startedOn: ISODate;
  archived?: boolean;
  notes: string;
  createdAt: ISODate;
}

export type AttendanceStatus = 'PRESENT' | 'HALF' | 'ABSENT' | 'LEAVE';

/** Une journée pointée pour une personne. Une seule par personne et par jour. */
export interface Attendance {
  id: string;
  employeeId: string;
  date: ISODate;
  status: AttendanceStatus;
  /** Heures travaillées, pour les payes à l'heure. */
  hours: number;
  note: string;
  createdAt: ISODate;
}

/** Argent avancé à quelqu'un avant la paie : une créance, pas une charge. */
export interface StaffAdvance {
  id: string;
  employeeId: string;
  date: ISODate;
  amount: Minor;
  method: PaymentMethod;
  note: string;
  entryId: string;
  createdAt: ISODate;
}

/** Ligne de paie d'une personne pour une période. */
export interface Payslip {
  employeeId: string;
  employeeName: string;
  /** Ce qui est dû pour la période, avant déduction des avances. */
  gross: Minor;
  /** Avances déjà versées, retenues sur cette paie. */
  advances: Minor;
  /** Ce qui reste à verser. */
  net: Minor;
  /** Base du calcul, affichée sur le bulletin : « 22 jours », « salaire du mois ». */
  basis: string;
}

/** Une paie passée : la charge est enregistrée, les avances sont soldées. */
export interface PayrollRun {
  id: string;
  /** Période payée, au format AAAA-MM. */
  period: string;
  date: ISODate;
  slips: Payslip[];
  gross: Minor;
  advances: Minor;
  net: Minor;
  /** Vrai si le net a été versé tout de suite ; sinon il reste dû. */
  paid: boolean;
  method: PaymentMethod;
  entryId: string;
  createdAt: ISODate;
}

/**
 * Une immobilisation : un bien qui sert plusieurs années (véhicule, four,
 * ordinateur). On ne le passe pas en charge d'un coup, on étale son coût sur sa
 * durée d'utilisation — c'est l'amortissement.
 */
export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquiredOn: ISODate;
  /** Valeur d'acquisition hors taxe. */
  cost: Minor;
  /** Ce qu'il vaudra encore au bout du plan, souvent zéro. */
  salvage: Minor;
  /** Durée d'utilisation, en mois. */
  months: number;
  /** Linéaire seulement : le dégressif dépend de règles fiscales par pays. */
  method: 'LINEAR';
  status: 'ACTIVE' | 'DISPOSED';
  disposedOn?: ISODate;
  notes: string;
  createdAt: ISODate;
}

/** Dotation déjà comptabilisée, pour ne jamais amortir deux fois la même période. */
export interface Depreciation {
  id: string;
  assetId: string;
  /** Période comptabilisée, au format AAAA-MM. */
  period: string;
  amount: Minor;
  entryId: string;
  createdAt: ISODate;
}

/** Ligne de trésorerie pointée contre le relevé de la banque. */
export interface Reconciliation {
  id: string;
  account: string;
  entryId: string;
  /** Date du relevé sur lequel la ligne apparaît. */
  statementDate: ISODate;
  createdAt: ISODate;
}

/**
 * Exercice clos : les comptes de charges et de produits sont ramenés à zéro,
 * le résultat part au compte « Résultat », puis en « Report à nouveau ».
 */
export interface FiscalClosing {
  id: string;
  from: ISODate;
  to: ISODate;
  revenue: Minor;
  expenses: Minor;
  result: Minor;
  closingEntryId: string;
  carryEntryId: string;
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
  projects: Project[];
  messages: Message[];
  employees: Employee[];
  attendance: Attendance[];
  advances: StaffAdvance[];
  payrolls: PayrollRun[];
  assets: FixedAsset[];
  depreciations: Depreciation[];
  reconciliations: Reconciliation[];
  closings: FiscalClosing[];
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
