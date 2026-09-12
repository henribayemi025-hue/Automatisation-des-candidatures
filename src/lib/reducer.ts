import { accountCode, buildChart } from './chart';
import { tracksStock } from './sector';
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
  Project,
  Message,
  FixedAsset,
  FiscalClosing,
  Employee,
  Attendance,
  StaffAdvance,
  PayrollRun,
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
  pricesIncludeTax: true,
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
    projects: [],
    messages: [],
    employees: [],
    attendance: [],
    advances: [],
    payrolls: [],
    assets: [],
    depreciations: [],
    reconciliations: [],
    closings: [],
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
    // Ajouté après coup : un instantané ancien n'a pas de projets.
    projects: raw.projects ?? [],
    messages: raw.messages ?? [],
    employees: raw.employees ?? [],
    attendance: raw.attendance ?? [],
    advances: raw.advances ?? [],
    payrolls: raw.payrolls ?? [],
    assets: raw.assets ?? [],
    depreciations: raw.depreciations ?? [],
    reconciliations: raw.reconciliations ?? [],
    closings: raw.closings ?? [],
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

/**
 * Ce qu'une fiche client ou fournisseur laisse derrière elle. Tant que ce
 * n'est pas vide, on archive : effacer viderait le nom d'une facture déjà
 * émise et ferait mentir l'historique.
 */
export function partyUsage(db: DB, partyId: string) {
  const sales = db.sales.filter((s) => s.customerId === partyId).length;
  const purchases = db.purchases.filter((x) => x.supplierId === partyId).length;
  const debts = db.debts.filter((d) => d.partyId === partyId);
  const open = debts.reduce(
    (sum, d) => sum + Math.max(0, d.amount - d.payments.reduce((s2, x) => s2 + x.amount, 0)),
    0,
  );
  return { sales, purchases, debts: debts.length, open, total: sales + purchases + debts.length };
}

/** Deux appareils hors ligne peuvent produire le même numéro : on suffixe le second. */
function uniqueNumber(existing: string[], wanted: string): string {
  let n = wanted;
  let i = 0;
  const suffixes = ['B', 'C', 'D', 'E', 'F'];
  while (existing.includes(n)) n = `${wanted}-${suffixes[i++] ?? i}`;
  return n;
}

/**
 * Totaux d'une vente. Si les prix incluent la taxe (étiquette = ce que le
 * client paie), la taxe est extraite du montant ; sinon elle s'ajoute.
 * `net` est toujours le chiffre d'affaires hors taxe, `total` ce qui est encaissé.
 */
