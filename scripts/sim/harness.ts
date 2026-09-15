/**
 * Simulateur d'entreprise — passe 1 du prompt docs/PROMPT-SIMULATION-METIERS.md.
 *
 * Une entreprise vit jour après jour, sur dix ans, à travers le VRAI moteur
 * (`applyEvent`). À chaque horizon (jour, semaine, mois, trimestre, année, puis
 * chaque année suivante) on vérifie des vérités comptables : balance, bilan,
 * stock, trésorerie, clôture et report à nouveau, taxe, FEC. Ce qui passe passe,
 * ce qui casse est consigné avec de quoi le reproduire.
 *
 * Aucune base de données n'est touchée : tout se joue en mémoire, comme les
 * scripts *-check.ts. Si un jour une écriture en base devient nécessaire, elle
 * ira sur le projet de test qiyvoaljqmbfldephobp, jamais en production.
 *
 * Accélération du banc d'essai : `applyEvent` copie l'état entier à chaque
 * événement (structuredClone). Mesuré séparément (scripts/sim/_bench.ts) et
 * consigné comme fait. Ici, SIM_FAST=1 (défaut) remplace la copie par une
 * mutation en place — même code du moteur, même résultat, cent fois plus vite.
 * SIM_FAST=0 rejoue avec la vraie copie, pour mesurer.
 */
import { applyEvent, emptyDB, saleTotals, normalizeDB } from '../../src/lib/reducer';
import { accountCode } from '../../src/lib/chart';
import type { AccountKey } from '../../src/lib/chart';
import { carryForwardLines, closingPlan, dayAfter, nextToClose } from '../../src/lib/closing';
import { balanceOf, balanceSheet, entriesInRange, incomeStatement, runAuditChecks, trialBalance } from '../../src/lib/ledger';
import { buildFec } from '../../src/lib/fec';
import { currency as currencyOf } from '../../src/lib/money';
import { payrollPreview } from '../../src/lib/payroll';
import type {
  Company, Customer, DB, Employee, Expense, PaymentMethod, Product, Purchase, Sale, SaleLine, Supplier, WorkspaceEvent,
} from '../../src/lib/types';

if (process.env.SIM_FAST !== '0') {
  // Voir l'en-tête : mutation en place, résultats identiques, temps divisé par cent.
  (globalThis as unknown as { structuredClone: <T>(x: T) => T }).structuredClone = <T,>(x: T) => x;
}

// ---------------------------------------------------------------------------
// Profil d'une entreprise
// ---------------------------------------------------------------------------

export interface ProductSpec {
  name: string;
  price: number;
  cost: number;
  stock: number;
  unit?: string;
  category?: string;
}

export interface Profile {
  key: string;
  name: string;
  /** Numéro et forme du prompt, pour le rapport. */
  forme: string;
  company: Partial<Company>;
  products: ProductSpec[];
  customers?: string[];
  suppliers?: string[];
  sales: {
    perDay: [number, number];
    linesPerSale: [number, number];
    qtyPerLine: [number, number];
    /** Poids des moyens de paiement. */
    methods: Partial<Record<PaymentMethod, number>>;
    /** Jour de la semaine fermé (0 = dimanche), facultatif. */
    closedWeekday?: number;
    /** Part des ventes à crédit réglée dans les 30 jours. */
    creditSettleDays?: number;
  };
  purchases?: {
    everyDays: number;
    /** Quantité commandée par article, en jours de vente approximatifs. */
    coverDays: number;
    /** Part payée à la commande ; le reste en deux règlements. */
    paidNow: number;
  };
  expenses?: { key: AccountKey; amount: number; day: number; method?: PaymentMethod }[];
  staff?: { name: string; payKind: 'MONTHLY' | 'DAILY' | 'HOURLY'; rate: number }[];
  /** Ouvre et clôture une session de caisse chaque jour, avec un léger écart certains soirs. */
  sessions?: boolean;
  /** Capital de départ, réparti caisse / mobile / banque. */
  opening: { cash: number; mobile: number; bank: number };
  /** Scénario propre à l'entreprise (piège comptable, retours, lots…). Appelé une fois par an. */
  yearly?: (ctx: Ctx, year: number) => void;
  /** Scénario quotidien (cycles d'élevage, etc.). Appelé chaque jour avant les ventes. */
  daily?: (ctx: Ctx, date: string, day: number) => void;
  /** Mesure du piège : montant que l'application compte en produit et qui n'en est pas. */
  trap?: (ctx: Ctx, range: { from: string; to: string }) => TrapReport | null;
  seed: number;
}

export interface TrapReport {
  label: string;
  /** Montant compté en produit par l'application dans l'exercice, à tort. */
  falseRevenue: number;
  /** Ce que l'application a fait de l'opération. */
  howRecorded: string;
}

// ---------------------------------------------------------------------------
// Contexte de simulation
// ---------------------------------------------------------------------------

export interface Finding {
  entreprise: string;
  horizon: string;
  gravite: 'BLOQUANT' | 'MAJEUR' | 'MINEUR' | 'INFO';
  quoi: string;
  reproduire: string;
}

