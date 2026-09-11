import { accountCode } from './chart';
import { currency, factor } from './money';
import { applyEvent, saleTotals } from './reducer';
import { accountCode as codeOf } from './chart';
import type {
  Company,
  DB,
  Customer,
  Expense,
  JournalLine,
  Minor,
  PaymentMethod,
  Product,
  Purchase,
  Sale,
  SaleLine,
  Supplier,
  WorkspaceEvent,
} from './types';

/**
 * Jeu d'essai : trois mois d'activité d'une petite boutique, écrits comme de
 * vrais événements (mêmes règles que la saisie manuelle). Il sert à faire
 * examiner l'application par un comptable sans avoir à tout ressaisir.
 *
 * Tout est reproductible : aucune valeur au hasard, aucune date « aujourd'hui »
 * cachée dans le calcul — chaque écriture porte sa date.
 */

interface Actor {
  id: string | null;
  name: string;
}

/** Générateur pseudo-aléatoire à graine : le même jeu de données à chaque fois. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function dayISO(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Horodatage dans la journée : les événements restent dans l'ordre. */
function stamp(date: string, hour: number, minute = 0): string {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
}

const PRODUCTS: { name: string; sku: string; category: string; price: number; cost: number; stock: number; reorder: number; unit: string }[] = [
  { name: 'Sac de riz 25 kg', sku: 'RIZ25', category: 'Épicerie', price: 18000, cost: 14500, stock: 40, reorder: 10, unit: 'sac' },
  { name: 'Huile végétale 5 L', sku: 'HUI5', category: 'Épicerie', price: 6500, cost: 5000, stock: 60, reorder: 15, unit: 'bidon' },
  { name: 'Savon de ménage (carton)', sku: 'SAV12', category: 'Entretien', price: 4800, cost: 3600, stock: 50, reorder: 12, unit: 'carton' },
  { name: 'Sucre 1 kg', sku: 'SUC1', category: 'Épicerie', price: 900, cost: 650, stock: 200, reorder: 40, unit: 'paquet' },
  { name: 'Lait en poudre 400 g', sku: 'LAI400', category: 'Épicerie', price: 2500, cost: 1900, stock: 80, reorder: 20, unit: 'boîte' },
  { name: 'Cahier 100 pages (lot de 10)', sku: 'CAH100', category: 'Papeterie', price: 3500, cost: 2400, stock: 30, reorder: 10, unit: 'lot' },
  { name: 'Ampoule LED 9 W', sku: 'LED9', category: 'Électricité', price: 1500, cost: 900, stock: 25, reorder: 10, unit: 'pièce' },
  { name: 'Bidon d’eau 10 L', sku: 'EAU10', category: 'Boissons', price: 1200, cost: 800, stock: 18, reorder: 12, unit: 'bidon' },
];

const CUSTOMERS = [
  { name: 'Restaurant Le Palmier', phone: '+237 6 55 10 20 30', email: 'lepalmier@exemple.com', address: 'Quartier Centre' },
  { name: 'École Les Étoiles', phone: '+237 6 99 41 12 08', email: 'ecole.etoiles@exemple.com', address: 'Avenue des Écoles' },
  { name: 'Mme Ngo Bell', phone: '+237 6 77 03 55 21', email: '', address: 'Rue 12' },
  { name: 'Chantier BTP Kribi', phone: '+237 6 70 88 14 902', email: 'achats.btp@exemple.com', address: 'Zone industrielle' },
];

const SUPPLIERS = [
  { name: 'Grossiste Central', phone: '+237 6 50 12 34 56', email: 'ventes@grossiste-central.exemple', address: 'Marché de gros' },
  { name: 'Import Diffusion', phone: '+237 6 91 22 88 10', email: 'contact@import-diffusion.exemple', address: 'Port' },
  { name: 'Papeterie du Sud', phone: '+237 6 78 45 09 33', email: '', address: 'Rue des Artisans' },
];

