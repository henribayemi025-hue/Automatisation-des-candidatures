import { accountCode, buildChart } from './chart';
import type { AccountKey } from './chart';
import type {
  Account,
  CashSession,
  Company,
  Customer,
  DB,
  Debt,
  Expense,
  JournalEntry,
  JournalLine,
  Minor,
  PaymentMethod,
  Product,
  Purchase,
  Sale,
  Supplier,
  WorkspaceEvent,
} from './types';

export const DEFAULT_COMPANY: Company = {
  name: 'Mon entreprise',
  currency: '',
  country: '',
  city: '',
  sector: '',
  phone: '',
  chart: 'SYSCOHADA',
  vatEnabled: false,
  vatRateBp: 0,
  taxLabel: 'TVA',
  fiscalYearStart: '01-01',
  mode: 'SIMPLE',
  onboarded: false,
  goals: [],
};

export function emptyDB(): DB {
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

/** Complète un état partiel (ancienne version, instantané cloud) avec les valeurs par défaut. */
export function normalizeDB(raw: Partial<DB> | null | undefined): DB {
  const base = emptyDB();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    company: { ...base.company, ...(raw.company ?? {}) },
    accounts: raw.accounts?.length ? raw.accounts : base.accounts,
  };
}

function methodAccount(chart: Company['chart'], method: PaymentMethod): string {
  switch (method) {
    case 'CASH':
      return accountCode(chart, 'CASH');
    case 'MOBILE':
      return accountCode(chart, 'MOBILE_MONEY');
    case 'CARD':
    case 'BANK':
      return accountCode(chart, 'BANK');
    case 'CREDIT':
      return accountCode(chart, 'CUSTOMERS');
  }
}

function post(
  db: DB,
  ev: WorkspaceEvent,
  entry: Omit<JournalEntry, 'createdAt' | 'createdBy' | 'posted'>,
): JournalEntry {
  const lines = entry.lines.filter((l) => l.debit !== 0 || l.credit !== 0);
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  if (debit !== credit) {
    throw new Error(`Écriture déséquilibrée (${debit} ≠ ${credit}) : ${entry.label}`);
  }
  const full: JournalEntry = {
    ...entry,
    lines,
    createdAt: ev.at,
    createdBy: ev.actorName,
    posted: true,
  };
  db.entries.push(full);
  return full;
}

function audit(db: DB, ev: WorkspaceEvent, entity: string, entityId: string, action: string, summary: string) {
  db.audit = [
    { id: ev.id, at: ev.at, user: ev.actorName || 'Inconnu', action, entity, entityId, summary },
    ...db.audit,
  ].slice(0, 3000);
}

/** Deux appareils hors ligne peuvent produire le même numéro : on suffixe le second. */
function uniqueNumber(existing: string[], wanted: string): string {
  let n = wanted;
  let i = 0;
  const suffixes = ['B', 'C', 'D', 'E', 'F'];
  while (existing.includes(n)) n = `${wanted}-${suffixes[i++] ?? i}`;
  return n;
}

export function saleTotals(company: Company, lines: Sale['lines'], discount: Minor) {
  const gross = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const net = Math.max(0, gross - discount);
  const vat = company.vatEnabled ? Math.round((net * company.vatRateBp) / 10000) : 0;
  const cost = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);
  return { gross, net, vat, total: net + vat, cost };
}