export class Ctx {
  db: DB;
  private seq = 0;
  private counter = 0;
  readonly rnd: () => number;
  readonly findings: Finding[] = [];
  readonly products: Product[] = [];
  readonly customers: Customer[] = [];
  readonly suppliers: Supplier[] = [];
  readonly employees: Employee[] = [];
  /** Miroir du stock et du coût moyen, comme la démo, pour ne pas vendre ce qu'on n'a pas. */
  readonly stock = new Map<string, number>();
  readonly cost = new Map<string, number>();
  saleNo = 0;
  purchaseNo = 0;
  eventCount = 0;
  refused: { type: string; message: string; date: string }[] = [];
  /** Dettes clients ouvertes, à régler plus tard. */
  openDebts: { id: string; date: string; amount: number }[] = [];
  /** Dettes fournisseurs ouvertes. */
  openSupplierDebts: { id: string; date: string; amount: number; installments: number }[] = [];
  readonly profile: Profile;

  constructor(profile: Profile) {
    this.profile = profile;
    this.db = emptyDB();
    this.rnd = seeded(profile.seed);
  }

  get chart(): Company['chart'] {
    return this.db.company.chart;
  }
  code(key: AccountKey): string {
    return accountCode(this.chart, key);
  }
  /** Identifiants de la forme UUID, comme newId() dans l'application, mais reproductibles. */
  id(): string {
    this.counter += 1;
    const hex = () => Math.floor(this.rnd() * 0xffffffff).toString(16).padStart(8, '0');
    const h = hex() + hex() + hex() + hex();
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  }
  pick<T>(list: T[]): T {
    return list[Math.floor(this.rnd() * list.length)];
  }
  between(a: number, b: number): number {
    return a + Math.floor(this.rnd() * (b - a + 1));
  }
  weighted(weights: Partial<Record<PaymentMethod, number>>): PaymentMethod {
    const entries = Object.entries(weights) as [PaymentMethod, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.rnd() * total;
    for (const [m, w] of entries) {
      r -= w;
      if (r <= 0) return m;
    }
    return entries[0][0];
  }

  emit(type: string, payload: Record<string, unknown>, date: string, hour = 10, minute = 0): boolean {
    this.seq += 1;
    const ev: WorkspaceEvent = {
      id: `${this.profile.key}-e${this.seq}`,
      at: `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
      actorId: 'sim',
      actorName: 'Simulation',
      type,
      payload,
    };
    try {
      this.db = applyEvent(this.db, ev);
      this.eventCount += 1;
      return true;
    } catch (e) {
      this.refused.push({ type, message: (e as Error).message, date });
      return false;
    }
  }

  // --- opérations métier -----------------------------------------------------

  private scanned = 0;
  private readonly bal: Record<'CASH' | 'MOBILE_MONEY' | 'BANK', number> = { CASH: 0, MOBILE_MONEY: 0, BANK: 0 };
  /** Solde de trésorerie, tenu au fil de l'eau (les écritures ne font que s'ajouter). */
  treasury(key: 'CASH' | 'MOBILE_MONEY' | 'BANK', _upTo?: string): number {
    const entries = this.db.entries;
    if (this.scanned > entries.length) this.scanned = 0;
    if (this.scanned === 0) this.bal.CASH = this.bal.MOBILE_MONEY = this.bal.BANK = 0;
    const codes = { CASH: this.code('CASH'), MOBILE_MONEY: this.code('MOBILE_MONEY'), BANK: this.code('BANK') };
    for (; this.scanned < entries.length; this.scanned += 1) {
      const e = entries[this.scanned];
      if (!e.posted) continue;
      for (const l of e.lines) {
        for (const k of ['CASH', 'MOBILE_MONEY', 'BANK'] as const) if (l.account === codes[k]) this.bal[k] += l.debit - l.credit;
      }
    }
    return this.bal[key];
  }

  manual(date: string, ref: string, label: string, lines: { key: AccountKey; debit?: number; credit?: number; label?: string }[], journal = 'OD', hour = 7, minute = 0): boolean {
    return this.emit(
      'entry.manual',
      {
        entryId: this.id(),
        date,
        journal,
        ref,
        label,
        lines: lines.map((l) => ({ account: this.code(l.key), label: l.label ?? label, debit: l.debit ?? 0, credit: l.credit ?? 0 })),
      },
      date,
      hour,
      minute,
    );
  }

  addProduct(spec: ProductSpec, date: string): Product {
    const product: Product = {
      id: this.id(),
      name: spec.name,
      sku: spec.name.slice(0, 4).toUpperCase() + this.products.length,
      barcode: '',
      category: spec.category ?? 'Général',
      brand: '',
      price: spec.price,
      cost: spec.cost,
      stock: spec.stock,
      reorderPoint: 0,
      unit: spec.unit ?? 'pièce',
      createdAt: `${date}T08:00:00.000Z`,
    };
    this.emit('product.save', { product, movementId: this.id(), entryId: this.id() }, date, 8);
    this.products.push(product);
    const engine = this.db.products.find((x) => x.id === product.id);
    this.stock.set(product.id, engine?.stock ?? spec.stock);
    this.cost.set(product.id, engine?.cost ?? spec.cost);
    return product;
  }

  sale(date: string, picks: { product: Product; qty: number }[], method: PaymentMethod, customer: Customer | null, paidFraction = 1, hour = 10): Sale | null {
    const stocked = this.db.company.tracksStock !== false;
    const lines: SaleLine[] = [];
    // Deux lignes du même article dans un panier se cumulent avant de regarder le stock.
    const merged = new Map<string, { product: Product; qty: number }>();
    for (const p of picks) {
      const m = merged.get(p.product.id);
      if (m) m.qty += p.qty;
      else merged.set(p.product.id, { ...p });
    }
    for (const p of merged.values()) {
      // Une prestation n'a pas de stock : on la vend comme le fait la caisse, sans regarder la quantité.
      const prestation = p.product.category === 'Prestations';
      const available = stocked && !prestation ? (this.stock.get(p.product.id) ?? 0) : p.qty;
      const qty = Math.min(p.qty, available);
      if (qty <= 0) continue;
      lines.push({ productId: p.product.id, name: p.product.name, qty, unitPrice: p.product.price, unitCost: this.cost.get(p.product.id) ?? p.product.cost });
    }
    if (!lines.length) return null;
    const t = saleTotals(this.db.company, lines, 0);
    this.saleNo += 1;
    const paid = method === 'CREDIT' ? Math.round(t.total * paidFraction) : t.total;
    const sale: Sale = {
      id: this.id(),
      number: `FA-${String(this.saleNo).padStart(6, '0')}`,
      date,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Client passager',
      lines,
      discount: 0,
      vat: t.vat,
      total: t.total,
      paid,
      method,
      status: 'CONFIRMED',
      cashier: 'Simulation',
      createdAt: `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`,
    };
    const debtId = this.id();
    const ok = this.emit('sale.record', { sale, ids: { movements: lines.map(() => this.id()), saleEntry: this.id(), cogsEntry: this.id(), debt: debtId } }, date, hour);
    if (!ok) return null;
    if (stocked) for (const l of lines) this.stock.set(l.productId, (this.stock.get(l.productId) ?? 0) - l.qty);
    if (paid < t.total && customer) this.openDebts.push({ id: debtId, date, amount: t.total - paid });
    return sale;
  }

  purchase(date: string, lines: { product: Product; qty: number; unitCost: number }[], supplier: Supplier | null, paidNow: number, installments = 2): Purchase | null {
    if (!lines.length) return null;
    this.purchaseNo += 1;
    const purchaseLines = lines.map((l) => ({ productId: l.product.id, name: l.product.name, qty: l.qty, unitCost: l.unitCost }));
    const total = purchaseLines.reduce((s, l) => s + l.unitCost * l.qty, 0);
    const order: Purchase = {
      id: this.id(),
      number: `BC-${String(this.purchaseNo).padStart(5, '0')}`,
      date,
      supplierId: supplier?.id ?? null,
      supplierName: supplier?.name ?? 'Fournisseur',
      lines: purchaseLines,
      total,
      paid: Math.round(total * paidNow),
      status: 'PENDING',
      createdAt: `${date}T08:00:00.000Z`,
    };
    this.emit('purchase.record', { purchase: order }, date, 8);
    const debtId = this.id();
    const ok = this.emit('purchase.receive', { purchaseId: order.id, date, ids: { movements: purchaseLines.map(() => this.id()), entry: this.id(), payment: this.id(), debt: debtId } }, date, 9);
    if (!ok) return null;
    // Le moteur recalcule le coût moyen (hors taxe, frais d'approche compris) : on le relit.
    for (const l of purchaseLines) {
      const engine = this.db.products.find((x) => x.id === l.productId);
      this.stock.set(l.productId, engine?.stock ?? (this.stock.get(l.productId) ?? 0) + l.qty);
      if (engine) this.cost.set(l.productId, engine.cost);
    }
    // Le moteur calcule le TTC : la dette réelle est celle qu'il a créée.
    const debt = this.db.debts.find((d) => d.id === debtId);
    if (debt && debt.amount > 0) this.openSupplierDebts.push({ id: debtId, date, amount: debt.amount, installments });
    return order;
  }

  expense(date: string, key: AccountKey, amount: number, method: PaymentMethod, description: string): boolean {
    const expense: Expense = {
      id: this.id(),
      date,
      category: description,
      account: this.code(key),
      description,
      amount,
      method,
      createdAt: `${date}T18:00:00.000Z`,
    };
    return this.emit('expense.add', { expense, entryId: this.id() }, date, 18);
  }

  payDebt(id: string, date: string, amount: number, method: PaymentMethod, hour = 19): boolean {
    return this.emit('debt.pay', { debtId: id, payment: { id: this.id(), date, amount, method }, entryId: this.id() }, date, hour);
  }

  adjust(product: Product, date: string, qty: number, reason: string): boolean {
    const ok = this.emit('stock.adjust', { productId: product.id, qty, reason, date, movementId: this.id(), entryId: this.id() }, date, 18);
    if (ok) this.stock.set(product.id, (this.stock.get(product.id) ?? 0) + qty);
    return ok;
  }

  hire(name: string, payKind: 'MONTHLY' | 'DAILY' | 'HOURLY', rate: number, date: string): Employee {
    const employee: Employee = { id: this.id(), name, role: 'Employé', phone: '', payKind, rate, startedOn: date, notes: '', createdAt: `${date}T09:00:00.000Z` };
    this.emit('employee.save', { employee }, date, 9);
    this.employees.push(employee);
    return employee;
  }

  attendance(employee: Employee, date: string, status: 'PRESENT' | 'HALF' | 'ABSENT', hours: number): void {
    this.emit('attendance.mark', { employeeId: employee.id, date, status, hours, attendanceId: this.id() }, date, 8);
  }

  payroll(period: string, date: string, method: PaymentMethod): boolean {
    const slips = payrollPreview(this.db, period);
    if (!slips.length) return true;
    const gross = slips.reduce((s, x) => s + x.gross, 0);
    const advances = slips.reduce((s, x) => s + x.advances, 0);
    const net = slips.reduce((s, x) => s + x.net, 0);
    if (gross <= 0) return true;
    return this.emit('payroll.run', { run: { id: this.id(), period, date, slips, gross, advances, net, paid: true, method, entryId: this.id(), createdAt: `${date}T18:00:00.000Z` } }, date, 18);
  }

  private sessionStart = 0;
  openSession(date: string, opening: number): string {
    const id = this.id();
    this.sessionStart = this.db.entries.length;
    this.emit('session.open', { session: { id, openedAt: `${date}T07:30:00.000Z`, closedAt: null, cashier: 'Simulation', opening, expected: null, counted: null, variance: null } }, date, 7, 30);
    return id;
  }

  closeSession(id: string, date: string, variance: number): void {
    const session = this.db.sessions.find((s) => s.id === id && !s.closedAt);
    if (!session) return;
    // Ce que le moteur attend : mouvement de caisse depuis l'ouverture.
    const cash = this.code('CASH');
    let movement = 0;
    for (let i = this.sessionStart; i < this.db.entries.length; i += 1) {
      const e = this.db.entries[i];
      if (e.createdAt < session.openedAt) continue;
      for (const l of e.lines) if (l.account === cash) movement += l.debit - l.credit;
    }
    this.emit('session.close', { sessionId: id, counted: session.opening + movement + variance, entryId: this.id() }, date, 19, 30);
  }

  closeYear(today: string): { from: string; to: string; result: number } | null {
    const range = nextToClose(this.db, today);
    const plan = closingPlan(this.db.accounts, this.db, range);
    if (plan.empty) return null;
    const carryDate = dayAfter(range.to);
    const ok = this.emit(
      'year.close',
      {
        closingId: this.id(),
        from: range.from,
        to: range.to,
        lines: plan.lines,
        revenue: plan.revenue,
        expenses: plan.expenses,
        result: plan.result,
        closingEntryId: this.id(),
        carryEntryId: this.id(),
        carryDate,
        carryLines: carryForwardLines(this.chart, plan.result),
      },
      carryDate,
      9,
    );
    return ok ? { from: range.from, to: range.to, result: plan.result } : null;
  }

  /**
   * Le moteur règle tout achat depuis la caisse (purchase.receive → compte CASH,
   * sans champ « payé par »). La commerçante fait donc ce qu'elle fait dans la
   * vraie vie : elle retire du mobile money ou de la banque vers la caisse avant.
   */
  ensureCash(date: string, amount: number, hour = 17, minute = 30): boolean {
    let cash = this.treasury('CASH', date);
    if (cash >= amount) return true;
    for (const src of ['MOBILE_MONEY', 'BANK'] as const) {
      const have = this.treasury(src, date);
      const need = amount - cash;
      if (have <= 0 || need <= 0) continue;
      const move = Math.min(have, need);
      this.manual(date, `TRF-${this.id()}`, src === 'BANK' ? 'Retrait banque → caisse' : 'Retrait mobile money → caisse', [
        { key: 'CASH', debit: move }, { key: src, credit: move },
      ], 'OD', hour, minute);
      cash += move;
    }
    return cash >= amount;
  }

  finding(horizon: string, gravite: Finding['gravite'], quoi: string, reproduire: string): void {
    this.findings.push({ entreprise: this.profile.name, horizon, gravite, quoi, reproduire });
  }
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

/** Relit un FEC produit par buildFec : nombre d'écritures, totaux, et lignes déséquilibrées. */
export function parseFec(text: string): { entries: number; lines: number; debit: number; credit: number; unbalanced: number } {
  const rows = text.split('\r\n').slice(1).filter(Boolean);
  const perEntry = new Map<string, { d: number; c: number }>();
  let debit = 0;
  let credit = 0;
  for (const r of rows) {
    const cols = r.split('\t');
    const num = cols[2];
    const d = Number(cols[11].replace(',', '.')) || 0;
    const c = Number(cols[12].replace(',', '.')) || 0;
    debit += d;
    credit += c;
    const e = perEntry.get(num) ?? { d: 0, c: 0 };
    e.d += d;
    e.c += c;
    perEntry.set(num, e);
  }
  const unbalanced = [...perEntry.values()].filter((e) => Math.abs(e.d - e.c) > 0.005).length;
  return { entries: perEntry.size, lines: rows.length, debit: Math.round(debit * 100) / 100, credit: Math.round(credit * 100) / 100, unbalanced };
}

// ---------------------------------------------------------------------------
// Vérifications à un horizon
// ---------------------------------------------------------------------------

export interface HorizonReport {
  horizon: string;
  date: string;
  events: number;
  entries: number;
  ms: number;
  ok: boolean;
  /** Taille de l'état JSON à cet horizon (ce que saveCache écrit dans localStorage). */
  stateBytes?: number;
}

export function verify(ctx: Ctx, horizon: string, upTo: string, fiscal?: { from: string; to: string; result: number; cumulative: number }): boolean {
  const db = ctx.db;
  let ok = true;
  const note = (g: Finding['gravite'], quoi: string, repro: string) => {
    ctx.finding(horizon, g, quoi, repro);
    if (g !== 'INFO') ok = false;
  };
  const repro = `npx vite-node scripts/sim-passe1.ts ${ctx.profile.key} — horizon ${horizon}`;

  // 1. Balance équilibrée.
  const tb = trialBalance(db.accounts, db.entries, undefined, upTo);
  const debit = tb.reduce((s, b) => s + b.debit, 0);
  const credit = tb.reduce((s, b) => s + b.credit, 0);
  if (debit !== credit) note('BLOQUANT', `Balance déséquilibrée : débit ${fmt(debit)} ≠ crédit ${fmt(credit)}`, repro);

  // 2. Bilan.
  const bs = balanceSheet(db.accounts, db.entries, upTo);
  if (bs.difference !== 0) note('BLOQUANT', `Bilan qui ne boucle pas : écart ${fmt(bs.difference)} (actif ${fmt(bs.totalAssets)}, passif ${fmt(bs.totalLiabilities)}, capitaux ${fmt(bs.totalEquity)})`, repro);

  // 3. Stock jamais négatif, et valeur du stock ≈ compte de stock.
  const negative = db.products.filter((p) => p.stock < 0);
  if (negative.length) note('BLOQUANT', `Stock négatif sur ${negative.length} article(s) : ${negative.slice(0, 3).map((p) => `${p.name} ${p.stock}`).join(', ')}`, repro);
  if (db.company.tracksStock !== false) {
    const stockValue = db.products.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0);
    const inventory = balanceOf(ctx.code('INVENTORY'), db.entries, 'DEBIT', undefined, upTo);
    const gap = Math.abs(stockValue - inventory);
    const tolerance = Math.max(1000, Math.round(inventory * 0.005));
    if (gap > tolerance) note(gap > inventory * 0.02 ? 'MAJEUR' : 'MINEUR', `Valeur du stock (${fmt(stockValue)}) ≠ compte de stock (${fmt(inventory)}) : écart ${fmt(stockValue - inventory)}`, repro);
  }

  // 4. Trésorerie : aucun compte sous zéro, jour par jour.
  const sorted = db.entries.filter((e) => e.posted && e.date <= upTo).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  for (const key of ['CASH', 'MOBILE_MONEY', 'BANK'] as const) {
    const code = ctx.code(key);
    let bal = 0;
    let min = 0;
    let when = '';
    for (const e of sorted) for (const l of e.lines) if (l.account === code) {
      bal += l.debit - l.credit;
      if (bal < min) {
        min = bal;
        when = `${e.date} ${e.label}`;
      }
    }
    if (min < 0) note('MAJEUR', `Compte ${key} passé à ${fmt(min)} le ${when}`, repro);
  }

  // 4 bis. Écritures sans aucune ligne (une vente à zéro en produit une) : numéro consommé dans le FEC sans ligne.
  const empty = db.entries.filter((e) => e.posted && e.lines.length === 0 && e.date <= upTo);
  if (empty.length) note('MAJEUR', `${empty.length} écriture(s) sans aucune ligne, marquées « passées » (première : ${empty[0].date} ${empty[0].label}). Le FEC leur attribue un numéro sans ligne : trou de numérotation.`, repro);

  // 4 ter. Les exercices déjà clos restent-ils soldés ? (une écriture datée dans un exercice clos les rouvre en silence)
  for (const c of db.closings) {
    const gestion = trialBalance(db.accounts, db.entries, c.from, c.to).filter((b) => b.account.kind === 'REVENUE' || b.account.kind === 'EXPENSE');
    const reste = gestion.reduce((s, b) => s + b.balance, 0);
    const is = incomeStatement(db.accounts, db.entries, c.from, c.to);
    if (reste !== 0 || is.netIncome !== c.result) note('BLOQUANT', `Exercice clos ${c.from}→${c.to} : comptes de gestion à ${fmt(reste)} (attendu 0), compte de résultat relu ${fmt(is.netIncome)} contre ${fmt(c.result)} clôturé. Une écriture datée dans l’exercice clos a été acceptée après la clôture.`, repro);
  }

  // 5. Contrôles de l'application.
  const checks = runAuditChecks(db.accounts, db.entries);
  for (const c of checks.filter((x) => x.severity === 'ERROR')) note('BLOQUANT', `Audit : ${c.label} — ${c.detail}`, repro);

  // 6. Après clôture : comptes 6/7 soldés, report à nouveau exact, résultat affecté.
  if (fiscal) {
    const gestion = trialBalance(db.accounts, db.entries, fiscal.from, fiscal.to).filter((b) => b.account.kind === 'REVENUE' || b.account.kind === 'EXPENSE');
    const reste = gestion.reduce((s, b) => s + b.balance, 0);
    if (reste !== 0) note('BLOQUANT', `Après clôture ${fiscal.from}→${fiscal.to}, les comptes de gestion ne sont pas soldés : reste ${fmt(reste)}`, repro);
    const next = dayAfter(fiscal.to);
    const ran = balanceOf(ctx.code('RETAINED'), db.entries, 'CREDIT', undefined, next) - balanceOf(ctx.code('RETAINED_LOSS'), db.entries, 'DEBIT', undefined, next);
    const direct = db.entries.filter((e) => e.posted && e.journal !== 'CL' && e.date <= next).reduce((s, e) => s + e.lines.filter((l) => l.account === ctx.code('RETAINED')).reduce((t, l) => t + l.credit - l.debit, 0) - e.lines.filter((l) => l.account === ctx.code('RETAINED_LOSS')).reduce((t, l) => t + l.debit - l.credit, 0), 0);
    if (ran !== fiscal.cumulative + direct) note('BLOQUANT', `Report à nouveau au ${next} = ${fmt(ran)}, attendu ${fmt(fiscal.cumulative + direct)} (cumul des résultats clos${direct ? ' + reprise directe' : ''})`, repro);
    const result = balanceOf(ctx.code('RESULT'), db.entries, 'CREDIT', undefined, next);
    if (result !== 0) note('MAJEUR', `Compte de résultat non soldé après affectation : ${fmt(result)}`, repro);
    // Compte de résultat de l'exercice clos toujours lisible et égal au résultat clôturé.
    const is = incomeStatement(db.accounts, db.entries, fiscal.from, fiscal.to);
    if (is.netIncome !== fiscal.result) note('MAJEUR', `Compte de résultat ${fiscal.from}→${fiscal.to} lu après clôture = ${fmt(is.netIncome)}, résultat clôturé = ${fmt(fiscal.result)}`, repro);

    // 7. Taxe déclarée = taxe des ventes de l'exercice.
    if (db.company.vatEnabled) {
      const collected = ctx.code('VAT_COLLECTED');
      let declared = 0;
      for (const e of entriesInRange(db.entries, fiscal.from, fiscal.to).filter((x) => x.journal !== 'CL')) {
        declared += e.lines.filter((l) => l.account === collected).reduce((s, l) => s + l.credit - l.debit, 0);
      }
      const expected = db.sales.filter((s) => s.status === 'CONFIRMED' && s.date >= fiscal.from && s.date <= fiscal.to).reduce((s, x) => s + x.vat, 0);
      if (declared !== expected) note('MAJEUR', `Taxe collectée déclarée ${fmt(declared)} ≠ taxe des ventes ${fmt(expected)} sur ${fiscal.from}→${fiscal.to}`, repro);
    }

    // 8. FEC : s'exporte et se relit sans perte.
    const decimals = currencyOf(db.company.currency).decimals;
    const fec = buildFec(db.accounts, db.entries, { from: fiscal.from, to: fiscal.to, decimals });
    const parsed = parseFec(fec);
    const posted = db.entries.filter((e) => e.posted && e.date >= fiscal.from && e.date <= fiscal.to);
    if (parsed.entries !== posted.length) note('MAJEUR', `FEC ${fiscal.from}→${fiscal.to} : ${parsed.entries} écritures relues, ${posted.length} en base`, repro);
    if (parsed.unbalanced) note('BLOQUANT', `FEC : ${parsed.unbalanced} écriture(s) déséquilibrée(s) à la relecture`, repro);
    const factor = 10 ** decimals;
    const tbRange = trialBalance(db.accounts, db.entries, fiscal.from, fiscal.to);
    const d = tbRange.reduce((s, b) => s + b.debit, 0) / factor;
    if (Math.abs(parsed.debit - d) > 0.01) note('MAJEUR', `FEC : total débit relu ${parsed.debit} ≠ balance ${d}`, repro);
  }

  // 9. Événements refusés par le moteur.
  if (ctx.refused.length) {
    const byType = new Map<string, number>();
    for (const r of ctx.refused) byType.set(`${r.type} — ${r.message}`, (byType.get(`${r.type} — ${r.message}`) ?? 0) + 1);
    for (const [k, n] of byType) note('MAJEUR', `${n} événement(s) refusé(s) : ${k} (premier le ${ctx.refused.find((r) => `${r.type} — ${r.message}` === k)?.date})`, repro);
    ctx.refused = [];
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Vie de l'entreprise
// ---------------------------------------------------------------------------

export interface RunResult {
  profile: Profile;
  /** L'état final, pour inspection. */
  db: DB;
  horizons: HorizonReport[];
  findings: Finding[];
  traps: { year: number; report: TrapReport }[];
  totalMs: number;
  events: number;
  entries: number;
  stateBytes: number;
}

export function runEntreprise(profile: Profile, years: number, start = '2026-01-05'): RunResult {
  const ctx = new Ctx(profile);
  const t0 = performance.now();
  const horizons: HorizonReport[] = [];
  const traps: { year: number; report: TrapReport }[] = [];

  // Naissance de l'entreprise.
  ctx.emit('company.update', { patch: { name: profile.name, onboarded: true, mode: 'EXPERT', ...profile.company } }, start, 6);
  const o = profile.opening;
  const capital = o.cash + o.mobile + o.bank;
  ctx.manual(start, 'AP-0001', 'Apport de départ', [
    ...(o.cash ? [{ key: 'CASH' as AccountKey, debit: o.cash, label: 'Apport en caisse' }] : []),
    ...(o.mobile ? [{ key: 'MOBILE_MONEY' as AccountKey, debit: o.mobile, label: 'Apport mobile' }] : []),
    ...(o.bank ? [{ key: 'BANK' as AccountKey, debit: o.bank, label: 'Apport en banque' }] : []),
    { key: 'CAPITAL', credit: capital, label: 'Capital' },
  ]);
  for (const p of profile.products) ctx.addProduct(p, start);
  for (const name of profile.customers ?? []) {
    const c: Customer = { id: ctx.id(), name, phone: '', email: '', address: '', createdAt: `${start}T08:00:00.000Z` };
    ctx.emit('customer.save', { customer: c }, start, 8);
    ctx.customers.push(c);
  }
  for (const name of profile.suppliers ?? []) {
    const s: Supplier = { id: ctx.id(), name, phone: '', email: '', address: '', createdAt: `${start}T08:00:00.000Z` };
    ctx.emit('supplier.save', { supplier: s }, start, 8);
    ctx.suppliers.push(s);
  }
  for (const s of profile.staff ?? []) ctx.hire(s.name, s.payKind, s.rate, start);

  const stocked = ctx.db.company.tracksStock !== false;
  const marks: Record<number, string> = { 1: 'jour 1', 7: 'semaine', 30: 'mois', 90: 'trimestre' };
  let cumulative = 0;
  let yearsClosed = 0;
  let lastPayroll = '';
  let day = 0;
  const totalDays = Math.round(years * 365.25);
  let sessionId: string | null = null;
  let cachedRange: { from: string; to: string } | null = null;
  // Quantité vendue par article, pour dimensionner les commandes : moyenne réelle par jour ouvert.
  const soldQty = new Map<string, number>();
  let daysOpen = 0;

  const horizon = (label: string, date: string, fiscal?: Parameters<typeof verify>[3]) => {
    const t = performance.now();
    const ok = verify(ctx, label, date, fiscal);
    const stateBytes = JSON.stringify(normalizeDB(ctx.db)).length;
    horizons.push({ horizon: label, date, events: ctx.eventCount, entries: ctx.db.entries.length, ms: Math.round(performance.now() - t0), ok, stateBytes });
    void t;
  };

  for (day = 1; day <= totalDays; day += 1) {
    const date = addDays(start, day);
    const wd = weekday(date);
    const open = profile.sales.closedWeekday === undefined || wd !== profile.sales.closedWeekday;

    // Approvisionnement.
    if (stocked && profile.purchases && day % profile.purchases.everyDays === 1) {
      const lines = ctx.products
        .filter((p) => !p.archived && p.cost > 0)
        .map((p) => {
          const daily = daysOpen > 3 ? (soldQty.get(p.id) ?? 0) / daysOpen : (profile.sales.perDay[1] * profile.sales.qtyPerLine[1]) / Math.max(1, ctx.products.length);
          const target = Math.ceil(Math.max(daily, 0.5) * profile.purchases!.coverDays);
          const have = ctx.stock.get(p.id) ?? 0;
          const qty = Math.max(0, target - have);
          return { product: p, qty, unitCost: Math.round(p.cost * (0.95 + ctx.rnd() * 0.1)) };
        })
        .filter((l) => l.qty > 0);
      const cost = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);
      // On ne commande que ce qu'on peut payer : la trésorerie est vérifiée.
      const paidNow = profile.purchases.paidNow;
      if (lines.length && ctx.ensureCash(date, Math.round(cost * paidNow), 7, 45)) {
        ctx.purchase(date, lines, ctx.suppliers[0] ?? null, paidNow, 2);
      }
      if (day <= profile.purchases.everyDays + 1 && !ctx.findings.some((f) => f.quoi.startsWith('Tout achat réceptionné'))) {
        ctx.finding('jour 1', 'MAJEUR', 'Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.', 'Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.');
      }
    }

    profile.daily?.(ctx, date, day);
    // Scénario propre au métier, une fois par an, en milieu d'année (avant les ventes du jour).
    if (profile.yearly && day % 365 === 180) profile.yearly(ctx, Math.floor(day / 365) + 1);

    if (open) {
      if (profile.sessions) sessionId = ctx.openSession(date, 20_000);
      const n = ctx.between(...profile.sales.perDay);
      for (let i = 0; i < n; i += 1) {
        const k = ctx.between(...profile.sales.linesPerSale);
        const sellable = ctx.products.filter((p) => !p.archived && p.price > 0);
        const picks = Array.from({ length: k }, () => ({ product: ctx.pick(sellable), qty: ctx.between(...profile.sales.qtyPerLine) }));
        const method = ctx.weighted(profile.sales.methods);
        const customer = method === 'CREDIT' || ctx.rnd() < 0.15 ? ctx.pick(ctx.customers) ?? null : null;
        const sale = ctx.sale(date, picks, method, customer, method === 'CREDIT' ? 0.3 : 1, 9 + Math.floor((i * 9) / Math.max(1, n)));
        if (sale) for (const l of sale.lines) soldQty.set(l.productId, (soldQty.get(l.productId) ?? 0) + l.qty);
      }
      daysOpen += 1;
      if (profile.sessions && sessionId) {
        ctx.closeSession(sessionId, date, ctx.rnd() < 0.08 ? -ctx.between(200, 2000) : 0);
        sessionId = null;
      }
    }

    // Règlements des clients à crédit.
    const settleDays = profile.sales.creditSettleDays ?? 30;
    for (const d of [...ctx.openDebts]) {
      if (addDays(d.date, settleDays) <= date) {
        ctx.payDebt(d.id, date, d.amount, 'MOBILE', 12);
        ctx.openDebts = ctx.openDebts.filter((x) => x.id !== d.id);
      }
    }
    // Règlements fournisseurs, en deux fois à 15 et 30 jours.
    for (const d of [...ctx.openSupplierDebts]) {
      const due = addDays(d.date, d.installments === 2 ? 15 : 30);
      if (due <= date) {
        const part = d.installments === 2 ? Math.round(d.amount / 2) : d.amount;
        const method: PaymentMethod = ctx.treasury('BANK', date) >= part ? 'BANK' : ctx.treasury('MOBILE_MONEY', date) >= part ? 'MOBILE' : 'CASH';
        if (method !== 'CASH' || ctx.ensureCash(date, part)) {
          ctx.payDebt(d.id, date, part, method);
          d.amount -= part;
          d.installments -= 1;
          if (d.amount <= 0 || d.installments <= 0) ctx.openSupplierDebts = ctx.openSupplierDebts.filter((x) => x.id !== d.id);
        }
      }
    }

    // Dépenses du mois, présences, paie.
    const dom = Number(date.slice(8, 10));
    for (const x of profile.expenses ?? []) {
      if (dom === x.day) {
        const method = x.method ?? (ctx.treasury('BANK', date) >= x.amount ? 'BANK' : ctx.treasury('MOBILE_MONEY', date) >= x.amount ? 'MOBILE' : 'CASH');
        const acct = method === 'BANK' ? 'BANK' : method === 'MOBILE' ? 'MOBILE_MONEY' : 'CASH';
        if (acct !== 'CASH' ? ctx.treasury(acct, date) >= x.amount : ctx.ensureCash(date, x.amount)) ctx.expense(date, x.key, x.amount, method, x.key);
        else ctx.finding(`jour ${day}`, 'INFO', `Dépense ${x.key} de ${fmt(x.amount)} non passée le ${date} : trésorerie insuffisante (simulation)`, '');
      }
    }
    for (const e of ctx.employees) if (e.payKind !== 'MONTHLY' && open) ctx.attendance(e, date, ctx.rnd() < 0.05 ? 'ABSENT' : 'PRESENT', 8);
    const period = date.slice(0, 7);
    if (dom === 28 && period !== lastPayroll && ctx.employees.length) {
      lastPayroll = period;
      const slips = payrollPreview(ctx.db, period);
      const net = slips.reduce((s, x) => s + x.net, 0);
      const method: PaymentMethod = ctx.treasury('BANK', date) >= net ? 'BANK' : ctx.treasury('MOBILE_MONEY', date) >= net ? 'MOBILE' : 'CASH';
      if (method !== 'CASH' ? true : ctx.ensureCash(date, net)) ctx.payroll(period, date, method);
      else ctx.finding(`jour ${day}`, 'INFO', `Paie ${period} non versée : trésorerie insuffisante (simulation)`, '');
    }

    // Horizons courts.
    if (marks[day]) horizon(marks[day], date);

    // Clôture d'exercice : quand l'exercice courant vient de se terminer.
    if (!cachedRange || cachedRange.to < date) cachedRange = nextToClose(ctx.db, date);
    const range = cachedRange;
    if (range.to < date && ctx.db.entries.some((e) => e.posted && e.date >= range.from && e.date <= range.to)) {
      const trap = profile.trap?.(ctx, range) ?? null;
      const closed = ctx.closeYear(date);
      cachedRange = null;
      if (closed) {
        yearsClosed += 1;
        cumulative += closed.result;
        if (trap) traps.push({ year: yearsClosed, report: trap });
        horizon(`année ${yearsClosed} (clôture ${closed.from}→${closed.to})`, addDays(closed.to, 1), { ...closed, cumulative });
      } else if (!ctx.findings.some((f) => f.quoi.startsWith(`La clôture ${range.from}`))) {
        ctx.finding(`année ${yearsClosed + 1}`, 'BLOQUANT', `La clôture ${range.from}→${range.to} n'a pas pu être passée (plan vide alors que des écritures existent dans l'exercice)`, `npx vite-node scripts/sim-passe1.ts ${profile.key}`);
      }
    }
  }

  return {
    profile,
    db: ctx.db,
    horizons,
    findings: ctx.findings,
    traps,
    totalMs: Math.round(performance.now() - t0),
    events: ctx.eventCount,
    entries: ctx.db.entries.length,
    stateBytes: JSON.stringify(normalizeDB(ctx.db)).length,
  };
}