const MONTHLY_EXPENSES: { category: string; accountKey: 'RENT' | 'UTILITIES' | 'PAYROLL' | 'TRANSPORT' | 'SERVICES'; description: string; amount: number; method: PaymentMethod; day: number }[] = [
  { category: 'Loyer', accountKey: 'RENT', description: 'Loyer du local', amount: 75000, method: 'CASH', day: 2 },
  { category: 'Électricité', accountKey: 'UTILITIES', description: 'Facture d’électricité', amount: 18500, method: 'MOBILE', day: 6 },
  { category: 'Salaires', accountKey: 'PAYROLL', description: 'Salaire vendeuse', amount: 90000, method: 'CASH', day: 28 },
  { category: 'Transport', accountKey: 'TRANSPORT', description: 'Livraisons et déplacements', amount: 12000, method: 'CASH', day: 14 },
  { category: 'Téléphone et internet', accountKey: 'SERVICES', description: 'Forfait boutique', amount: 10000, method: 'MOBILE', day: 18 },
];

/**
 * Construit les événements du jeu d'essai.
 * @param start état de départ de l'espace (devise et référentiel respectés)
 * @param actor auteur affiché dans l'historique
 * @param runId préfixe d'identifiant, pour pouvoir charger le jeu plusieurs fois
 * @param todayISO date du jour (injectée pour rester testable)
 */
