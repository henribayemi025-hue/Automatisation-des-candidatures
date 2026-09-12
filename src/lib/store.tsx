import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { accountCode } from './chart';
import type { AccountKey } from './chart';
import { applyEvent, emptyDB, normalizeDB, saleTotals } from './reducer';
import { buildDemoEvents } from './demo';
import type {
  Company,
  Customer,
  DB,
  JournalCode,
  JournalLine,
  Minor,
  PaymentMethod,
  Product,
  Purchase,
  PurchaseLine,
  ForeignAmount,
  LandedCost,
  Sale,
  SaleLine,
  Supplier,
  WorkspaceEvent,
  Project,
  Message,
  FixedAsset,
  Employee,
  Attendance,
  Payslip,
  PayrollRun,
} from './types';
import { depreciationPlan } from './assets';
import { carryForwardLines, closingPlan, dayAfter } from './closing';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const CACHE_PREFIX = 'finia.cache.';

export function loadCache(scope: string): DB | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + scope);
    return raw ? normalizeDB(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveCache(scope: string, db: DB) {
  try {
    localStorage.setItem(CACHE_PREFIX + scope, JSON.stringify(db));
  } catch {
    // Stockage plein ou indisponible : le cloud reste la source de vérité.
  }
}

export function hasContent(db: DB | null): boolean {
  return !!db && (db.products.length > 0 || db.entries.length > 0 || db.sales.length > 0 || db.expenses.length > 0);
}

interface Actor {
  id: string | null;
  name: string;
}

interface SaleInput {
  lines: SaleLine[];
  /** Date de l'opération : permet de rattraper des journées passées. */
  date?: string;
  projectId?: string | null;
  discount: Minor;
  method: PaymentMethod;
  customerId: string | null;
  customerName: string;
  paid: Minor;
  asQuote?: boolean;
}

interface PurchaseInput {
  /** Lignes dans la devise de l'entreprise (déjà converties si facture étrangère). */
  lines: PurchaseLine[];
  date?: string;
  projectId?: string | null;
  supplierId: string | null;
  supplierName: string;
  paid: Minor;
  /** Facture reçue dans une autre devise : gardée pour l'affichage et l'audit. */
  foreign?: ForeignAmount | null;
  /** Douane, fret, transit… ajoutés au coût du stock à la réception. */
  landed?: LandedCost[];
  /** TVA payée en douane, déductible. */
  importVat?: Minor;
  landedPaidWith?: PaymentMethod;
}

interface ExpenseInput {
  date: string;
  projectId?: string | null;
  category: string;
  accountKey: AccountKey;
  description: string;
  amount: Minor;
  method: PaymentMethod;
}

interface ManualEntryInput {
  date: string;
  journal: JournalCode;
  label: string;
  lines: JournalLine[];
  /** Référence imposée (ex. « AN » pour les à-nouveaux) ; sinon OD-0001, OD-0002… */
  ref?: string;
}

type Listener = (ev: WorkspaceEvent) => void;

export interface StoreActions {
  code: (key: AccountKey) => string;
  /** Lecture synchrone de l'état courant, sans dépendre du rendu. */
  getState: () => DB;
  /** Identité de la personne qui agit, portée par chaque événement. */
  setActor: (actor: Actor) => void;
  /** Espace de stockage local courant ('guest' ou identifiant d'espace). */
  setScope: (scope: string) => void;
  replaceState: (db: DB) => void;
  applyRemote: (events: WorkspaceEvent[]) => void;
  subscribe: (listener: Listener) => () => void;

  setCompany: (patch: Partial<Company>) => void;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => void;
  archiveProduct: (productId: string) => void;
  saveCustomer: (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => Customer;
  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }) => Supplier;
  removeCustomer: (customerId: string) => void;
  archiveCustomer: (customerId: string, archived: boolean) => void;
  removeSupplier: (supplierId: string) => void;
  archiveSupplier: (supplierId: string, archived: boolean) => void;
  recordSale: (input: SaleInput) => Sale;
  confirmQuote: (saleId: string, method: PaymentMethod, paid: Minor) => void;
  recordPurchase: (input: PurchaseInput) => Purchase;
  receivePurchase: (purchaseId: string, date?: string) => void;
  addExpense: (input: ExpenseInput) => void;
  adjustStock: (productId: string, qty: number, reason: string) => void;
  payDebt: (debtId: string, amount: Minor, method: PaymentMethod) => void;
  addManualEntry: (input: ManualEntryInput) => void;
  reverseEntry: (entryId: string) => void;
  saveEmployee: (employee: Omit<Employee, 'id' | 'createdAt'> & { id?: string }) => Employee;
  archiveEmployee: (employeeId: string, archived: boolean) => void;
  markAttendance: (employeeId: string, date: string, status: Attendance['status'], hours?: number) => void;
  payAdvance: (employeeId: string, amount: Minor, method: PaymentMethod, date: string, note?: string) => void;
  runPayroll: (period: string, date: string, slips: Payslip[], method: PaymentMethod, paid: boolean) => PayrollRun | null;
  settlePayroll: (runId: string, method: PaymentMethod, date: string) => void;
  saveAsset: (asset: Omit<FixedAsset, 'id' | 'createdAt'> & { id?: string }, paidWith?: PaymentMethod) => FixedAsset;
  disposeAsset: (assetId: string, date: string, proceeds: Minor, method: PaymentMethod) => void;
  runDepreciation: (period: string, date: string) => number;
  reconcileEntry: (entryId: string, account: string, on: boolean, statementDate: string) => void;
  closeFiscalYear: (range: { from: string; to: string }) => { result: Minor } | null;
  reopenFiscalYear: (closingId: string) => void;
  openSession: (opening: Minor) => void;
  closeSession: (counted: Minor) => void;
  /** Charge un jeu d'essai complet (trois mois d'activité) et renvoie le nombre d'événements. */
  loadDemo: () => number;
  saveProject: (project: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => Project;
  postMessage: (input: Omit<Message, 'id' | 'createdAt' | 'authorId' | 'authorName'> & { authorName?: string; authorId?: string | null }) => Message;
  assignToProject: (kind: 'sale' | 'purchase' | 'expense', id: string, projectId: string | null) => void;
  resetAll: () => void;
}

export interface StoreValue extends StoreActions {
  db: DB;
}

const StoreContext = createContext<StoreValue | null>(null);
const ActionsContext = createContext<StoreActions | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadCache('guest') ?? emptyDB());
  const dbRef = useRef(db);
  dbRef.current = db;
  const actor = useRef<Actor>({ id: null, name: 'Utilisateur' });
  const scope = useRef('guest');
  const listeners = useRef(new Set<Listener>());

  const commit = useCallback((next: DB) => {
    dbRef.current = next;
    setDb(next);
    saveCache(scope.current, next);
  }, []);

  /** Crée l'événement, l'applique localement tout de suite, puis prévient la synchro. */
  const dispatch = useCallback(
    (type: string, payload: Record<string, unknown>): WorkspaceEvent => {
      const ev: WorkspaceEvent = {
        id: newId(),
        at: new Date().toISOString(),
        actorId: actor.current.id,
        actorName: actor.current.name,
        type,
        payload,
      };
      // Validation stricte avant diffusion : une écriture déséquilibrée lève ici,
      // jamais chez les autres membres.
      commit(applyEvent(dbRef.current, ev));
      listeners.current.forEach((l) => l(ev));
      return ev;
    },
    [commit],
  );

  // Identité stable : les composants et la synchro peuvent en dépendre sans boucle.
  const actions = useMemo<StoreActions>(() => {
    const chart = () => dbRef.current.company.chart;
    const nextNumber = (prefix: string, count: number) => `${prefix}-${String(count + 1).padStart(5, '0')}`;

    return {
      code: (key) => accountCode(chart(), key),
      getState: () => dbRef.current,

      setActor(a) {
        actor.current = a;
      },
      setScope(s) {
        scope.current = s;
      },
      replaceState(next) {
        commit(normalizeDB(next));
      },
      applyRemote(events) {
        let next = dbRef.current;
        for (const ev of events) {
          try {
            next = applyEvent(next, ev);
          } catch {
            // Un événement invalide venu d'ailleurs n'abîme pas l'état local.
          }
        }
        commit(next);
      },
      subscribe(listener) {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },

      setCompany(patch) {
        dispatch('company.update', { patch });
      },

      saveProduct(input) {
        const existing = input.id ? dbRef.current.products.find((p) => p.id === input.id) : undefined;
        const product: Product = {
          ...(existing ?? { id: newId(), createdAt: new Date().toISOString() }),
          ...input,
          id: existing?.id ?? input.id ?? newId(),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        } as Product;
        dispatch('product.save', { product, movementId: newId(), entryId: newId() });
      },

      archiveProduct(productId) {
        dispatch('product.archive', { productId });
      },

      saveCustomer(input) {
        const customer: Customer = { ...input, id: input.id ?? newId(), createdAt: new Date().toISOString() };
        dispatch('customer.save', { customer });
        return customer;
      },

      saveSupplier(input) {
        const supplier: Supplier = { ...input, id: input.id ?? newId(), createdAt: new Date().toISOString() };
        dispatch('supplier.save', { supplier });
        return supplier;
      },

      removeCustomer(customerId) {
        dispatch('customer.remove', { customerId });
      },

      archiveCustomer(customerId, archived) {
        dispatch('customer.archive', { customerId, archived });
      },

      removeSupplier(supplierId) {
        dispatch('supplier.remove', { supplierId });
      },

      archiveSupplier(supplierId, archived) {
        dispatch('supplier.archive', { supplierId, archived });
      },

      recordSale(input) {
        const t = saleTotals(dbRef.current.company, input.lines, input.discount);
        const isQuote = !!input.asQuote;
        const sale: Sale = {
          id: newId(),
          number: nextNumber(
            isQuote ? 'DV' : 'FA',
            dbRef.current.sales.filter((s) => (isQuote ? s.status === 'QUOTE' : s.status !== 'QUOTE')).length,
          ),
          date: input.date || today(),
          projectId: input.projectId ?? null,
          customerId: input.customerId,
          customerName: input.customerName || 'Client passager',
          lines: input.lines,
          discount: input.discount,
          vat: t.vat,
          total: t.total,
          paid: isQuote ? 0 : Math.min(input.paid, t.total),
          method: input.method,
          status: isQuote ? 'QUOTE' : 'CONFIRMED',
          cashier: actor.current.name,
          createdAt: new Date().toISOString(),
        };
        dispatch('sale.record', {
          sale,
          ids: {
            movements: input.lines.map(() => newId()),
            saleEntry: newId(),
            cogsEntry: newId(),
            debt: newId(),
          },
        });
        return sale;
      },

      confirmQuote(saleId, method, paid) {
        const sale = dbRef.current.sales.find((s) => s.id === saleId);
        if (!sale) throw new Error('Devis introuvable');
        dispatch('quote.confirm', {
          saleId,
          method,
          paid: Math.min(paid, sale.total),
          number: nextNumber('FA', dbRef.current.sales.filter((s) => s.status !== 'QUOTE').length),
          date: today(),
          ids: {
            movements: sale.lines.map(() => newId()),
            saleEntry: newId(),
            cogsEntry: newId(),
            debt: newId(),
          },
        });
      },

      recordPurchase(input) {
        const total = input.lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
        const purchase: Purchase = {
          id: newId(),
          number: nextNumber('BC', dbRef.current.purchases.length),
          date: input.date || today(),
          projectId: input.projectId ?? null,
          supplierId: input.supplierId,
          supplierName: input.supplierName || 'Fournisseur',
          lines: input.lines,
          total,
          paid: Math.min(input.paid, total),
          status: 'PENDING',
          foreign: input.foreign ?? null,
          landed: (input.landed ?? []).filter((c) => c.amount > 0),
          importVat: input.importVat ?? 0,
          landedPaidWith: input.landedPaidWith ?? 'BANK',
          createdAt: new Date().toISOString(),
        };
        dispatch('purchase.record', { purchase });
        return purchase;
      },

      receivePurchase(purchaseId, date) {
        const purchase = dbRef.current.purchases.find((p) => p.id === purchaseId);
        if (!purchase) throw new Error('Achat introuvable');
        if (purchase.status === 'RECEIVED') throw new Error('Achat déjà réceptionné');
        dispatch('purchase.receive', {
          purchaseId,
          date: date || purchase.date || today(),
          ids: { movements: purchase.lines.map(() => newId()), entry: newId(), payment: newId(), debt: newId() },
        });
      },

      addExpense(input) {
        dispatch('expense.add', {
          expense: {
            id: newId(),
            date: input.date,
            projectId: input.projectId ?? null,
            category: input.category,
            account: accountCode(chart(), input.accountKey),
            description: input.description,
            amount: input.amount,
            method: input.method,
            createdAt: new Date().toISOString(),
          },
          entryId: newId(),
        });
      },

      adjustStock(productId, qty, reason) {
        if (!dbRef.current.products.some((p) => p.id === productId)) throw new Error('Produit introuvable');
        dispatch('stock.adjust', { productId, qty, reason, date: today(), movementId: newId(), entryId: newId() });
      },

      payDebt(debtId, amount, method) {
        if (!dbRef.current.debts.some((d) => d.id === debtId)) throw new Error('Dette introuvable');
        dispatch('debt.pay', {
          debtId,
          payment: { id: newId(), date: today(), amount, method },
          entryId: newId(),
        });
      },

      addManualEntry(input) {
        const debit = input.lines.reduce((s, l) => s + l.debit, 0);
        const credit = input.lines.reduce((s, l) => s + l.credit, 0);
        if (debit !== credit) throw new Error(`Écriture déséquilibrée (${debit} ≠ ${credit})`);
        dispatch('entry.manual', {
          entryId: newId(),
          date: input.date,
          journal: input.journal,
          ref: input.ref ?? `OD-${String(dbRef.current.entries.length + 1).padStart(4, '0')}`,
          label: input.label,
          lines: input.lines,
        });
      },

      reverseEntry(entryId) {
        const original = dbRef.current.entries.find((e) => e.id === entryId);
        if (!original) throw new Error('Écriture introuvable');
        if (original.reversedBy) throw new Error('Écriture déjà extournée');
        dispatch('entry.reverse', { entryId, reversalId: newId(), date: today() });
      },

      saveEmployee(input) {
        const employee: Employee = {
          ...input,
          id: input.id ?? newId(),
          createdAt: dbRef.current.employees.find((e) => e.id === input.id)?.createdAt ?? new Date().toISOString(),
        };
        dispatch('employee.save', { employee });
        return employee;
      },

      archiveEmployee(employeeId, archived) {
        dispatch('employee.archive', { employeeId, archived });
      },

      markAttendance(employeeId, date, status, hours = 0) {
        dispatch('attendance.mark', { employeeId, date, status, hours, attendanceId: newId() });
      },

      payAdvance(employeeId, amount, method, date, note = '') {
        if (amount <= 0) return;
        dispatch('staff.advance', {
          advance: {
            id: newId(),
            employeeId,
            date,
            amount,
            method,
            note,
            entryId: newId(),
            createdAt: new Date().toISOString(),
          },
        });
      },

      runPayroll(period, date, slips, method, paid) {
        const kept = slips.filter((s) => s.gross > 0);
        if (!kept.length) return null;
        const run: PayrollRun = {
          id: newId(),
          period,
          date,
          slips: kept,
          gross: kept.reduce((s, x) => s + x.gross, 0),
          advances: kept.reduce((s, x) => s + x.advances, 0),
          net: kept.reduce((s, x) => s + x.net, 0),
          paid,
          method,
          entryId: newId(),
          createdAt: new Date().toISOString(),
        };
        dispatch('payroll.run', { run });
        return run;
      },

      settlePayroll(runId, method, date) {
        dispatch('payroll.settle', { runId, method, date, entryId: newId() });
      },

      saveAsset(input, paidWith) {
        const asset: FixedAsset = {
          ...input,
          id: input.id ?? newId(),
          createdAt: dbRef.current.assets.find((a) => a.id === input.id)?.createdAt ?? new Date().toISOString(),
        };
        dispatch('asset.save', { asset, paidWith: paidWith ?? null, entryId: newId() });
        return asset;
      },

      disposeAsset(assetId, date, proceeds, method) {
        dispatch('asset.dispose', { assetId, date, proceeds, method, entryId: newId() });
      },

      runDepreciation(period, date) {
        const state = dbRef.current;
        const plan = depreciationPlan(
          state.assets.filter((a) => a.status === 'ACTIVE'),
          state.depreciations,
          period,
        );
        if (!plan.length) return 0;
        dispatch('depreciation.run', {
          period,
          date,
          entryId: newId(),
          items: plan.map((l) => ({ id: newId(), assetId: l.asset.id, amount: l.amount })),
        });
        return plan.length;
      },

      reconcileEntry(entryId, account, on, statementDate) {
        dispatch('entry.reconcile', { entryId, account, on, statementDate, reconciliationId: newId() });
      },

      closeFiscalYear(range) {
        const state = dbRef.current;
        const plan = closingPlan(state.accounts, state, { ...range, label: range.to.slice(0, 4) });
        if (plan.empty) return null;
        dispatch('year.close', {
          closingId: newId(),
          from: range.from,
          to: range.to,
          lines: plan.lines,
          revenue: plan.revenue,
          expenses: plan.expenses,
          result: plan.result,
          closingEntryId: newId(),
          carryEntryId: newId(),
          carryDate: dayAfter(range.to),
          carryLines: carryForwardLines(state.company.chart, plan.result),
        });
        return { result: plan.result };
      },

      reopenFiscalYear(closingId) {
        dispatch('year.reopen', {
          closingId,
          date: today(),
          closingReversalId: newId(),
          carryReversalId: newId(),
        });
      },

      openSession(opening) {
        if (dbRef.current.sessions.some((s) => !s.closedAt)) throw new Error('Une session est déjà ouverte');
        dispatch('session.open', {
          session: {
            id: newId(),
            openedAt: new Date().toISOString(),
            closedAt: null,
            cashier: actor.current.name,
            opening,
            expected: null,
            counted: null,
            variance: null,
          },
        });
      },

      closeSession(counted) {
        const session = dbRef.current.sessions.find((s) => !s.closedAt);
        if (!session) throw new Error('Aucune session ouverte');
        dispatch('session.close', { sessionId: session.id, counted, entryId: newId() });
      },

      loadDemo() {
        const events = buildDemoEvents(dbRef.current, actor.current, newId().slice(0, 8), today());
        let next = dbRef.current;
        const kept: WorkspaceEvent[] = [];
        for (const ev of events) {
          try {
            next = applyEvent(next, ev);
            kept.push(ev);
          } catch {
            // Un événement refusé par les règles n'interrompt pas le chargement.
          }
        }
        commit(next);
        kept.forEach((ev) => listeners.current.forEach((l) => l(ev)));
        return kept.length;
      },

      saveProject(input) {
        const existing = input.id ? dbRef.current.projects.find((x) => x.id === input.id) : undefined;
        const project: Project = {
          ...input,
          id: existing?.id ?? input.id ?? newId(),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
        dispatch('project.save', { project });
        return project;
      },

      postMessage(input) {
        const message: Message = {
          ...input,
          id: newId(),
          authorId: input.authorId === undefined ? actor.current.id : input.authorId,
          authorName: input.authorName ?? actor.current.name,
          createdAt: new Date().toISOString(),
        };
        dispatch('message.post', { message });
        return message;
      },

      assignToProject(kind, id, projectId) {
        dispatch('project.assign', { kind, id, projectId });
      },

      resetAll() {
        dispatch('workspace.reset', {});
      },
    };
  }, [commit, dispatch]);

  const value = useMemo<StoreValue>(() => ({ ...actions, db }), [actions, db]);

  return (
    <ActionsContext.Provider value={actions}>
      <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider');
  return ctx;
}

export function useStoreActions(): StoreActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useStoreActions doit être utilisé dans StoreProvider');
  return ctx;
}

export function useDB(): DB {
  return useStore().db;
}
