import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { accountCode, buildChart } from './chart';
import type { AccountKey } from './chart';
import type {
  Account,
  Company,
  Customer,
  DB,
  Expense,
  JournalCode,
  JournalEntry,
  JournalLine,
  Minor,
  PaymentMethod,
  Product,
  Purchase,
  PurchaseLine,
  Sale,
  SaleLine,
  Supplier,
} from './types';

const STORAGE_KEY = 'finia.db.v1';
const USER = 'henri bayemi';

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function now(): string {
  return new Date().toISOString();
}

const DEFAULT_COMPANY: Company = {
  name: 'Mon entreprise',
  currency: 'XAF',
  country: '',
  city: '',
  sector: '',
  phone: '',
  chart: 'SYSCOHADA',
  vatEnabled: false,
  vatRateBp: 1925,
  fiscalYearStart: '01-01',
};

function emptyDB(): DB {
  return {
    company: DEFAULT_COMPANY,
    accounts: buildChart(DEFAULT_COMPANY.chart),
    entries: [],
    products: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    movements: [],
    debts: [],
    sessions: [],
    audit: [],
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as Partial<DB>;
    return { ...emptyDB(), ...parsed };
  } catch {
    return emptyDB();
  }
}

interface SaleInput {
  lines: SaleLine[];
  discount: Minor;
  method: PaymentMethod;
  customerId: string | null;
  customerName: string;
  paid: Minor;
  asQuote?: boolean;
}

interface PurchaseInput {
  lines: PurchaseLine[];
  supplierId: string | null;
  supplierName: string;
  paid: Minor;
}

interface ExpenseInput {
  date: string;
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
}