export function saleTotals(company: Company, lines: Sale['lines'], discount: Minor) {
  const gross = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const afterDiscount = Math.max(0, gross - discount);
  const rate = company.vatEnabled ? company.vatRateBp : 0;
  const included = company.pricesIncludeTax !== false;
  const vat = rate === 0 ? 0 : included ? afterDiscount - Math.round((afterDiscount * 10000) / (10000 + rate)) : Math.round((afterDiscount * rate) / 10000);
  const net = included ? afterDiscount - vat : afterDiscount;
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
  // Un métier qui vend du temps (salon, artisan) n'a rien à sortir d'un stock :
  // ni mouvement, ni coût des marchandises vendues. Sinon chaque prestation
  // creuserait un stock négatif et un compte de stock faux au bilan.
  const stocked = tracksStock(db.company);

  sale.lines.forEach((line, i) => {
    const product = db.products.find((p) => p.id === line.productId);
    if (!product || !stocked) return;
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

  if (t.cost > 0 && stocked) {
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

    case 'customer.archive': {
      const c = db.customers.find((x) => x.id === p.customerId);
      if (c) {
        c.archived = p.archived !== false;
        audit(db, ev, 'customer', c.id, c.archived ? 'ARCHIVE' : 'RESTORE', `Client ${c.archived ? 'archivé' : 'réactivé'} : ${c.name}`);
      }
      break;
    }

    case 'customer.remove': {
      const c = db.customers.find((x) => x.id === p.customerId);
      if (!c) break;
      // Effacer n'est possible que si la fiche n'a servi à rien : sinon une vente
      // se retrouverait sans client et la piste d'audit serait cassée.
      if (partyUsage(db, c.id).total > 0) {
        c.archived = true;
        audit(db, ev, 'customer', c.id, 'ARCHIVE', `Client archivé (opérations existantes) : ${c.name}`);
        break;
      }
      db.customers = db.customers.filter((x) => x.id !== c.id);
      audit(db, ev, 'customer', c.id, 'DELETE', `Client supprimé : ${c.name}`);
      break;
    }

    case 'supplier.archive': {
      const f = db.suppliers.find((x) => x.id === p.supplierId);
      if (f) {
        f.archived = p.archived !== false;
        audit(db, ev, 'supplier', f.id, f.archived ? 'ARCHIVE' : 'RESTORE', `Fournisseur ${f.archived ? 'archivé' : 'réactivé'} : ${f.name}`);
      }
      break;
    }

    case 'supplier.remove': {
      const f = db.suppliers.find((x) => x.id === p.supplierId);
      if (!f) break;
      if (partyUsage(db, f.id).total > 0) {
        f.archived = true;
        audit(db, ev, 'supplier', f.id, 'ARCHIVE', `Fournisseur archivé (opérations existantes) : ${f.name}`);
        break;
      }
      db.suppliers = db.suppliers.filter((x) => x.id !== f.id);
      audit(db, ev, 'supplier', f.id, 'DELETE', `Fournisseur supprimé : ${f.name}`);
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

      // Le coût saisi peut inclure la taxe ; le stock, lui, se valorise hors taxe,
      // sinon la marge et le compte de stock ne diraient pas la même chose.
      // Une facture étrangère ne porte pas de TVA locale : la taxe arrive à la
      // douane, séparément (importVat). Sinon on déduirait une TVA jamais payée.
      const rate = db.company.vatEnabled && !purchase.foreign ? db.company.vatRateBp : 0;
      const included = db.company.pricesIncludeTax !== false;
      const netOf = (amount: Minor) => (rate === 0 || !included ? amount : Math.round((amount * 10000) / (10000 + rate)));

      // Frais d'approche (douane, fret, transit…) : ils font partie du coût de
      // la marchandise, pas des charges du mois. On les répartit sur les lignes
      // au prorata de leur valeur, pour que chaque article porte sa part.
      const landed = (purchase.landed ?? []).reduce((s, c) => s + c.amount, 0);
      const goodsNet = purchase.lines.reduce((s, l) => s + netOf(l.unitCost) * l.qty, 0);
      const landedShare = (lineNet: Minor) => (landed === 0 || goodsNet === 0 ? 0 : Math.round((landed * lineNet) / goodsNet));

      purchase.lines.forEach((line, i) => {
        const product = db.products.find((x) => x.id === line.productId);
        if (!product) return;
        const lineNet = netOf(line.unitCost) * line.qty;
        const unitNet = line.qty > 0 ? Math.round((lineNet + landedShare(lineNet)) / line.qty) : netOf(line.unitCost);
        const before = product.stock;
        const beforeValue = Math.max(0, before) * product.cost;
        product.stock = before + line.qty;
        // Prix moyen pondéré : le coût unitaire suit les réceptions successives.
        product.cost =
          product.stock > 0
            ? Math.round((beforeValue + line.qty * unitNet) / product.stock)
            : unitNet;
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

      // Même règle pour le total : la taxe est extraite ou ajoutée.
      const goods = purchase.lines.reduce((sum, l) => sum + netOf(l.unitCost) * l.qty, 0);
      const vat = rate === 0 ? 0 : included ? purchase.total - goods : Math.round((purchase.total * rate) / 10000);
      const ttc = goods + vat;
      const importVat = purchase.importVat ?? 0;

      // Le stock entre au coût rendu magasin (marchandise + frais d'approche).
      // Le fournisseur n'est dû que de sa facture ; la douane, le fret et la
      // TVA d'importation ont été payés à part, à la réception — on ne libère
      // pas un conteneur sans régler la douane.
      const entryLines: JournalLine[] = [
        { account: accountCode(chart, 'INVENTORY'), label: 'Entrée en stock', debit: goods + landed, credit: 0 },
        { account: accountCode(chart, 'VAT_DEDUCTIBLE'), label: 'TVA déductible', debit: vat + importVat, credit: 0 },
        { account: accountCode(chart, 'SUPPLIERS'), label: purchase.supplierName, debit: 0, credit: ttc },
      ];
      if (landed + importVat > 0) {
        entryLines.push({
          account: methodAccount(chart, purchase.landedPaidWith ?? 'BANK'),
          label: 'Douane, fret, transit',
          debit: 0,
          credit: landed + importVat,
        });
      }
      post(db, ev, {
        id: ids.entry,
        date,
        journal: 'AC',
        ref: purchase.number,
        label: purchase.foreign
          ? `Achat ${purchase.supplierName} (${purchase.foreign.currency})`
          : `Achat ${purchase.supplierName}`,
        sourceType: 'purchase',
        sourceId: purchase.id,
        lines: entryLines,
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

    case 'employee.save': {
      const employee = p.employee as Employee;
      const idx = db.employees.findIndex((e) => e.id === employee.id);
      if (idx >= 0) db.employees[idx] = { ...db.employees[idx], ...employee };
      else db.employees.push(employee);
      audit(db, ev, 'employee', employee.id, idx >= 0 ? 'UPDATE' : 'CREATE', `Personnel : ${employee.name}`);
      break;
    }

    case 'employee.archive': {
      const employee = db.employees.find((e) => e.id === p.employeeId);
      if (!employee) break;
      employee.archived = p.archived !== false;
      audit(
        db,
        ev,
        'employee',
        employee.id,
        employee.archived ? 'ARCHIVE' : 'RESTORE',
        `${employee.name} ${employee.archived ? 'retiré du personnel' : 'réintégré'}`,
      );
      break;
    }

    case 'attendance.mark': {
      const employeeId = p.employeeId as string;
      const date = p.date as string;
      // Une seule ligne par personne et par jour : repointer corrige.
      const idx = db.attendance.findIndex((a) => a.employeeId === employeeId && a.date === date);
      const row = {
        id: (p.attendanceId as string) ?? `${employeeId}-${date}`,
        employeeId,
        date,
        status: p.status as Attendance['status'],
        hours: (p.hours as number) ?? 0,
        note: (p.note as string) ?? '',
        createdAt: ev.at,
      };
      if (idx >= 0) db.attendance[idx] = { ...db.attendance[idx], ...row, id: db.attendance[idx].id };
      else db.attendance.push(row);
      break;
    }

    case 'staff.advance': {
      const advance = p.advance as StaffAdvance;
      if (db.advances.some((a) => a.id === advance.id)) break;
      const employee = db.employees.find((e) => e.id === advance.employeeId);
      db.advances.push(advance);
      post(db, ev, {
        id: advance.entryId,
        date: advance.date,
        journal: 'OD',
        ref: `AV-${db.advances.length}`,
        label: `Avance sur salaire — ${employee?.name ?? 'Personnel'}`,
        sourceType: 'advance',
        sourceId: advance.id,
        lines: [
          { account: accountCode(chart, 'STAFF_ADVANCE'), label: employee?.name ?? 'Personnel', debit: advance.amount, credit: 0 },
          { account: methodAccount(chart, advance.method), label: 'Décaissement', debit: 0, credit: advance.amount },
        ],
      });
      audit(db, ev, 'employee', advance.employeeId, 'ADVANCE', `Avance versée à ${employee?.name ?? 'un salarié'}`);
      break;
    }

    case 'payroll.run': {
      const run = p.run as PayrollRun;
      if (db.payrolls.some((r) => r.id === run.id)) break;
      if (!run.slips.length || run.gross <= 0) break;

      // La charge est le brut : c'est ce que le travail a coûté. Les avances
      // ne sont pas une charge de plus, elles soldent une créance déjà là.
      const lines: JournalLine[] = [
        { account: accountCode(chart, 'PAYROLL'), label: `Salaires ${run.period}`, debit: run.gross, credit: 0 },
      ];
      if (run.advances > 0) {
        lines.push({ account: accountCode(chart, 'STAFF_ADVANCE'), label: 'Avances retenues', debit: 0, credit: run.advances });
      }
      if (run.net > 0) {
        lines.push(
          run.paid
            ? { account: methodAccount(chart, run.method), label: 'Net versé', debit: 0, credit: run.net }
            : { account: accountCode(chart, 'STAFF_PAYABLE'), label: 'Net restant dû', debit: 0, credit: run.net },
        );
      }
      post(db, ev, {
        id: run.entryId,
        date: run.date,
        journal: 'OD',
        ref: `PAIE-${run.period}`,
        label: `Paie ${run.period}`,
        sourceType: 'payroll',
        sourceId: run.id,
        lines,
      });
      db.payrolls.unshift(run);
      audit(db, ev, 'payroll', run.id, 'CREATE', `Paie ${run.period} — ${run.slips.length} personne(s), brut ${run.gross}`);
      break;
    }

    case 'payroll.settle': {
      const run = db.payrolls.find((r) => r.id === p.runId);
      if (!run || run.paid || run.net <= 0) break;
      const method = (p.method as PaymentMethod) ?? run.method;
      run.paid = true;
      run.method = method;
      post(db, ev, {
        id: p.entryId as string,
        date: p.date as string,
        journal: 'OD',
        ref: `PAIE-${run.period}-R`,
        label: `Versement des salaires ${run.period}`,
        sourceType: 'payroll',
        sourceId: run.id,
        lines: [
          { account: accountCode(chart, 'STAFF_PAYABLE'), label: 'Salaires dus', debit: run.net, credit: 0 },
          { account: methodAccount(chart, method), label: 'Net versé', debit: 0, credit: run.net },
        ],
      });
      audit(db, ev, 'payroll', run.id, 'PAYMENT', `Salaires ${run.period} versés`);
      break;
    }

    case 'asset.save': {
      const asset = p.asset as FixedAsset;
      const idx = db.assets.findIndex((a) => a.id === asset.id);
      const isNew = idx < 0;
      if (isNew) db.assets.push(asset);
      else db.assets[idx] = { ...db.assets[idx], ...asset };

      // Un bien acheté depuis l'application est déjà au bilan par l'écriture
      // d'achat. Ce n'est que quand on le déclare à part qu'il faut l'y mettre.
      if (isNew && p.entryId && p.paidWith) {
        post(db, ev, {
          id: p.entryId as string,
          date: asset.acquiredOn,
          journal: 'OD',
          ref: `IMMO-${db.assets.length}`,
          label: `Acquisition — ${asset.name}`,
          sourceType: 'asset',
          sourceId: asset.id,
          lines: [
            { account: accountCode(chart, 'EQUIPMENT'), label: asset.name, debit: asset.cost, credit: 0 },
            { account: methodAccount(chart, p.paidWith as PaymentMethod), label: 'Règlement', debit: 0, credit: asset.cost },
          ],
        });
      }
      audit(db, ev, 'asset', asset.id, isNew ? 'CREATE' : 'UPDATE', `Immobilisation : ${asset.name}`);
      break;
    }

    case 'asset.dispose': {
      const asset = db.assets.find((a) => a.id === p.assetId);
      if (!asset || asset.status === 'DISPOSED') break;
      const date = p.date as string;
      const proceeds = (p.proceeds as Minor) ?? 0;
      const posted = db.depreciations.filter((d) => d.assetId === asset.id).reduce((s, d) => s + d.amount, 0);
      const book = asset.cost - posted; // valeur nette comptable restante
      asset.status = 'DISPOSED';
      asset.disposedOn = date;

      // Sortie du bien : on efface sa valeur d'origine et ses amortissements,
      // on encaisse le prix de vente, et l'écart passe en perte ou en gain.
      const lines: JournalLine[] = [];
      if (posted > 0) lines.push({ account: accountCode(chart, 'DEPRECIATION'), label: 'Amortissements repris', debit: posted, credit: 0 });
      if (proceeds > 0) lines.push({ account: methodAccount(chart, (p.method as PaymentMethod) ?? 'CASH'), label: 'Prix de cession', debit: proceeds, credit: 0 });
      const loss = book - proceeds;
      if (loss > 0) lines.push({ account: accountCode(chart, 'MISC_EXPENSE'), label: 'Valeur nette du bien cédé', debit: loss, credit: 0 });
      if (loss < 0) lines.push({ account: accountCode(chart, 'MISC_REVENUE'), label: 'Produit de cession', debit: 0, credit: -loss });
      lines.push({ account: accountCode(chart, 'EQUIPMENT'), label: asset.name, debit: 0, credit: asset.cost });

      post(db, ev, {
        id: p.entryId as string,
        date,
        journal: 'OD',
        ref: `CESS-${asset.id.slice(0, 6)}`,
        label: `Sortie — ${asset.name}`,
        sourceType: 'asset',
        sourceId: asset.id,
        lines,
      });
      audit(db, ev, 'asset', asset.id, 'DISPOSE', `Immobilisation sortie : ${asset.name}`);
      break;
    }

    case 'depreciation.run': {
      const period = p.period as string;
      const items = p.items as { id: string; assetId: string; amount: Minor }[];
      const kept = items.filter(
        (i) => i.amount > 0 && !db.depreciations.some((d) => d.assetId === i.assetId && d.period === period),
      );
      if (!kept.length) break;
      const total = kept.reduce((s, i) => s + i.amount, 0);
      const lines: JournalLine[] = kept.map((i) => ({
        account: accountCode(chart, 'DEPRECIATION_EXPENSE'),
        label: db.assets.find((a) => a.id === i.assetId)?.name ?? 'Immobilisation',
        debit: i.amount,
        credit: 0,
      }));
      lines.push({ account: accountCode(chart, 'DEPRECIATION'), label: `Dotation ${period}`, debit: 0, credit: total });
      const entry = post(db, ev, {
        id: p.entryId as string,
        date: p.date as string,
        journal: 'OD',
        ref: `DOT-${period}`,
        label: `Dotation aux amortissements — ${period}`,
        sourceType: 'depreciation',
        sourceId: period,
        lines,
      });
      for (const i of kept) {
        db.depreciations.push({
          id: i.id,
          assetId: i.assetId,
          period,
          amount: i.amount,
          entryId: entry.id,
          createdAt: ev.at,
        });
      }
      audit(db, ev, 'depreciation', period, 'CREATE', `Dotation ${period} sur ${kept.length} bien(s)`);
      break;
    }

    case 'entry.reconcile': {
      const entryId = p.entryId as string;
      const account = p.account as string;
      const on = p.on !== false;
      const existing = db.reconciliations.findIndex((r) => r.entryId === entryId && r.account === account);
      if (on && existing < 0) {
        db.reconciliations.push({
          id: p.reconciliationId as string,
          entryId,
          account,
          statementDate: (p.statementDate as string) || (ev.at.slice(0, 10) as string),
          createdAt: ev.at,
        });
      }
      if (!on && existing >= 0) db.reconciliations.splice(existing, 1);
      break;
    }

    case 'year.close': {
      const from = p.from as string;
      const to = p.to as string;
      if (db.closings.some((c) => c.to === to)) break;
      const lines = p.lines as JournalLine[];
      if (!lines?.length) break;
      const result = p.result as Minor;

      const closing = post(db, ev, {
        id: p.closingEntryId as string,
        date: to,
        journal: 'CL',
        ref: `CLO-${to.slice(0, 4)}`,
        label: `Clôture de l'exercice ${from} → ${to}`,
        sourceType: 'closing',
        sourceId: to,
        lines,
      });

      const carry = p.carryLines as JournalLine[];
      const carryEntry = carry?.length
        ? post(db, ev, {
            id: p.carryEntryId as string,
            date: p.carryDate as string,
            journal: 'CL',
            ref: `AN-${(p.carryDate as string).slice(0, 4)}`,
            label: 'Affectation du résultat — report à nouveau',
            sourceType: 'closing',
            sourceId: to,
            lines: carry,
          })
        : null;

      const record: FiscalClosing = {
        id: p.closingId as string,
        from,
        to,
        revenue: p.revenue as Minor,
        expenses: p.expenses as Minor,
        result,
        closingEntryId: closing.id,
        carryEntryId: carryEntry?.id ?? '',
        createdAt: ev.at,
      };
      db.closings.push(record);
      audit(db, ev, 'closing', record.id, 'CLOSE', `Exercice ${from} → ${to} clôturé, résultat ${result}`);
      break;
    }

    case 'year.reopen': {
      const closing = db.closings.find((c) => c.id === p.closingId);
      if (!closing) break;
      // On n'efface jamais une écriture : on l'extourne, comme le reste.
      for (const [entryId, reversalId] of [
        [closing.carryEntryId, p.carryReversalId as string],
        [closing.closingEntryId, p.closingReversalId as string],
      ] as const) {
        const original = db.entries.find((e) => e.id === entryId);
        if (!original || original.reversedBy) continue;
        const reversal = post(db, ev, {
          id: reversalId,
          date: p.date as string,
          journal: 'CL',
          ref: `EXT-${original.ref}`,
          label: `Réouverture — extourne de ${original.ref}`,
          sourceType: original.sourceType,
          sourceId: original.sourceId,
          reverses: original.id,
          lines: original.lines.map((l) => ({ account: l.account, label: l.label, debit: l.credit, credit: l.debit })),
        });
        original.reversedBy = reversal.id;
      }
      db.closings = db.closings.filter((c) => c.id !== closing.id);
      audit(db, ev, 'closing', closing.id, 'REOPEN', `Exercice ${closing.from} → ${closing.to} rouvert`);
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

    case 'project.save': {
      const project = p.project as Project;
      const idx = db.projects.findIndex((x) => x.id === project.id);
      if (idx >= 0) db.projects[idx] = project;
      else db.projects.unshift(project);
      audit(db, ev, 'project', project.id, idx >= 0 ? 'UPDATE' : 'CREATE', `Projet : ${project.name}`);
      break;
    }

    case 'project.assign': {
      // Rattache (ou détache, projectId null) une opération existante à un projet.
      const kind = p.kind as 'sale' | 'purchase' | 'expense';
      const targetId = p.id as string;
      const projectId = (p.projectId as string | null) ?? null;
      const list = kind === 'sale' ? db.sales : kind === 'purchase' ? db.purchases : db.expenses;
      const item = (list as { id: string; projectId?: string | null }[]).find((x) => x.id === targetId);
      if (!item) break;
      item.projectId = projectId;
      const project = db.projects.find((x) => x.id === projectId);
      audit(db, ev, 'project', projectId ?? targetId, 'ASSIGN', project ? `Opération rattachée au projet ${project.name}` : 'Opération détachée de son projet');
      break;
    }

    case 'message.post': {
      const message = p.message as Message;
      if (db.messages.some((m) => m.id === message.id)) break;
      db.messages.push(message);
      // Le fil n'est pas un journal comptable : on garde les 2 000 derniers messages.
      if (db.messages.length > 2000) db.messages.splice(0, db.messages.length - 2000);
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