export function buildDemoEvents(start: DB, actor: Actor, runId: string, todayISO: string): WorkspaceEvent[] {
  const company: Company = start.company;
  const events: WorkspaceEvent[] = [];
  const unit = factor(company.currency);
  // Les montants sont écrits dans un ordre de grandeur « franc CFA ». Pour une
  // devise à centimes (euro, dollar, dinar…), on les ramène à une échelle
  // crédible, proche d'une conversion réelle : le sac de riz à 18 000 francs
  // devient 30 euros, le loyer 125, le salaire 150.
  const scale = currency(company.currency).decimals === 0 ? 1 : 1 / 600;
  const money = (v: number): Minor => Math.round(v * scale * unit);
  const chart = company.chart;
  const rnd = seeded(20260911);
  const base = new Date(`${todayISO}T12:00:00.000Z`);
  let n = 0;
  const id = () => `${runId}-${String(++n).padStart(4, '0')}`;

  const emit = (at: string, type: string, payload: Record<string, unknown>) => {
    events.push({ id: id(), at, actorId: actor.id, actorName: actor.name, type, payload });
  };

  // ---- Tiers ----
  const customers: Customer[] = CUSTOMERS.map((c, i) => ({ ...c, id: `${runId}-cus-${i}`, createdAt: stamp(dayISO(base, -92), 8, i) }));
  const suppliers: Supplier[] = SUPPLIERS.map((s, i) => ({ ...s, id: `${runId}-sup-${i}`, createdAt: stamp(dayISO(base, -92), 8, i + 10) }));
  customers.forEach((customer, i) => emit(stamp(dayISO(base, -92), 8, i), 'customer.save', { customer }));
  suppliers.forEach((supplier, i) => emit(stamp(dayISO(base, -92), 8, i + 10), 'supplier.save', { supplier }));

  // ---- Catalogue et stock de départ ----
  const products: Product[] = PRODUCTS.map((p, i) => ({
    id: `${runId}-prd-${i}`,
    name: p.name,
    sku: p.sku,
    barcode: '',
    category: p.category,
    brand: '',
    price: money(p.price),
    cost: money(p.cost),
    stock: p.stock,
    reorderPoint: p.reorder,
    unit: p.unit,
    createdAt: stamp(dayISO(base, -91), 9, i),
  }));
  products.forEach((product, i) =>
    emit(stamp(dayISO(base, -91), 9, i), 'product.save', { product, movementId: id(), entryId: id() }),
  );

  // ---- Suivi local du stock, pour ne jamais vendre ce qu'on n'a pas ----
  const stock = new Map(products.map((p) => [p.id, p.stock]));
  const cost = new Map(products.map((p) => [p.id, p.cost]));

  const gaps = new Map<string, Minor>();
  let saleNo = 0;
  let quoteNo = 0;
  let purchaseNo = 0;
  const customerDebts: { id: string; name: string; customerId: string; date: string; amount: Minor }[] = [];

  // ---- Apport de départ : la caisse existe avant les premiers achats ----
  emit(stamp(dayISO(base, -91), 7), 'entry.manual', {
    entryId: id(),
    date: dayISO(base, -91),
    journal: 'OD',
    ref: 'OD-0000',
    label: 'Apport de la propriétaire en caisse',
    lines: [
      { account: accountCode(chart, 'CASH'), label: 'Apport en caisse', debit: money(2500000), credit: 0 },
      { account: accountCode(chart, 'CAPITAL'), label: 'Capital', debit: 0, credit: money(2500000) },
    ],
  });

  // ---- Matériel de la boutique : la dotation aux amortissements porte dessus ----
  emit(stamp(dayISO(base, -91), 8), 'entry.manual', {
    entryId: id(),
    date: dayISO(base, -91),
    journal: 'OD',
    ref: 'OD-0001',
    label: 'Achat vitrine et comptoir',
    lines: [
      { account: accountCode(chart, 'EQUIPMENT'), label: 'Vitrine et comptoir', debit: money(300000), credit: 0 },
      { account: accountCode(chart, 'CASH'), label: 'Paiement en caisse', debit: 0, credit: money(300000) },
    ],
  });

  // ---- Achats : un reçu et payé, un reçu et payé à moitié, un encore en attente ----
  function purchase(dayOffset: number, supplierIndex: number, lines: { productIndex: number; qty: number; unitCost: number }[], paidRatio: number, receive: boolean) {
    const date = dayISO(base, dayOffset);
    const supplier = suppliers[supplierIndex];
    const purchaseLines = lines.map((l) => ({
      productId: products[l.productIndex].id,
      name: products[l.productIndex].name,
      qty: l.qty,
      unitCost: money(l.unitCost),
    }));
    const total = purchaseLines.reduce((s, l) => s + l.unitCost * l.qty, 0);
    const vat = company.vatEnabled ? Math.round((total * company.vatRateBp) / 10000) : 0;
    const paid = Math.round((total + vat) * paidRatio);
    const order: Purchase = {
      id: `${runId}-pur-${purchaseNo}`,
      number: `BC-${String(++purchaseNo).padStart(5, '0')}`,
      date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      lines: purchaseLines,
      total,
      paid,
      status: 'PENDING',
      createdAt: stamp(date, 8),
    };
    emit(stamp(date, 8), 'purchase.record', { purchase: order });
    if (!receive) return;
    emit(stamp(date, 10), 'purchase.receive', {
      purchaseId: order.id,
      date,
      ids: { movements: purchaseLines.map(() => id()), entry: id(), payment: id(), debt: id() },
    });
    // Stock et coût moyen pondéré suivis en parallèle pour les ventes suivantes.
    purchaseLines.forEach((line) => {
      const before = stock.get(line.productId) ?? 0;
      const beforeValue = Math.max(0, before) * (cost.get(line.productId) ?? 0);
      const after = before + line.qty;
      stock.set(line.productId, after);
      cost.set(line.productId, after > 0 ? Math.round((beforeValue + line.qty * line.unitCost) / after) : line.unitCost);
    });
  }

  purchase(-90, 0, [{ productIndex: 0, qty: 60, unitCost: 14500 }, { productIndex: 1, qty: 120, unitCost: 5000 }, { productIndex: 7, qty: 80, unitCost: 800 }], 1, true);
  purchase(-62, 0, [{ productIndex: 3, qty: 400, unitCost: 640 }, { productIndex: 4, qty: 180, unitCost: 1900 }, { productIndex: 0, qty: 40, unitCost: 14800 }], 0.5, true);
  purchase(-30, 1, [{ productIndex: 2, qty: 120, unitCost: 3550 }, { productIndex: 6, qty: 60, unitCost: 880 }, { productIndex: 1, qty: 60, unitCost: 5100 }], 0, true);
  purchase(-50, 2, [{ productIndex: 5, qty: 30, unitCost: 2400 }], 1, true);
  purchase(-4, 2, [{ productIndex: 5, qty: 25, unitCost: 2400 }], 0, false);

  // ---- Ventes réparties sur trois mois ----
  function sale(dayOffset: number, hour: number, picks: { productIndex: number; qty: number }[], method: PaymentMethod, customerIndex: number | null, paidRatio: number, asQuote = false) {
    const date = dayISO(base, dayOffset);
    const lines: SaleLine[] = [];
    for (const pick of picks) {
      const product = products[pick.productIndex];
      const available = stock.get(product.id) ?? 0;
      const qty = Math.min(pick.qty, Math.max(0, available));
      if (qty <= 0) continue;
      lines.push({ productId: product.id, name: product.name, qty, unitPrice: product.price, unitCost: cost.get(product.id) ?? product.cost });
      if (!asQuote) stock.set(product.id, available - qty);
    }
    if (lines.length === 0) return;
    const totals = saleTotals(company, lines, 0);
    const customer = customerIndex === null ? null : customers[customerIndex];
    const saleId = `${runId}-sal-${saleNo}-${asQuote ? 'q' : 'v'}`;
    const record: Sale = {
      id: saleId,
      number: asQuote ? `DV-${String(++quoteNo).padStart(5, '0')}` : `FA-${String(++saleNo).padStart(5, '0')}`,
      date,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Client passager',
      lines,
      discount: 0,
      vat: totals.vat,
      total: totals.total,
      paid: asQuote ? 0 : Math.round(totals.total * paidRatio),
      method,
      status: asQuote ? 'QUOTE' : 'CONFIRMED',
      cashier: actor.name,
      createdAt: stamp(date, hour),
    };
    const debtId = id();
    emit(stamp(date, hour), 'sale.record', {
      sale: record,
      ids: { movements: lines.map(() => id()), saleEntry: id(), cogsEntry: id(), debt: debtId },
    });
    if (!asQuote && record.paid < record.total && customer) {
      customerDebts.push({ id: debtId, name: customer.name, customerId: customer.id, date, amount: record.total - record.paid });
    }
    return record;
  }

  // Ventes de cahiers à l'école, réservées avant le tout-venant : elles
  // alimentent le projet « rayon papeterie ».
  const schoolSale = sale(-45, 15, [{ productIndex: 5, qty: 10 }], 'CREDIT', 1, 0);
  const schoolSale2 = sale(-22, 10, [{ productIndex: 5, qty: 12 }], 'MOBILE', 1, 1);

  const methods: PaymentMethod[] = ['CASH', 'CASH', 'MOBILE', 'CASH', 'CARD', 'MOBILE'];
  for (let day = -89; day <= -1; day += 1) {
    const weekday = new Date(`${dayISO(base, day)}T12:00:00.000Z`).getUTCDay();
    if (weekday === 0) continue; // boutique fermée le dimanche
    const count = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < count; k += 1) {
      const picks = [
        { productIndex: Math.floor(rnd() * PRODUCTS.length), qty: 1 + Math.floor(rnd() * 4) },
        { productIndex: Math.floor(rnd() * PRODUCTS.length), qty: 1 + Math.floor(rnd() * 3) },
      ];
      sale(day, 9 + k * 3, picks, methods[Math.floor(rnd() * methods.length)], null, 1);
    }
  }

  // Ventes à crédit à des clients identifiés : de quoi tester les créances.
  sale(-70, 16, [{ productIndex: 0, qty: 6 }, { productIndex: 1, qty: 4 }], 'CREDIT', 0, 0.3);
  sale(-20, 11, [{ productIndex: 2, qty: 8 }, { productIndex: 3, qty: 20 }], 'CREDIT', 3, 0.5);
  sale(-8, 17, [{ productIndex: 4, qty: 5 }], 'CREDIT', 2, 0);

  // Devis : un accepté, un encore en attente.
  const acceptedQuote = sale(-12, 10, [{ productIndex: 0, qty: 4 }, { productIndex: 4, qty: 6 }], 'CREDIT', 1, 0, true);
  if (acceptedQuote) {
    emit(stamp(dayISO(base, -10), 9), 'quote.confirm', {
      saleId: acceptedQuote.id,
      method: 'BANK' as PaymentMethod,
      paid: acceptedQuote.total,
      number: `FA-${String(++saleNo).padStart(5, '0')}`,
      date: dayISO(base, -10),
      ids: { movements: acceptedQuote.lines.map(() => id()), saleEntry: id(), cogsEntry: id(), debt: id() },
    });
    acceptedQuote.lines.forEach((line) => stock.set(line.productId, (stock.get(line.productId) ?? 0) - line.qty));
  }
  sale(-3, 14, [{ productIndex: 2, qty: 12 }, { productIndex: 6, qty: 10 }], 'CREDIT', 3, 0, true);

  // ---- Réassort de fin de mois : de quoi montrer les alertes de seuil ----
  purchase(-2, 1, [{ productIndex: 0, qty: 8, unitCost: 14800 }, { productIndex: 7, qty: 10, unitCost: 820 }], 0, true);

  // ---- Un projet : le nouveau rayon papeterie, avec son budget et ses opérations ----
  const projectId = `${runId}-prj-1`;
  emit(stamp(dayISO(base, -52), 9), 'project.save', {
    project: {
      id: projectId,
      name: 'Ouverture du rayon papeterie',
      kind: 'opening',
      budget: money(150000),
      startDate: dayISO(base, -52),
      endDate: dayISO(base, 30),
      status: 'ACTIVE',
      notes: 'Étagères par le menuisier du quartier, stock de départ chez Papeterie du Sud.',
      createdAt: stamp(dayISO(base, -52), 9),
    },
  });
  for (const [day, description, amount] of [[-51, 'Menuisier — étagères du rayon', 45000], [-40, 'Affiche et flyers du rayon', 8000]] as [number, string, number][]) {
    const date = dayISO(base, day);
    emit(stamp(date, 16), 'expense.add', {
      expense: { id: id(), date, projectId, category: 'Services extérieurs', account: accountCode(chart, 'SERVICES'), description, amount: money(amount), method: 'CASH', createdAt: stamp(date, 16) },
      entryId: id(),
    });
  }
  // Rattachements après coup : l'achat de départ et les ventes à l'école.
  emit(stamp(dayISO(base, -50), 11), 'project.assign', { kind: 'purchase', id: `${runId}-pur-3`, projectId });
  if (schoolSale) emit(stamp(dayISO(base, -45), 16), 'project.assign', { kind: 'sale', id: schoolSale.id, projectId });
  if (schoolSale2) emit(stamp(dayISO(base, -22), 11), 'project.assign', { kind: 'sale', id: schoolSale2.id, projectId });

  // ---- Le fil de discussion : quelques échanges vrais autour du projet ----
  const chat = (day: number, hour: number, projectRef: string | null, authorName: string, text: string, extra: Record<string, unknown> = {}) =>
    emit(stamp(dayISO(base, day), hour), 'message.post', {
      message: { id: id(), projectId: projectRef, authorId: null, authorName, kind: 'user', text, createdAt: stamp(dayISO(base, day), hour), ...extra },
    });
  chat(-51, 17, projectId, 'Awa', 'Le menuisier a livré les étagères, j’ai payé 45 000 en espèces. Je mets le reçu demain.');
  chat(-51, 17, projectId, actor.name, 'Parfait, je l’ai rattaché au projet. Reste 105 000 sur le budget.');
  chat(-45, 16, projectId, 'Awa', 'L’école a pris 10 lots de cahiers à crédit, ils paient en deux fois.');
  chat(-3, 9, null, 'Awa', '@assistant combien nous doit encore l’école ?');
  emit(stamp(dayISO(base, -3), 9, 1), 'message.post', {
    message: {
      id: id(),
      projectId: null,
      authorId: null,
      authorName: 'Assistant',
      kind: 'assistant',
      text: 'D’après vos chiffres, l’École Les Étoiles a encore un reste à payer sur la vente FA-00001 (cahiers, à crédit). Vous pouvez la relancer depuis « Dettes & crédits », bouton WhatsApp.',
      createdAt: stamp(dayISO(base, -3), 9, 1),
    },
  });
  chat(-1, 18, null, actor.name, 'Pensez à fermer la caisse ce soir, on a eu un manquant la semaine dernière.');

  // ---- Encaissements partiels sur les créances ----
  customerDebts.slice(0, 3).forEach((debt, i) => {
    const date = dayISO(base, -60 + i * 20);
    emit(stamp(date, 12), 'debt.pay', {
      debtId: debt.id,
      payment: { id: id(), date, amount: Math.round(debt.amount / 2), method: (i === 1 ? 'MOBILE' : 'CASH') as PaymentMethod },
      entryId: id(),
    });
  });

  // ---- Dépenses courantes, chaque mois ----
  for (const month of [-3, -2, -1, 0]) {
    for (const item of MONTHLY_EXPENSES) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + month, item.day);
      const date = d.toISOString().slice(0, 10);
      if (date >= todayISO) continue;
      const expense: Expense = {
        id: id(),
        date,
        category: item.category,
        account: accountCode(chart, item.accountKey),
        description: item.description,
        amount: money(item.amount),
        method: item.method,
        createdAt: stamp(date, 17),
      };
      emit(stamp(date, 17), 'expense.add', { expense, entryId: id() });
    }
  }

  // ---- Mouvements de stock exceptionnels ----
  const breakage = products.find((p) => (stock.get(p.id) ?? 0) >= 6) ?? products[3];
  emit(stamp(dayISO(base, -35), 18), 'stock.adjust', {
    productId: breakage.id,
    qty: -3,
    reason: 'Casse constatée',
    date: dayISO(base, -35),
    movementId: id(),
    entryId: id(),
  });
  stock.set(breakage.id, (stock.get(breakage.id) ?? 0) - 3);
  emit(stamp(dayISO(base, -15), 18), 'stock.adjust', {
    productId: products[3].id,
    qty: 4,
    reason: 'Écart d’inventaire',
    date: dayISO(base, -15),
    movementId: id(),
    entryId: id(),
  });
  stock.set(products[3].id, (stock.get(products[3].id) ?? 0) + 4);

  // ---- Caisse : trois journées ouvertes puis clôturées, dont une avec un écart ----
  [[-9, 0], [-4, -2500], [-2, 0]].forEach(([day, gap], i) => {
    const date = dayISO(base, day);
    const sessionId = `${runId}-ses-${i}`;
    gaps.set(sessionId, money(gap));
    emit(stamp(date, 7, 30), 'session.open', {
      session: {
        id: sessionId,
        openedAt: stamp(date, 7, 30),
        closedAt: null,
        cashier: actor.name,
        opening: money(50000),
        expected: null,
        counted: null,
        variance: null,
      },
    });
    // Le montant compté est ajusté après coup sur la caisse réellement attendue.
    emit(stamp(date, 19, 30), 'session.close', { sessionId, counted: 0, entryId: id() });
  });

  // ---- Écritures manuelles : une dotation, et une erreur volontairement extournée ----
  const amortisation: JournalLine[] = [
    { account: accountCode(chart, 'MISC_EXPENSE'), label: 'Dotation aux amortissements (vitrine)', debit: money(25000), credit: 0 },
    { account: accountCode(chart, 'EQUIPMENT'), label: 'Amortissement du matériel', debit: 0, credit: money(25000) },
  ];
  emit(stamp(dayISO(base, -31), 20), 'entry.manual', {
    entryId: id(),
    date: dayISO(base, -31),
    journal: 'OD',
    ref: 'OD-0002',
    label: 'Dotation aux amortissements du mois',
    lines: amortisation,
  });

  const mistakeId = id();
  emit(stamp(dayISO(base, -14), 20), 'entry.manual', {
    entryId: mistakeId,
    date: dayISO(base, -14),
    journal: 'OD',
    ref: 'OD-0003',
    label: 'Régularisation saisie deux fois (à extourner)',
    lines: [
      { account: accountCode(chart, 'MISC_EXPENSE'), label: 'Frais divers', debit: money(7500), credit: 0 },
      { account: accountCode(chart, 'CASH'), label: 'Caisse', debit: 0, credit: money(7500) },
    ],
  });
  emit(stamp(dayISO(base, -13), 9), 'entry.reverse', { entryId: mistakeId, reversalId: id(), date: dayISO(base, -13) });

  // ---- Un produit retiré du catalogue ----
  emit(stamp(dayISO(base, -6), 11), 'product.archive', { productId: products[6].id });

  // Remise en ordre chronologique : la caisse, les relances et les extournes
  // doivent se lire dans l'ordre où elles se sont produites.
  const ordered = events.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));

  // Clôtures de caisse : on rejoue l'histoire pour compter ce que la caisse
  // contient vraiment ce soir-là, puis on applique l'écart voulu (0 ou manquant).
  let state = start;
  const cashCode = codeOf(chart, 'CASH');
  for (const ev of ordered) {
    if (ev.type === 'session.close') {
      const sessionId = ev.payload.sessionId as string;
      const session = state.sessions.find((x) => x.id === sessionId);
      if (session) {
        let movement = 0;
        for (const entry of state.entries) {
          if (entry.createdAt < session.openedAt) continue;
          for (const line of entry.lines) if (line.account === cashCode) movement += line.debit - line.credit;
        }
        ev.payload.counted = session.opening + movement + (gaps.get(sessionId) ?? 0);
      }
    }
    try {
      state = applyEvent(state, ev);
    } catch {
      // Un événement refusé ici serait aussi refusé à l'usage : on le laisse tel quel.
    }
  }
  return ordered;
}