interface StoreValue {
  db: DB;
  setCompany: (patch: Partial<Company>) => void;
  code: (key: AccountKey) => string;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => void;
  saveCustomer: (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => Customer;
  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }) => Supplier;
  recordSale: (input: SaleInput) => Sale;
  confirmQuote: (saleId: string, method: PaymentMethod, paid: Minor) => void;
  recordPurchase: (input: PurchaseInput) => Purchase;
  receivePurchase: (purchaseId: string) => void;
  addExpense: (input: ExpenseInput) => void;
  adjustStock: (productId: string, qty: number, reason: string) => void;
  payDebt: (debtId: string, amount: Minor, method: PaymentMethod) => void;
  addManualEntry: (input: ManualEntryInput) => void;
  reverseEntry: (entryId: string) => void;
  openSession: (opening: Minor) => void;
  closeSession: (counted: Minor) => void;
  resetAll: () => void;
  loadDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const code = useCallback(
    (key: AccountKey) => accountCode(db.company.chart, key),
    [db.company.chart],
  );

  /** Applique une mutation en ajoutant systématiquement une trace d'audit. */
  const commit = useCallback(
    (
      mutate: (draft: DB) => { entity: string; entityId: string; action: string; summary: string },
    ) => {
      setDb((prev) => {
        const draft: DB = structuredClone(prev);
        const meta = mutate(draft);
        draft.audit = [
          {
            id: newId(),
            at: now(),
            user: USER,
            action: meta.action,
            entity: meta.entity,
            entityId: meta.entityId,
            summary: meta.summary,
          },
          ...draft.audit,
        ].slice(0, 2000);
        return draft;
      });
    },
    [],
  );

  const setCompany = useCallback(
    (patch: Partial<Company>) => {
      commit((draft) => {
        const before = draft.company;
        draft.company = { ...before, ...patch };
        if (patch.chart && patch.chart !== before.chart) {
          draft.accounts = mergeChart(draft.accounts, buildChart(patch.chart));
        }
        return {
          entity: 'company',
          entityId: 'company',
          action: 'UPDATE',
          summary: `Paramètres mis à jour (${Object.keys(patch).join(', ')})`,
        };
      });
    },
    [commit],
  );

  const value = useMemo<StoreValue>(() => {
    const chart = db.company.chart;
    const acc = (key: AccountKey) => accountCode(chart, key);

    const methodAccount = (method: PaymentMethod): string => {
      switch (method) {
        case 'CASH':
          return acc('CASH');
        case 'MOBILE':
          return acc('MOBILE_MONEY');
        case 'CARD':
        case 'BANK':
          return acc('BANK');
        case 'CREDIT':
          return acc('CUSTOMERS');
      }
    };

    const post = (
      draft: DB,
      entry: Omit<JournalEntry, 'id' | 'createdAt' | 'createdBy' | 'posted'>,
    ): JournalEntry => {
      const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const credit = entry.lines.reduce((s, l) => s + l.credit, 0);
      if (debit !== credit) {
        throw new Error(`Écriture déséquilibrée (${debit} ≠ ${credit}) : ${entry.label}`);
      }
      const full: JournalEntry = {
        ...entry,
        lines: entry.lines.filter((l) => l.debit !== 0 || l.credit !== 0),
        id: newId(),
        createdAt: now(),
        createdBy: USER,
        posted: true,
      };
      draft.entries.push(full);
      return full;
    };

    const nextNumber = (prefix: string, count: number) =>
      `${prefix}-${String(count + 1).padStart(5, '0')}`;

    const saleTotals = (lines: SaleLine[], discount: Minor) => {
      const gross = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
      const net = Math.max(0, gross - discount);
      const vat = db.company.vatEnabled ? Math.round((net * db.company.vatRateBp) / 10000) : 0;
      const cost = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
      return { gross, net, vat, total: net + vat, cost };
    };

    return {
      db,
      setCompany,
      code,

      saveProduct(input) {
        commit((draft) => {
          if (input.id) {
            const idx = draft.products.findIndex((p) => p.id === input.id);
            draft.products[idx] = { ...draft.products[idx], ...input } as Product;
            return {
              entity: 'product',
              entityId: input.id,
              action: 'UPDATE',
              summary: `Produit modifié : ${input.name}`,
            };
          }
          const product: Product = {
            ...input,
            id: newId(),
            createdAt: now(),
          } as Product;
          draft.products.push(product);
          if (product.stock > 0) {
            draft.movements.unshift({
              id: newId(),
              date: today(),
              productId: product.id,
              productName: product.name,
              type: 'IN',
              qty: product.stock,
              resulting: product.stock,
              reason: 'Stock initial',
              ref: 'INIT',
              by: USER,
            });
            const amount = product.stock * product.cost;
            if (amount > 0) {
              post(draft, {
                date: today(),
                journal: 'OD',
                ref: `INIT-${product.sku || product.id.slice(0, 5)}`,
                label: `Stock initial ${product.name}`,
                sourceType: 'product',
                sourceId: product.id,
                lines: [
                  { account: acc('INVENTORY'), label: 'Stock initial', debit: amount, credit: 0 },
                  { account: acc('CAPITAL'), label: 'Apport en nature', debit: 0, credit: amount },
                ],
              });
            }
          }
          return {
            entity: 'product',
            entityId: product.id,
            action: 'CREATE',
            summary: `Produit créé : ${product.name}`,
          };
        });
      },

      saveCustomer(input) {
        const customer: Customer = { ...input, id: input.id ?? newId(), createdAt: now() };
        commit((draft) => {
          const idx = draft.customers.findIndex((c) => c.id === customer.id);
          if (idx >= 0) draft.customers[idx] = customer;
          else draft.customers.push(customer);
          return {
            entity: 'customer',
            entityId: customer.id,
            action: idx >= 0 ? 'UPDATE' : 'CREATE',
            summary: `Client : ${customer.name}`,
          };
        });
        return customer;
      },

      saveSupplier(input) {
        const supplier: Supplier = { ...input, id: input.id ?? newId(), createdAt: now() };
        commit((draft) => {
          const idx = draft.suppliers.findIndex((s) => s.id === supplier.id);
          if (idx >= 0) draft.suppliers[idx] = supplier;
          else draft.suppliers.push(supplier);
          return {
            entity: 'supplier',
            entityId: supplier.id,
            action: idx >= 0 ? 'UPDATE' : 'CREATE',
            summary: `Fournisseur : ${supplier.name}`,
          };
        });
        return supplier;
      },

      recordSale(input) {
        const t = saleTotals(input.lines, input.discount);
        const sale: Sale = {
          id: newId(),
          number: nextNumber(input.asQuote ? 'DV' : 'FA', db.sales.length),
          date: today(),
          customerId: input.customerId,
          customerName: input.customerName || 'Client passager',
          lines: input.lines,
          discount: input.discount,
          vat: t.vat,
          total: t.total,
          paid: input.asQuote ? 0 : input.paid,
          method: input.method,
          status: input.asQuote ? 'QUOTE' : 'CONFIRMED',
          cashier: USER,
          createdAt: now(),
        };

        commit((draft) => {
          draft.sales.unshift(sale);
          if (!input.asQuote) applySaleSideEffects(draft, sale, t);
          return {
            entity: 'sale',
            entityId: sale.id,
            action: input.asQuote ? 'QUOTE' : 'CREATE',
            summary: `${input.asQuote ? 'Devis' : 'Vente'} ${sale.number} — ${sale.customerName}`,
          };
        });
        return sale;
      },

      confirmQuote(saleId, method, paid) {
        commit((draft) => {
          const sale = draft.sales.find((s) => s.id === saleId);
          if (!sale) throw new Error('Devis introuvable');
          sale.status = 'CONFIRMED';
          sale.method = method;
          sale.paid = paid;
          sale.number = nextNumber('FA', draft.sales.filter((s) => s.status === 'CONFIRMED').length);
          sale.date = today();
          const t = saleTotals(sale.lines, sale.discount);
          applySaleSideEffects(draft, sale, t);
          return {
            entity: 'sale',
            entityId: sale.id,
            action: 'CONFIRM',
            summary: `Devis converti en vente ${sale.number}`,
          };
        });
      },

      recordPurchase(input) {
        const total = input.lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
        const purchase: Purchase = {
          id: newId(),
          number: nextNumber('BC', db.purchases.length),
          date: today(),
          supplierId: input.supplierId,
          supplierName: input.supplierName || 'Fournisseur',
          lines: input.lines,
          total,
          paid: input.paid,
          status: 'PENDING',
          createdAt: now(),
        };
        commit((draft) => {
          draft.purchases.unshift(purchase);
          return {
            entity: 'purchase',
            entityId: purchase.id,
            action: 'CREATE',
            summary: `Bon de commande ${purchase.number} — ${purchase.supplierName}`,
          };
        });
        return purchase;
      },

      receivePurchase(purchaseId) {
        commit((draft) => {
          const purchase = draft.purchases.find((p) => p.id === purchaseId);
          if (!purchase) throw new Error('Achat introuvable');
          if (purchase.status === 'RECEIVED') throw new Error('Achat déjà réceptionné');
          purchase.status = 'RECEIVED';

          for (const line of purchase.lines) {
            const product = draft.products.find((p) => p.id === line.productId);
            if (!product) continue;
            const before = product.stock;
            const beforeValue = before * product.cost;
            product.stock = before + line.qty;
            // Prix moyen pondéré : le coût unitaire suit les réceptions successives.
            product.cost =
              product.stock > 0
                ? Math.round((beforeValue + line.qty * line.unitCost) / product.stock)
                : line.unitCost;
            draft.movements.unshift({
              id: newId(),
              date: today(),
              productId: product.id,
              productName: product.name,
              type: 'IN',
              qty: line.qty,
              resulting: product.stock,
              reason: 'Réception achat',
              ref: purchase.number,
              by: USER,
            });
          }

          const vat = draft.company.vatEnabled
            ? Math.round((purchase.total * draft.company.vatRateBp) / 10000)
            : 0;
          const ttc = purchase.total + vat;

          post(draft, {
            date: purchase.date,
            journal: 'AC',
            ref: purchase.number,
            label: `Achat ${purchase.supplierName}`,
            sourceType: 'purchase',
            sourceId: purchase.id,
            lines: [
              { account: acc('INVENTORY'), label: 'Entrée en stock', debit: purchase.total, credit: 0 },
              { account: acc('VAT_DEDUCTIBLE'), label: 'TVA déductible', debit: vat, credit: 0 },
              { account: acc('SUPPLIERS'), label: purchase.supplierName, debit: 0, credit: ttc },
            ],
          });

          if (purchase.paid > 0) {
            post(draft, {
              date: purchase.date,
              journal: 'CA',
              ref: `${purchase.number}-RGL`,
              label: `Règlement achat ${purchase.number}`,
              sourceType: 'purchase',
              sourceId: purchase.id,
              lines: [
                { account: acc('SUPPLIERS'), label: 'Règlement fournisseur', debit: purchase.paid, credit: 0 },
                { account: acc('CASH'), label: 'Sortie de caisse', debit: 0, credit: purchase.paid },
              ],
            });
          }

          const remaining = ttc - purchase.paid;
          if (remaining > 0) {
            draft.debts.unshift({
              id: newId(),
              party: 'SUPPLIER',
              partyId: purchase.supplierId,
              partyName: purchase.supplierName,
              origin: `Achat ${purchase.number}`,
              sourceId: purchase.id,
              date: purchase.date,
              amount: remaining,
              payments: [],
              createdAt: now(),
            });
          }

          return {
            entity: 'purchase',
            entityId: purchase.id,
            action: 'RECEIVE',
            summary: `Réception ${purchase.number} — stock et écritures mis à jour`,
          };
        });
      },

      addExpense(input) {
        commit((draft) => {
          const expense: Expense = {
            id: newId(),
            date: input.date,
            category: input.category,
            account: accountCode(draft.company.chart, input.accountKey),
            description: input.description,
            amount: input.amount,
            method: input.method,
            createdAt: now(),
          };
          draft.expenses.unshift(expense);
          post(draft, {
            date: expense.date,
            journal: 'CA',
            ref: `DEP-${expense.id.slice(0, 5).toUpperCase()}`,
            label: expense.description || expense.category,
            sourceType: 'expense',
            sourceId: expense.id,
            lines: [
              { account: expense.account, label: expense.category, debit: expense.amount, credit: 0 },
              { account: methodAccount(expense.method), label: 'Décaissement', debit: 0, credit: expense.amount },
            ],
          });
          return {
            entity: 'expense',
            entityId: expense.id,
            action: 'CREATE',
            summary: `Dépense ${expense.category} enregistrée`,
          };
        });
      },

      adjustStock(productId, qty, reason) {
        commit((draft) => {
          const product = draft.products.find((p) => p.id === productId);
          if (!product) throw new Error('Produit introuvable');
          const before = product.stock;
          product.stock = before + qty;
          draft.movements.unshift({
            id: newId(),
            date: today(),
            productId,
            productName: product.name,
            type: qty >= 0 ? 'IN' : 'OUT',
            qty: Math.abs(qty),
            resulting: product.stock,
            reason,
            ref: 'AJUST',
            by: USER,
          });
          const amount = Math.abs(qty) * product.cost;
          if (amount > 0) {
            const gain = qty > 0;
            post(draft, {
              date: today(),
              journal: 'OD',
              ref: `AJ-${product.sku || product.id.slice(0, 5)}`,
              label: `Ajustement stock ${product.name} — ${reason}`,
              sourceType: 'stock',
              sourceId: productId,
              lines: gain
                ? [
                    { account: acc('INVENTORY'), label: 'Entrée', debit: amount, credit: 0 },
                    { account: acc('INVENTORY_CHANGE'), label: reason, debit: 0, credit: amount },
                  ]
                : [
                    { account: acc('INVENTORY_CHANGE'), label: reason, debit: amount, credit: 0 },
                    { account: acc('INVENTORY'), label: 'Sortie', debit: 0, credit: amount },
                  ],
            });
          }
          return {
            entity: 'stock',
            entityId: productId,
            action: 'ADJUST',
            summary: `Ajustement ${qty > 0 ? '+' : ''}${qty} sur ${product.name} (${reason})`,
          };
        });
      },

      payDebt(debtId, amount, method) {
        commit((draft) => {
          const debt = draft.debts.find((d) => d.id === debtId);
          if (!debt) throw new Error('Dette introuvable');
          debt.payments.push({ id: newId(), date: today(), amount, method });
          const customerSide = debt.party === 'CUSTOMER';
          post(draft, {
            date: today(),
            journal: 'CA',
            ref: `RGL-${debt.id.slice(0, 5).toUpperCase()}`,
            label: `${customerSide ? 'Encaissement' : 'Règlement'} ${debt.partyName}`,
            sourceType: 'debt',
            sourceId: debt.id,
            lines: customerSide
              ? [
                  { account: methodAccount(method), label: 'Encaissement', debit: amount, credit: 0 },
                  { account: acc('CUSTOMERS'), label: debt.partyName, debit: 0, credit: amount },
                ]
              : [
                  { account: acc('SUPPLIERS'), label: debt.partyName, debit: amount, credit: 0 },
                  { account: methodAccount(method), label: 'Décaissement', debit: 0, credit: amount },
                ],
          });
          return {
            entity: 'debt',
            entityId: debt.id,
            action: 'PAYMENT',
            summary: `Règlement enregistré sur ${debt.partyName}`,
          };
        });
      },

      addManualEntry(input) {
        commit((draft) => {
          const entry = post(draft, {
            date: input.date,
            journal: input.journal,
            ref: `OD-${String(draft.entries.length + 1).padStart(4, '0')}`,
            label: input.label,
            lines: input.lines,
          });
          return {
            entity: 'entry',
            entityId: entry.id,
            action: 'CREATE',
            summary: `Écriture manuelle ${entry.ref} : ${entry.label}`,
          };
        });
      },

      reverseEntry(entryId) {
        commit((draft) => {
          const original = draft.entries.find((e) => e.id === entryId);
          if (!original) throw new Error('Écriture introuvable');
          if (original.reversedBy) throw new Error('Écriture déjà extournée');
          const reversal = post(draft, {
            date: today(),
            journal: original.journal,
            ref: `EXT-${original.ref}`,
            label: `Extourne de ${original.ref} — ${original.label}`,
            sourceType: original.sourceType,
            sourceId: original.sourceId,
            reverses: original.id,
            lines: original.lines.map((l) => ({
              account: l.account,
              label: l.label,
              debit: l.credit,
              credit: l.debit,
            })),
          });
          original.reversedBy = reversal.id;
          return {
            entity: 'entry',
            entityId: original.id,
            action: 'REVERSE',
            summary: `Écriture ${original.ref} extournée par ${reversal.ref}`,
          };
        });
      },

      openSession(opening) {
        commit((draft) => {
          if (draft.sessions.some((s) => !s.closedAt)) throw new Error('Une session est déjà ouverte');
          const session = {
            id: newId(),
            openedAt: now(),
            closedAt: null,
            cashier: USER,
            opening,
            expected: null,
            counted: null,
            variance: null,
          };
          draft.sessions.unshift(session);
          return {
            entity: 'session',
            entityId: session.id,
            action: 'OPEN',
            summary: 'Ouverture de session de caisse',
          };
        });
      },

      closeSession(counted) {
        commit((draft) => {
          const session = draft.sessions.find((s) => !s.closedAt);
          if (!session) throw new Error('Aucune session ouverte');
          const cashCode = accountCode(draft.company.chart, 'CASH');
          let movement = 0;
          for (const entry of draft.entries) {
            if (entry.createdAt < session.openedAt) continue;
            for (const line of entry.lines) {
              if (line.account === cashCode) movement += line.debit - line.credit;
            }
          }
          const expected = session.opening + movement;
          session.closedAt = now();
          session.expected = expected;
          session.counted = counted;
          session.variance = counted - expected;
          if (session.variance !== 0) {
            const short = session.variance < 0;
            const amount = Math.abs(session.variance);
            post(draft, {
              date: today(),
              journal: 'OD',
              ref: `CAISSE-${session.id.slice(0, 5).toUpperCase()}`,
              label: `Écart de caisse à la clôture (${short ? 'manquant' : 'excédent'})`,
              sourceType: 'session',
              sourceId: session.id,
              lines: short
                ? [
                    { account: accountCode(draft.company.chart, 'MISC_EXPENSE'), label: 'Écart de caisse', debit: amount, credit: 0 },
                    { account: cashCode, label: 'Manquant', debit: 0, credit: amount },
                  ]
                : [
                    { account: cashCode, label: 'Excédent', debit: amount, credit: 0 },
                    { account: accountCode(draft.company.chart, 'MISC_REVENUE'), label: 'Écart de caisse', debit: 0, credit: amount },
                  ],
            });
          }
          return {
            entity: 'session',
            entityId: session.id,
            action: 'CLOSE',
            summary: `Clôture de caisse — écart ${session.variance}`,
          };
        });
      },

      resetAll() {
        setDb(emptyDB());
      },

      loadDemo() {
        setDb((prev) => buildDemo(prev.company));
      },
    };

    function applySaleSideEffects(
      draft: DB,
      sale: Sale,
      t: { net: Minor; vat: Minor; total: Minor; cost: Minor },
    ) {
      for (const line of sale.lines) {
        const product = draft.products.find((p) => p.id === line.productId);
        if (!product) continue;
        product.stock -= line.qty;
        draft.movements.unshift({
          id: newId(),
          date: sale.date,
          productId: product.id,
          productName: product.name,
          type: 'OUT',
          qty: line.qty,
          resulting: product.stock,
          reason: 'Vente',
          ref: sale.number,
          by: USER,
        });
      }

      const unpaid = sale.total - sale.paid;
      post(draft, {
        date: sale.date,
        journal: 'VT',
        ref: sale.number,
        label: `Vente ${sale.customerName}`,
        sourceType: 'sale',
        sourceId: sale.id,
        lines: [
          { account: methodAccount(sale.method === 'CREDIT' ? 'CASH' : sale.method), label: 'Encaissement', debit: sale.paid, credit: 0 },
          { account: acc('CUSTOMERS'), label: sale.customerName, debit: unpaid, credit: 0 },
          { account: acc('SALES'), label: 'Chiffre d’affaires', debit: 0, credit: t.net },
          { account: acc('VAT_COLLECTED'), label: 'TVA collectée', debit: 0, credit: t.vat },
        ],
      });

      if (t.cost > 0) {
        post(draft, {
          date: sale.date,
          journal: 'OD',
          ref: `${sale.number}-CMV`,
          label: `Coût des marchandises vendues ${sale.number}`,
          sourceType: 'sale',
          sourceId: sale.id,
          lines: [
            { account: acc('INVENTORY_CHANGE'), label: 'Coût des ventes', debit: t.cost, credit: 0 },
            { account: acc('INVENTORY'), label: 'Sortie de stock', debit: 0, credit: t.cost },
          ],
        });
      }

      if (unpaid > 0) {
        draft.debts.unshift({
          id: newId(),
          party: 'CUSTOMER',
          partyId: sale.customerId,
          partyName: sale.customerName,
          origin: `Vente ${sale.number}`,
          sourceId: sale.id,
          date: sale.date,
          amount: unpaid,
          payments: [],
          createdAt: now(),
        });
      }
    }
  }, [db, commit, code, setCompany]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function mergeChart(existing: Account[], next: Account[]): Account[] {
  const custom = existing.filter((a) => !a.system);
  return [...next, ...custom];
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider');
  return ctx;
}

export function useDB(): DB {
  return useStore().db;
}

function buildDemo(company: Company): DB {
  const base = emptyDB();
  base.company = company;
  base.accounts = buildChart(company.chart);
  return base;
}