function applySale(
  db: DB,
  ev: WorkspaceEvent,
  sale: Sale,
  ids: { movements: string[]; saleEntry: string; cogsEntry: string; debt: string },
) {
  const chart = db.company.chart;
  const t = saleTotals(db.company, sale.lines, sale.discount);

  sale.lines.forEach((line, i) => {
    const product = db.products.find((p) => p.id === line.productId);
    if (!product) return;
    product.stock -= line.qty;
    db.movements.unshift({
      id: ids.movements[i] ?? `${sale.id}-m${i}`,
      date: sale.date,
      productId: product.id,
      productName: product.name,
      type: 'OUT',
      qty: line.qty,
      resulting: product.stock,
      reason: 'Vente',
      ref: sale.number,
      by: ev.actorName,
    });
  });

  const unpaid = sale.total - sale.paid;
  post(db, ev, {
    id: ids.saleEntry,
    date: sale.date,
    journal: 'VT',
    ref: sale.number,
    label: `Vente ${sale.customerName}`,
    sourceType: 'sale',
    sourceId: sale.id,
    lines: [
      { account: methodAccount(chart, sale.method === 'CREDIT' ? 'CASH' : sale.method), label: 'Encaissement', debit: sale.paid, credit: 0 },
      { account: accountCode(chart, 'CUSTOMERS'), label: sale.customerName, debit: unpaid, credit: 0 },
      { account: accountCode(chart, 'SALES'), label: "Chiffre d'affaires", debit: 0, credit: t.net },
      { account: accountCode(chart, 'VAT_COLLECTED'), label: 'TVA collectée', debit: 0, credit: t.vat },
    ],
  });

  if (t.cost > 0) {
    post(db, ev, {
      id: ids.cogsEntry,
      date: sale.date,
      journal: 'OD',
      ref: `${sale.number}-CMV`,
      label: `Coût des marchandises vendues ${sale.number}`,
      sourceType: 'sale',
      sourceId: sale.id,
      lines: [
        { account: accountCode(chart, 'INVENTORY_CHANGE'), label: 'Coût des ventes', debit: t.cost, credit: 0 },
        { account: accountCode(chart, 'INVENTORY'), label: 'Sortie de stock', debit: 0, credit: t.cost },
      ],
    });
  }

  if (unpaid > 0) {
    db.debts.unshift({
      id: ids.debt,
      party: 'CUSTOMER',
      partyId: sale.customerId,
      partyName: sale.customerName,
      origin: `Vente ${sale.number}`,
      sourceId: sale.id,
      date: sale.date,
      amount: unpaid,
      payments: [],
      createdAt: ev.at,
    });
  }
}

/**
 * Applique un événement à l'état. Pure et déterministe : tout identifiant,
 * numéro ou date vient de l'événement, jamais de l'horloge ni du hasard.
 * Retourne un nouvel état (l'ancien n'est jamais muté).
 */
export function applyEvent(prev: DB, ev: WorkspaceEvent): DB {
  const db: DB = structuredClone(prev);
  const p = ev.payload as Record<string, never>;
  const chart = db.company.chart;

  switch (ev.type) {
    case 'company.update': {
      const patch = p.patch as Partial<Company>;
      const before = db.company;
      db.company = { ...before, ...patch };
      if (patch.chart && patch.chart !== before.chart) {
        const custom = db.accounts.filter((a) => !a.system);
        db.accounts = [...buildChart(patch.chart), ...custom] as Account[];
      }
      audit(db, ev, 'company', 'company', 'UPDATE', `Paramètres mis à jour (${Object.keys(patch).join(', ')})`);
      break;
    }

    case 'product.save': {
      const product = p.product as Product;
      const idx = db.products.findIndex((x) => x.id === product.id);
      if (idx >= 0) {
        const stock = db.products[idx].stock;
        db.products[idx] = { ...db.products[idx], ...product, stock };
        audit(db, ev, 'product', product.id, 'UPDATE', `Produit modifié : ${product.name}`);
        break;
      }
      db.products.push(product);
      if (product.stock > 0) {
        db.movements.unshift({
          id: p.movementId as string,
          date: ev.at.slice(0, 10),
          productId: product.id,
          productName: product.name,
          type: 'IN',
          qty: product.stock,
          resulting: product.stock,
          reason: 'Stock initial',
          ref: 'INIT',
          by: ev.actorName,
        });
        const amount = product.stock * product.cost;
        if (amount > 0) {
          post(db, ev, {
            id: p.entryId as string,
            date: ev.at.slice(0, 10),
            journal: 'OD',
            ref: `INIT-${product.sku || product.id.slice(0, 5).toUpperCase()}`,
            label: `Stock initial ${product.name}`,
            sourceType: 'product',
            sourceId: product.id,
            lines: [
              { account: accountCode(chart, 'INVENTORY'), label: 'Stock initial', debit: amount, credit: 0 },
              { account: accountCode(chart, 'CAPITAL'), label: 'Apport en nature', debit: 0, credit: amount },
            ],
          });
        }
      }
      audit(db, ev, 'product', product.id, 'CREATE', `Produit créé : ${product.name}`);
      break;
    }

    case 'product.archive': {
      const product = db.products.find((x) => x.id === p.productId);
      if (product) {
        product.archived = true;
        audit(db, ev, 'product', product.id, 'ARCHIVE', `Produit archivé : ${product.name}`);
      }
      break;
    }

    case 'customer.save': {
      const c = p.customer as Customer;
      const idx = db.customers.findIndex((x) => x.id === c.id);
      if (idx >= 0) db.customers[idx] = c;
      else db.customers.push(c);
      audit(db, ev, 'customer', c.id, idx >= 0 ? 'UPDATE' : 'CREATE', `Client : ${c.name}`);
      break;
    }

    case 'supplier.save': {
      const s = p.supplier as Supplier;
      const idx = db.suppliers.findIndex((x) => x.id === s.id);
      if (idx >= 0) db.suppliers[idx] = s;
      else db.suppliers.push(s);
      audit(db, ev, 'supplier', s.id, idx >= 0 ? 'UPDATE' : 'CREATE', `Fournisseur : ${s.name}`);
      break;
    }

    case 'sale.record': {
      const sale = structuredClone(p.sale as Sale);
      sale.number = uniqueNumber(db.sales.map((s) => s.number), sale.number);
      db.sales.unshift(sale);
      if (sale.status === 'CONFIRMED') applySale(db, ev, sale, p.ids as never);
      audit(
        db, ev, 'sale', sale.id,
        sale.status === 'QUOTE' ? 'QUOTE' : 'CREATE',
        `${sale.status === 'QUOTE' ? 'Devis' : 'Vente'} ${sale.number} — ${sale.customerName}`,
      );
      break;
    }

    case 'quote.confirm': {
      const sale = db.sales.find((s) => s.id === p.saleId);
      if (!sale || sale.status !== 'QUOTE') break;
      sale.status = 'CONFIRMED';
      sale.method = p.method as PaymentMethod;
      sale.paid = p.paid as Minor;
      sale.number = uniqueNumber(db.sales.map((s) => s.number), p.number as string);
      sale.date = p.date as string;
      applySale(db, ev, sale, p.ids as never);
      audit(db, ev, 'sale', sale.id, 'CONFIRM', `Devis converti en vente ${sale.number}`);
      break;
    }

    case 'purchase.record': {
      const purchase = structuredClone(p.purchase as Purchase);
      purchase.number = uniqueNumber(db.purchases.map((x) => x.number), purchase.number);
      db.purchases.unshift(purchase);
      audit(db, ev, 'purchase', purchase.id, 'CREATE', `Bon de commande ${purchase.number} — ${purchase.supplierName}`);
      break;
    }

    case 'purchase.receive': {
      const purchase = db.purchases.find((x) => x.id === p.purchaseId);
      if (!purchase || purchase.status !== 'PENDING') break;
      purchase.status = 'RECEIVED';
      const ids = p.ids as { movements: string[]; entry: string; payment: string; debt: string };
      const date = p.date as string;

      purchase.lines.forEach((line, i) => {
        const product = db.products.find((x) => x.id === line.productId);
        if (!product) return;
        const before = product.stock;
        const beforeValue = Math.max(0, before) * product.cost;
        product.stock = before + line.qty;
        // Prix moyen pondéré : le coût unitaire suit les réceptions successives.
        product.cost =
          product.stock > 0
            ? Math.round((beforeValue + line.qty * line.unitCost) / product.stock)
            : line.unitCost;
        db.movements.unshift({
          id: ids.movements[i] ?? `${purchase.id}-m${i}`,
          date,
          productId: product.id,
          productName: product.name,
          type: 'IN',
          qty: line.qty,
          resulting: product.stock,
          reason: 'Réception achat',
          ref: purchase.number,
          by: ev.actorName,
        });
      });

      const vat = db.company.vatEnabled ? Math.round((purchase.total * db.company.vatRateBp) / 10000) : 0;
      const ttc = purchase.total + vat;

      post(db, ev, {
        id: ids.entry,
        date,
        journal: 'AC',
        ref: purchase.number,
        label: `Achat ${purchase.supplierName}`,
        sourceType: 'purchase',
        sourceId: purchase.id,
        lines: [
          { account: accountCode(chart, 'INVENTORY'), label: 'Entrée en stock', debit: purchase.total, credit: 0 },
          { account: accountCode(chart, 'VAT_DEDUCTIBLE'), label: 'TVA déductible', debit: vat, credit: 0 },
          { account: accountCode(chart, 'SUPPLIERS'), label: purchase.supplierName, debit: 0, credit: ttc },
        ],
      });

      if (purchase.paid > 0) {
        post(db, ev, {
          id: ids.payment,
          date,
          journal: 'CA',
          ref: `${purchase.number}-RGL`,
          label: `Règlement achat ${purchase.number}`,
          sourceType: 'purchase',
          sourceId: purchase.id,
          lines: [
            { account: accountCode(chart, 'SUPPLIERS'), label: 'Règlement fournisseur', debit: purchase.paid, credit: 0 },
            { account: accountCode(chart, 'CASH'), label: 'Sortie de caisse', debit: 0, credit: purchase.paid },
          ],
        });
      }

      const remaining = ttc - purchase.paid;
      if (remaining > 0) {
        db.debts.unshift({
          id: ids.debt,
          party: 'SUPPLIER',
          partyId: purchase.supplierId,
          partyName: purchase.supplierName,
          origin: `Achat ${purchase.number}`,
          sourceId: purchase.id,
          date,
          amount: remaining,
          payments: [],
          createdAt: ev.at,
        });
      }
      audit(db, ev, 'purchase', purchase.id, 'RECEIVE', `Réception ${purchase.number} — stock et écritures mis à jour`);
      break;
    }

    case 'expense.add': {
      const expense = p.expense as Expense;
      db.expenses.unshift(expense);
      post(db, ev, {
        id: p.entryId as string,
        date: expense.date,
        journal: 'CA',
        ref: `DEP-${expense.id.slice(0, 5).toUpperCase()}`,
        label: expense.description || expense.category,
        sourceType: 'expense',
        sourceId: expense.id,
        lines: [
          { account: expense.account, label: expense.category, debit: expense.amount, credit: 0 },
          { account: methodAccount(chart, expense.method), label: 'Décaissement', debit: 0, credit: expense.amount },
        ],
      });
      audit(db, ev, 'expense', expense.id, 'CREATE', `Dépense ${expense.category} enregistrée`);
      break;
    }

    case 'stock.adjust': {
      const product = db.products.find((x) => x.id === p.productId);
      if (!product) break;
      const qty = p.qty as number;
      const reason = p.reason as string;
      const date = p.date as string;
      product.stock += qty;
      db.movements.unshift({
        id: p.movementId as string,
        date,
        productId: product.id,
        productName: product.name,
        type: qty >= 0 ? 'IN' : 'OUT',
        qty: Math.abs(qty),
        resulting: product.stock,
        reason,
        ref: 'AJUST',
        by: ev.actorName,
      });
      const amount = Math.abs(qty) * product.cost;
      if (amount > 0) {
        const gain = qty > 0;
        post(db, ev, {
          id: p.entryId as string,
          date,
          journal: 'OD',
          ref: `AJ-${product.sku || product.id.slice(0, 5).toUpperCase()}`,
          label: `Ajustement stock ${product.name} — ${reason}`,
          sourceType: 'stock',
          sourceId: product.id,
          lines: gain
            ? [
                { account: accountCode(chart, 'INVENTORY'), label: 'Entrée', debit: amount, credit: 0 },
                { account: accountCode(chart, 'INVENTORY_CHANGE'), label: reason, debit: 0, credit: amount },
              ]
            : [
                { account: accountCode(chart, 'INVENTORY_CHANGE'), label: reason, debit: amount, credit: 0 },
                { account: accountCode(chart, 'INVENTORY'), label: 'Sortie', debit: 0, credit: amount },
              ],
        });
      }
      audit(db, ev, 'stock', product.id, 'ADJUST', `Ajustement ${qty > 0 ? '+' : ''}${qty} sur ${product.name} (${reason})`);
      break;
    }

    case 'debt.pay': {
      const debt = db.debts.find((d) => d.id === p.debtId);
      if (!debt) break;
      const payment = p.payment as Debt['payments'][number];
      debt.payments.push(payment);
      const customerSide = debt.party === 'CUSTOMER';
      post(db, ev, {
        id: p.entryId as string,
        date: payment.date,
        journal: 'CA',
        ref: `RGL-${payment.id.slice(0, 5).toUpperCase()}`,
        label: `${customerSide ? 'Encaissement' : 'Règlement'} ${debt.partyName}`,
        sourceType: 'debt',
        sourceId: debt.id,
        lines: customerSide
          ? [
              { account: methodAccount(chart, payment.method), label: 'Encaissement', debit: payment.amount, credit: 0 },
              { account: accountCode(chart, 'CUSTOMERS'), label: debt.partyName, debit: 0, credit: payment.amount },
            ]
          : [
              { account: accountCode(chart, 'SUPPLIERS'), label: debt.partyName, debit: payment.amount, credit: 0 },
              { account: methodAccount(chart, payment.method), label: 'Décaissement', debit: 0, credit: payment.amount },
            ],
      });
      audit(db, ev, 'debt', debt.id, 'PAYMENT', `Règlement enregistré sur ${debt.partyName}`);
      break;
    }

    case 'entry.manual': {
      const entry = post(db, ev, {
        id: p.entryId as string,
        date: p.date as string,
        journal: p.journal as JournalEntry['journal'],
        ref: p.ref as string,
        label: p.label as string,
        lines: p.lines as JournalLine[],
      });
      audit(db, ev, 'entry', entry.id, 'CREATE', `Écriture manuelle ${entry.ref} : ${entry.label}`);
      break;
    }

    case 'entry.reverse': {
      const original = db.entries.find((e) => e.id === p.entryId);
      if (!original || original.reversedBy) break;
      const reversal = post(db, ev, {
        id: p.reversalId as string,
        date: p.date as string,
        journal: original.journal,
        ref: `EXT-${original.ref}`,
        label: `Extourne de ${original.ref} — ${original.label}`,
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        reverses: original.id,
        lines: original.lines.map((l) => ({ account: l.account, label: l.label, debit: l.credit, credit: l.debit })),
      });
      original.reversedBy = reversal.id;
      audit(db, ev, 'entry', original.id, 'REVERSE', `Écriture ${original.ref} extournée par ${reversal.ref}`);
      break;
    }

    case 'session.open': {
      if (db.sessions.some((s) => !s.closedAt)) break;
      const session = p.session as CashSession;
      db.sessions.unshift(session);
      audit(db, ev, 'session', session.id, 'OPEN', 'Ouverture de session de caisse');
      break;
    }

    case 'session.close': {
      const session = db.sessions.find((s) => s.id === p.sessionId && !s.closedAt);
      if (!session) break;
      const cashCode = accountCode(chart, 'CASH');
      let movement = 0;
      for (const entry of db.entries) {
        if (entry.createdAt < session.openedAt) continue;
        for (const line of entry.lines) if (line.account === cashCode) movement += line.debit - line.credit;
      }
      const expected = session.opening + movement;
      const counted = p.counted as Minor;
      session.closedAt = ev.at;
      session.expected = expected;
      session.counted = counted;
      session.variance = counted - expected;
      if (session.variance !== 0) {
        const short = session.variance < 0;
        const amount = Math.abs(session.variance);
        post(db, ev, {
          id: p.entryId as string,
          date: ev.at.slice(0, 10),
          journal: 'OD',
          ref: `CAISSE-${session.id.slice(0, 5).toUpperCase()}`,
          label: `Écart de caisse à la clôture (${short ? 'manquant' : 'excédent'})`,
          sourceType: 'session',
          sourceId: session.id,
          lines: short
            ? [
                { account: accountCode(chart, 'MISC_EXPENSE'), label: 'Écart de caisse', debit: amount, credit: 0 },
                { account: cashCode, label: 'Manquant', debit: 0, credit: amount },
              ]
            : [
                { account: cashCode, label: 'Excédent', debit: amount, credit: 0 },
                { account: accountCode(chart, 'MISC_REVENUE'), label: 'Écart de caisse', debit: 0, credit: amount },
              ],
        });
      }
      audit(db, ev, 'session', session.id, 'CLOSE', `Clôture de caisse — écart ${session.variance}`);
      break;
    }

    case 'workspace.reset': {
      const fresh = emptyDB();
      fresh.company = { ...db.company };
      fresh.accounts = buildChart(db.company.chart);
      audit(fresh, ev, 'workspace', 'workspace', 'RESET', 'Espace de travail réinitialisé');
      return fresh;
    }

    default:
      // Événement d'une version plus récente : ignoré, l'état reste cohérent.
      break;
  }
  return db;
}

export function replay(base: DB, events: WorkspaceEvent[]): DB {
  let db = base;
  for (const ev of events) {
    try {
      db = applyEvent(db, ev);
    } catch {
      // Un événement corrompu ne doit jamais bloquer le chargement de l'espace.
    }
  }
  return db;
}

export type { AccountKey };
