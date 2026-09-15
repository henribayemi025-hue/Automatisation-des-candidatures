/**
 * Les 21 entreprises de la passe 1 (docs/PROMPT-SIMULATION-METIERS.md).
 *
 * Onze formes commerce / production, dix formes de service. Chaque forme de
 * service porte son piège comptable ; `trap` mesure ce que l'application
 * compte en produit alors que ce n'en est pas encore un (ou pas du tout), et
 * `yearly` rejoue le scénario métier une fois par an à travers le vrai moteur.
 *
 * Montants en unités mineures de la devise de l'entreprise : FCFA sans
 * décimales, euro/livre/rand en centimes.
 */
import type { Ctx, Profile, ProductSpec, TrapReport } from './harness';
import { addDays } from './harness';
import type { AccountKey } from '../../src/lib/chart';
import type { Sale } from '../../src/lib/types';
import { balanceOf } from '../../src/lib/ledger';
import { saleTotals } from '../../src/lib/reducer';

const cm = (n: number) => Math.round(n * 100); // euros → centimes

function stockedProducts(names: [string, number, number, number][], unit = 'pièce'): ProductSpec[] {
  return names.map(([name, price, cost, stock]) => ({ name, price, cost, stock, unit }));
}

/** Vente forcée sans passer par le miroir de stock : ce que ferait un second appareil hors ligne. */
function forceSale(ctx: Ctx, date: string, productIndex: number, qty: number, method: 'CASH' | 'MOBILE' = 'CASH'): Sale | null {
  const product = ctx.products[productIndex];
  const lines = [{ productId: product.id, name: product.name, qty, unitPrice: product.price, unitCost: ctx.cost.get(product.id) ?? product.cost }];
  const t = saleTotals(ctx.db.company, lines, 0);
  ctx.saleNo += 1;
  const sale: Sale = {
    id: ctx.id(), number: `FA-${String(ctx.saleNo).padStart(6, '0')}`, date, customerId: null, customerName: 'Client passager (2e appareil)',
    lines, discount: 0, vat: t.vat, total: t.total, paid: t.total, method, status: 'CONFIRMED', cashier: 'Caisse 2', createdAt: `${date}T18:30:00.000Z`,
  };
  const ok = ctx.emit('sale.record', { sale, ids: { movements: [ctx.id()], saleEntry: ctx.id(), cogsEntry: ctx.id(), debt: ctx.id() } }, date, 18, 30);
  if (ok) ctx.stock.set(product.id, (ctx.stock.get(product.id) ?? 0) - qty);
  return ok ? sale : null;
}

/** Produit de service : pas de stock, coût nul. */
function service(name: string, price: number, unit = 'prestation'): ProductSpec {
  return { name, price, cost: 0, stock: 0, unit, category: 'Prestations' };
}

/** Somme des ventes encaissées sur un produit dans une plage, telle que l'application les a mises en produit (HT). */
function revenueOf(ctx: Ctx, productNames: string[], range: { from: string; to: string }): number {
  let total = 0;
  for (const s of ctx.db.sales) {
    if (s.status !== 'CONFIRMED' || s.date < range.from || s.date > range.to) continue;
    for (const l of s.lines) if (productNames.includes(l.name)) total += saleTotals(ctx.db.company, [l], 0).net;
  }
  return total;
}

const XAF = { currency: 'XAF', country: 'CM', chart: 'SYSCOHADA' as const, vatEnabled: false, vatRateBp: 1925, pricesIncludeTax: true, taxLabel: 'TVA', fiscalYearStart: '01-01' };
const XAF_REEL = { ...XAF, vatEnabled: true, taxRegime: 'REEL' as const };

// ---------------------------------------------------------------------------
// Commerce et production
// ---------------------------------------------------------------------------

const boutique: Profile = {
  key: 'boutique', name: 'Boutique de quartier — Awa', forme: '1. Boutique de détail (FCFA, IGS)',
  company: { ...XAF, sector: 'retail', taxRegime: 'IGS', withholdingBp: 200 },
  products: stockedProducts([['Sac de riz 25 kg', 18500, 16000, 40], ['Huile 5 L', 6500, 5600, 30], ['Savon', 350, 250, 400], ['Sucre 1 kg', 900, 780, 150], ['Lait en poudre', 2800, 2400, 60], ['Tomate concentrée', 450, 380, 300]]),
  customers: ['Maman Ngo', 'Tonton Paul', 'Bar du coin'], suppliers: ['Grossiste Mokolo'],
  sales: { perDay: [15, 40], linesPerSale: [1, 3], qtyPerLine: [1, 3], methods: { CASH: 70, MOBILE: 25, CREDIT: 5 }, closedWeekday: 0, creditSettleDays: 20 },
  purchases: { everyDays: 7, coverDays: 10, paidNow: 0.6 },
  expenses: [{ key: 'RENT', amount: 50000, day: 5 }, { key: 'UTILITIES', amount: 12000, day: 10 }],
  staff: [{ name: 'Vendeuse', payKind: 'MONTHLY', rate: 60000 }],
  sessions: true,
  opening: { cash: 300000, mobile: 100000, bank: 500000 },
  seed: 11,
  yearly: (ctx, year) => {
    // Un retour client : rien dans l'application pour le faire, on note le fait.
    if (year >= 2) {
      // Facture d'électricité de décembre reçue en juillet, saisie à sa vraie date : l'exercice est clos.
      const late = `${2026 + year - 2}-12-28`;
      const before = ctx.db.entries.length;
      const ok = ctx.expense(late, 'UTILITIES', 12000, 'CASH', 'Facture électricité décembre (reçue en retard)');
      const posted = ctx.db.entries.length > before;
      if (year === 2) ctx.finding('année 2', posted ? 'BLOQUANT' : 'INFO', posted ? `Dépense datée du ${late}, exercice déjà clôturé : le moteur l’accepte sans avertir (ok=${ok}). Les comptes de gestion de l’exercice clos ne sont plus soldés et le résultat clôturé ne correspond plus au compte de résultat.` : `Dépense datée du ${late} dans un exercice clos : refusée.`, `Clôturer l’exercice, puis saisir une dépense datée dans cet exercice.`);
    }
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Retour d’un article vendu : aucun événement de retour ou d’avoir ; la seule voie est d’extourner l’écriture de vente, ce qui ne remet pas l’article en stock ni ne ressort le coût des marchandises.', 'Vendre un savon, puis vouloir le reprendre : chercher « retour » ou « avoir » dans le point de vente.');
  },
};

const superette: Profile = {
  key: 'superette', name: 'Supérette deux caisses — Douala', forme: '2. Supérette, plusieurs caisses, codes-barres (FCFA, réel)',
  company: { ...XAF_REEL, sector: 'retail' },
  products: stockedProducts([['Eau 1,5 L', 500, 350, 600], ['Pain de mie', 1200, 900, 80], ['Riz 5 kg', 4500, 3900, 120], ['Bière 65 cl', 800, 620, 900], ['Jus 1 L', 1500, 1100, 200], ['Couches T3', 7500, 6200, 60], ['Dentifrice', 1300, 950, 150], ['Poulet congelé', 4800, 4000, 50]]),
  customers: ['Cantine Lycée', 'Hôtel Lumière'], suppliers: ['Sodicam', 'Brasseries'],
  sales: { perDay: [80, 160], linesPerSale: [1, 5], qtyPerLine: [1, 4], methods: { CASH: 55, MOBILE: 30, CARD: 12, CREDIT: 3 } },
  purchases: { everyDays: 4, coverDays: 8, paidNow: 0.5 },
  expenses: [{ key: 'RENT', amount: 250000, day: 3 }, { key: 'UTILITIES', amount: 90000, day: 12 }, { key: 'SERVICES', amount: 40000, day: 20 }],
  staff: [{ name: 'Caissière 1', payKind: 'MONTHLY', rate: 80000 }, { name: 'Caissière 2', payKind: 'MONTHLY', rate: 80000 }, { name: 'Magasinier', payKind: 'DAILY', rate: 3500 }],
  sessions: true,
  opening: { cash: 500000, mobile: 300000, bank: 4000000 },
  seed: 22,
  yearly: (ctx, year) => {
    // Deux caisses hors ligne vendent le même dernier carton : la seconde passe quand même.
    const date = addDays('2026-01-05', year * 365 - 185);
    const p = ctx.products[5]; // couches
    const left = ctx.stock.get(p.id) ?? 0;
    if (left > 0) {
      forceSale(ctx, date, 5, left, 'CASH');
      forceSale(ctx, date, 5, 2, 'MOBILE');
      const now = ctx.db.products.find((x) => x.id === p.id)?.stock ?? 0;
      ctx.finding(`année ${year}`, now < 0 ? 'BLOQUANT' : 'INFO', `Deux caisses vendent le même dernier lot de ${p.name} : stock après = ${now}. Le moteur ne refuse pas et ne signale rien ; le coût des marchandises est sorti deux fois.`, `Deux appareils hors ligne, même article, dernier exemplaire ; se resynchroniser. Ou : npx vite-node scripts/sim-passe1.ts superette`);
      // On remet d'équerre par un ajustement, comme le ferait le magasinier — la trace reste.
      if (now < 0) ctx.adjust(p, addDays(date, 1), -now, 'Écart d’inventaire (double vente hors ligne)');
    }
  },
};

const restaurant: Profile = {
  key: 'restaurant', name: 'Restaurant — Chez Tantine', forme: '3. Restaurant (recettes, matières, pertes)',
  company: { ...XAF, sector: 'food', taxRegime: 'IGS' },
  products: [
    ...stockedProducts([['Poulet DG', 4500, 2100, 30], ['Ndolé', 3000, 1300, 40], ['Poisson braisé', 5000, 2600, 25], ['Jus de bissap', 1000, 300, 80], ['Bière', 1000, 650, 200]], 'assiette'),
  ],
  suppliers: ['Marché central'],
  sales: { perDay: [30, 70], linesPerSale: [1, 3], qtyPerLine: [1, 2], methods: { CASH: 60, MOBILE: 35, CARD: 5 } },
  purchases: { everyDays: 2, coverDays: 3, paidNow: 1 },
  expenses: [{ key: 'RENT', amount: 150000, day: 2 }, { key: 'UTILITIES', amount: 60000, day: 15 }],
  staff: [{ name: 'Cuisinière', payKind: 'DAILY', rate: 4000 }, { name: 'Serveur', payKind: 'DAILY', rate: 2500 }],
  sessions: true,
  opening: { cash: 200000, mobile: 150000, bank: 800000 },
  seed: 33,
  yearly: (ctx, year) => {
    // Les invendus du soir partent à la poubelle : ajustement négatif.
    const date = addDays('2026-01-05', year * 365 - 185);
    for (const i of [0, 1, 2]) {
      const p = ctx.products[i];
      const have = ctx.stock.get(p.id) ?? 0;
      if (have > 3) ctx.adjust(p, date, -3, 'Invendus jetés');
    }
    if (year === 1) ctx.finding('année 1', 'INFO', 'Un plat est un article stocké avec un coût matière fixe : la fiche technique (recette → ingrédients) n’existe pas, la matière achetée n’est pas décomposée.', 'Articles → « Poulet DG » : pas de composition.');
  },
};

const jus: Profile = {
  key: 'jus', name: 'Production de jus — Fruits du Nord', forme: '4. Production (transformation, péremption)',
  company: { ...XAF, sector: 'food', taxRegime: 'IGS' },
  products: stockedProducts([['Jus mangue 50 cl', 700, 280, 300], ['Jus ananas 50 cl', 700, 260, 300], ['Jus gingembre 33 cl', 500, 180, 400]], 'bouteille'),
  customers: ['Supérette Akwa', 'Buvette Stade', 'École Saint-Jean'], suppliers: ['Coopérative fruits'],
  sales: { perDay: [5, 15], linesPerSale: [1, 3], qtyPerLine: [10, 60], methods: { MOBILE: 40, BANK: 20, CREDIT: 40 }, creditSettleDays: 45 },
  purchases: { everyDays: 5, coverDays: 8, paidNow: 1 },
  expenses: [{ key: 'UTILITIES', amount: 80000, day: 8 }, { key: 'TRANSPORT', amount: 45000, day: 16 }],
  staff: [{ name: 'Ouvrier 1', payKind: 'DAILY', rate: 3000 }, { name: 'Ouvrier 2', payKind: 'DAILY', rate: 3000 }],
  opening: { cash: 100000, mobile: 400000, bank: 1500000 },
  seed: 44,
  yearly: (ctx, year) => {
    const date = addDays('2026-01-05', year * 365 - 185);
    // Péremption : un lot entier de gingembre passe la date.
    const p = ctx.products[2];
    const have = ctx.stock.get(p.id) ?? 0;
    if (have > 50) ctx.adjust(p, date, -50, 'Lot périmé');
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Aucune date de péremption ni numéro de lot sur un article : la casse se saisit à la main après coup, rien ne prévient avant.', 'Articles → fiche « Jus gingembre » : aucun champ date limite / lot.');
  },
};

const pharmacie: Profile = {
  key: 'pharmacie', name: 'Pharmacie — Bonanjo', forme: '5. Pharmacie (lots, marge réglementée)',
  company: { ...XAF_REEL, sector: 'health', tracksStock: true },
  products: stockedProducts([['Paracétamol 500', 1200, 850, 500], ['Amoxicilline 1 g', 3500, 2700, 200], ['Sirop toux', 2800, 2000, 120], ['Antipaludéen', 4500, 3600, 150], ['Lait bébé', 6500, 5400, 60], ['Pansements', 800, 500, 300]], 'boîte'),
  customers: ['Clinique Bonanjo', 'Assurance Sanlam'], suppliers: ['Laborex', 'Ubipharm'],
  sales: { perDay: [40, 90], linesPerSale: [1, 3], qtyPerLine: [1, 2], methods: { CASH: 50, MOBILE: 35, CREDIT: 15 }, creditSettleDays: 60 },
  purchases: { everyDays: 3, coverDays: 10, paidNow: 0.3 },
  expenses: [{ key: 'RENT', amount: 400000, day: 1 }, { key: 'UTILITIES', amount: 120000, day: 10 }],
  staff: [{ name: 'Pharmacien', payKind: 'MONTHLY', rate: 350000 }, { name: 'Vendeuse', payKind: 'MONTHLY', rate: 90000 }],
  sessions: true,
  opening: { cash: 300000, mobile: 500000, bank: 6000000 },
  seed: 55,
  yearly: (ctx, year) => {
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Ni lot ni péremption ni traçabilité : impossible de retrouver à qui un lot rappelé a été vendu.', 'Articles → « Amoxicilline » : aucun champ lot ; Ventes → recherche par lot impossible.');
    // La mutuelle règle par tiers-payant à 60 jours : couvert par le crédit client. Rien à signaler.
  },
};

const electronique: Profile = {
  key: 'electronique', name: 'Boutique de téléphones — Akwa', forme: '6. Électronique (numéros de série, garanties, SAV)',
  company: { ...XAF_REEL, sector: 'tech' },
  products: stockedProducts([['Smartphone A', 85000, 68000, 25], ['Smartphone B', 145000, 118000, 12], ['Écouteurs', 6500, 3800, 80], ['Chargeur', 3500, 1900, 120], ['Coque', 2500, 900, 200], ['Power bank', 12000, 7500, 40]]),
  customers: ['Entreprise Kamdem', 'Revendeur Bafoussam'], suppliers: ['Importateur Dubaï'],
  sales: { perDay: [4, 14], linesPerSale: [1, 2], qtyPerLine: [1, 1], methods: { CASH: 35, MOBILE: 45, CARD: 10, CREDIT: 10 } },
  purchases: { everyDays: 14, coverDays: 20, paidNow: 0.7 },
  expenses: [{ key: 'RENT', amount: 200000, day: 1 }, { key: 'UTILITIES', amount: 35000, day: 10 }],
  staff: [{ name: 'Vendeur', payKind: 'MONTHLY', rate: 100000 }],
  sessions: true,
  opening: { cash: 500000, mobile: 500000, bank: 5000000 },
  seed: 66,
  yearly: (ctx, year) => {
    if (year === 1) {
      ctx.finding('année 1', 'MAJEUR', 'Pas de numéro de série par unité vendue : une garantie ne se rattache à rien ; un retour SAV sous garantie n’a pas d’événement (ni avoir, ni remplacement, ni provision).', 'Vendre « Smartphone A » : le ticket ne demande ni ne garde d’IMEI.');
    }
  },
};

const salon: Profile = {
  key: 'salon', name: 'Salon de coiffure mixte — Yaoundé', forme: '7. Salon : prestations + revente de produits',
  company: { ...XAF, sector: 'beauty', tracksStock: true, taxRegime: 'IGS' },
  products: [service('Coupe homme', 2000), service('Tresses', 8000), service('Brushing', 3500), ...stockedProducts([['Crème capillaire', 4500, 2800, 30], ['Mèches', 6000, 3900, 40]])],
  suppliers: ['Cosmétiques Mfoundi'],
  sales: { perDay: [8, 20], linesPerSale: [1, 2], qtyPerLine: [1, 1], methods: { CASH: 65, MOBILE: 35 }, closedWeekday: 1 },
  purchases: { everyDays: 15, coverDays: 20, paidNow: 1 },
  expenses: [{ key: 'RENT', amount: 80000, day: 4 }, { key: 'UTILITIES', amount: 25000, day: 12 }],
  staff: [{ name: 'Coiffeuse', payKind: 'DAILY', rate: 3000 }],
  sessions: true,
  opening: { cash: 150000, mobile: 100000, bank: 300000 },
  seed: 77,
  yearly: (ctx, year) => {
    // Le stock des prestations : elles ont stock 0 et l'article est stocké (tracksStock true) → la vente les met à −1.
    const coupe = ctx.db.products.find((p) => p.name === 'Coupe homme');
    if (coupe && year === 1) ctx.finding('année 1', coupe.stock < 0 ? 'BLOQUANT' : 'INFO', `Salon mixte (stock activé pour les crèmes) : la prestation « Coupe homme » a un stock de ${coupe.stock} après ventes. Une prestation ne devrait pas décrémenter de stock.`, 'Salon avec « suivre le stock » activé ; vendre une coupe ; ouvrir la fiche article.');
  },
};

const ambulant: Profile = {
  key: 'ambulant', name: 'Vendeur ambulant — Mokolo', forme: '8. Ambulant, sans stock suivi',
  company: { ...XAF, sector: 'retail', tracksStock: false, taxRegime: 'NONE' },
  products: stockedProducts([['Beignets', 100, 40, 0], ['Café', 200, 80, 0], ['Bouillie', 250, 100, 0]], 'portion'),
  sales: { perDay: [40, 90], linesPerSale: [1, 2], qtyPerLine: [1, 4], methods: { CASH: 90, MOBILE: 10 } },
  expenses: [{ key: 'PURCHASES', amount: 15000, day: 1, method: 'CASH' }, { key: 'PURCHASES', amount: 15000, day: 8, method: 'CASH' }, { key: 'PURCHASES', amount: 15000, day: 15, method: 'CASH' }, { key: 'PURCHASES', amount: 15000, day: 22, method: 'CASH' }],
  opening: { cash: 50000, mobile: 20000, bank: 0 },
  seed: 88,
};

const importExport: Profile = {
  key: 'import', name: 'Import-export — Kribi Trading', forme: '9. Import-export (achats en devise, frais d’approche)',
  company: { ...XAF_REEL, sector: 'trade' },
  products: stockedProducts([['Carrelage 60×60 (m²)', 9500, 6200, 800], ['Robinet mitigeur', 18000, 11000, 150], ['Peinture 20 L', 32000, 21000, 120]]),
  customers: ['BTP Sud', 'Quincaillerie Ebolowa', 'Promoteur Mbalmayo'], suppliers: ['Foshan Ceramics (CNY)'],
  sales: { perDay: [2, 8], linesPerSale: [1, 3], qtyPerLine: [5, 80], methods: { BANK: 50, MOBILE: 20, CREDIT: 30 }, creditSettleDays: 45 },
  purchases: { everyDays: 45, coverDays: 60, paidNow: 1 },
  expenses: [{ key: 'RENT', amount: 350000, day: 1 }, { key: 'TRANSPORT', amount: 150000, day: 15 }],
  staff: [{ name: 'Commercial', payKind: 'MONTHLY', rate: 200000 }, { name: 'Manutention', payKind: 'DAILY', rate: 4000 }],
  opening: { cash: 500000, mobile: 1000000, bank: 40000000 },
  seed: 99,
  yearly: (ctx, year) => {
    // Un conteneur avec facture en yuan, douane et fret : achat avec frais d'approche.
    const date = addDays('2026-01-05', year * 365 - 185);
    const p = ctx.products[0];
    const qty = 1200;
    const unitCost = 6000;
    const goods = qty * unitCost;
    ctx.purchaseNo += 1;
    const purchase = {
      id: ctx.id(), number: `BC-IMP-${year}`, date, supplierId: ctx.suppliers[0]?.id ?? null, supplierName: ctx.suppliers[0]?.name ?? 'Foshan',
      lines: [{ productId: p.id, name: p.name, qty, unitCost }], total: goods, paid: goods, status: 'PENDING' as const, createdAt: `${date}T08:00:00.000Z`,
      foreign: { currency: 'CNY', total: Math.round(goods / 0.083), rate: 0.083 },
      landed: [{ kind: 'CUSTOMS' as const, label: 'Droits de douane', amount: Math.round(goods * 0.3) }, { kind: 'FREIGHT' as const, label: 'Fret maritime', amount: 1800000 }, { kind: 'FORWARDING' as const, label: 'Transitaire', amount: 400000 }],
      landedPaidWith: 'BANK' as const,
    };
    if (!ctx.ensureCash(date, goods, 7, 45)) return;
    ctx.emit('purchase.record', { purchase }, date, 8);
    const before = ctx.stock.get(p.id) ?? 0;
    const ok = ctx.emit('purchase.receive', { purchaseId: purchase.id, date, ids: { movements: [ctx.id()], entry: ctx.id(), payment: ctx.id(), debt: ctx.id() } }, date, 9);
    if (ok) {
      const after = ctx.db.products.find((x) => x.id === p.id)!;
      ctx.stock.set(p.id, after.stock);
      ctx.cost.set(p.id, after.cost);
      const landed = purchase.landed.reduce((s, c) => s + c.amount, 0);
      const expectedUnit = Math.round((goods + landed) / qty);
      const weighted = Math.round((Math.max(0, before) * (ctx.cost.get(p.id) ?? 0) + (goods + landed)) / (before + qty));
      void weighted;
      ctx.finding(`année ${year}`, 'INFO', `Conteneur : marchandise ${goods.toLocaleString('fr-FR')} + frais d’approche ${landed.toLocaleString('fr-FR')} → coût unitaire attendu ≈ ${expectedUnit} avant pondération ; coût moyen pondéré appliqué = ${after.cost}. Le moteur intègre les frais d’approche au stock.`, 'Achats → nouvelle commande avec frais (douane, fret) → réceptionner ; lire le coût de l’article.');
    }
  },
};

const pmeFrance: Profile = {
  key: 'france', name: 'Épicerie fine — Lyon (PCG, TVA 20 %)', forme: '10. PME France (PCG, TVA, exercice civil)',
  company: { currency: 'EUR', country: 'FR', chart: 'PCG', vatEnabled: true, vatRateBp: 2000, pricesIncludeTax: true, taxLabel: 'TVA', taxRegime: 'REEL', fiscalYearStart: '01-01', sector: 'retail' },
  products: stockedProducts([['Huile d’olive 75 cl', cm(14.9), cm(8.2), 60], ['Confiture', cm(6.5), cm(3.1), 120], ['Fromage affiné (kg)', cm(32), cm(19), 25], ['Vin rouge', cm(18), cm(10.5), 90], ['Café 250 g', cm(9.9), cm(5.4), 80]]),
  customers: ['Restaurant Le Chai', 'Comité d’entreprise'], suppliers: ['Producteurs Drôme'],
  sales: { perDay: [20, 60], linesPerSale: [1, 4], qtyPerLine: [1, 3], methods: { CARD: 70, CASH: 25, CREDIT: 5 }, closedWeekday: 0, creditSettleDays: 30 },
  purchases: { everyDays: 7, coverDays: 12, paidNow: 0.5 },
  expenses: [{ key: 'RENT', amount: cm(1800), day: 1 }, { key: 'UTILITIES', amount: cm(320), day: 10 }, { key: 'SERVICES', amount: cm(150), day: 15 }],
  staff: [{ name: 'Vendeuse', payKind: 'MONTHLY', rate: cm(2100) }],
  sessions: true,
  opening: { cash: cm(500), mobile: 0, bank: cm(40000) },
  seed: 1010,
};

const reprise: Profile = {
  key: 'reprise', name: 'Reprise d’une quincaillerie — Bafoussam', forme: '11. Reprise d’entreprise (bilan d’ouverture)',
  company: { ...XAF_REEL, sector: 'retail' },
  products: stockedProducts([['Ciment 50 kg', 6200, 5400, 300], ['Fer à béton 12', 5800, 4900, 400], ['Clous (kg)', 1200, 800, 200], ['Tôle bac', 8500, 7000, 150]]),
  customers: ['Chantier Lycée', 'Maçon Tagne'], suppliers: ['Cimencam'],
  sales: { perDay: [6, 18], linesPerSale: [1, 3], qtyPerLine: [2, 30], methods: { CASH: 40, MOBILE: 30, BANK: 10, CREDIT: 20 }, creditSettleDays: 40 },
  purchases: { everyDays: 10, coverDays: 15, paidNow: 0.5 },
  expenses: [{ key: 'RENT', amount: 180000, day: 1 }],
  staff: [{ name: 'Gérant', payKind: 'MONTHLY', rate: 150000 }],
  opening: { cash: 400000, mobile: 300000, bank: 3000000 },
  seed: 1111,
  yearly: (ctx, year) => {
    if (year !== 1) return;
    // Bilan d'ouverture repris de l'ancien propriétaire : créances, dettes, immobilisation, résultats passés.
    const date = '2026-01-06';
    ctx.manual(date, 'AN-0001', 'Reprise du bilan de l’ancien exploitant', [
      { key: 'CUSTOMERS', debit: 1250000, label: 'Créances reprises' },
      { key: 'EQUIP_FURNITURE', debit: 2400000, label: 'Rayonnages' },
      { key: 'VEHICLE', debit: 6500000, label: 'Camionnette' },
      { key: 'DEP_VEHICLE', credit: 2600000, label: 'Amortissements repris' },
      { key: 'SUPPLIERS', credit: 1900000, label: 'Dettes fournisseurs reprises' },
      { key: 'RETAINED', credit: 5650000, label: 'Résultats antérieurs' },
    ]);
    ctx.finding('année 1', 'INFO', 'Les créances reprises en écriture manuelle (411) n’existent pas comme dettes clients dans l’application : pas de relance, pas d’encaissement possible via « régler ». Le bilan les porte, la liste des impayés non.', 'Rattrapage → à-nouveaux avec 411 ; ouvrir Clients → impayés.');
    ctx.finding('année 1', 'INFO', 'La camionnette reprise en écriture manuelle n’est pas dans la liste des immobilisations : aucune dotation calculée pour elle.', 'Rattrapage → à-nouveaux avec 245 ; ouvrir Immobilisations.');
  },
};

// ---------------------------------------------------------------------------
// Dix formes de service, chacune avec son piège
// ---------------------------------------------------------------------------

const midYear = (year: number) => addDays('2026-01-05', year * 365 - 185);

const prestationPersonne: Profile = {
  key: 'coach', name: 'Coach sportif à domicile — Cape Town', forme: 'S1. Prestation à la personne (exercice mars→février, ZAR)',
  company: { currency: 'ZAR', country: 'ZA', chart: 'GENERIC', vatEnabled: true, vatRateBp: 1500, pricesIncludeTax: true, taxLabel: 'VAT', taxRegime: 'REEL', fiscalYearStart: '03-01', sector: 'services', tracksStock: false },
  products: [service('Séance 1 h', cm(450)), service('Bilan initial', cm(900)), service('Carnet 10 séances', cm(4000), 'carnet')],
  customers: ['Thandi', 'Mr Botha', 'Lerato', 'Ms Naidoo'],
  sales: { perDay: [2, 6], linesPerSale: [1, 1], qtyPerLine: [1, 1], methods: { CARD: 60, BANK: 30, CASH: 10 }, closedWeekday: 0 },
  expenses: [{ key: 'TRANSPORT', amount: cm(1800), day: 5 }, { key: 'SERVICES', amount: cm(600), day: 15 }],
  opening: { cash: cm(1000), mobile: 0, bank: cm(25000) },
  seed: 2001,
  trap: (ctx, range) => {
    // Carnets de 10 séances vendus : encaissés d'avance, comptés en produit le jour de la vente.
    const carnets = revenueOf(ctx, ['Carnet 10 séances'], range);
    // Hypothèse : en moyenne 4 séances sur 10 restent à faire à la clôture pour les carnets du dernier trimestre.
    const lastQuarter = revenueOf(ctx, ['Carnet 10 séances'], { from: addDays(range.to, -90), to: range.to });
    const deferred = Math.round(lastQuarter * 0.4);
    return { label: 'Carnets prépayés non consommés', falseRevenue: deferred, howRecorded: `Produit à la vente (compte ventes), ${carnets / 100} ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ».` };
  },
};

const intervention: Profile = {
  key: 'plombier', name: 'Plombier-chauffagiste — Manchester (avril→mars, GBP)', forme: 'S2. Intervention avec pièces, devis et acompte',
  company: { currency: 'GBP', country: 'GB', chart: 'GENERIC', vatEnabled: true, vatRateBp: 2000, pricesIncludeTax: false, taxLabel: 'VAT', taxRegime: 'REEL', fiscalYearStart: '04-06', sector: 'garage', tracksStock: true },
  products: [service('Main-d’œuvre (h)', cm(65), 'heure'), service('Déplacement', cm(40)), ...stockedProducts([['Chaudière compacte', cm(1400), cm(950), 4], ['Robinet thermostatique', cm(38), cm(19), 40], ['Tuyau cuivre (m)', cm(9), cm(5), 200]])],
  customers: ['Mrs Patel', 'Letting Agency', 'The Crown pub'], suppliers: ['Plumb Center'],
  sales: { perDay: [1, 4], linesPerSale: [1, 3], qtyPerLine: [1, 3], methods: { BANK: 60, CARD: 25, CREDIT: 15 }, closedWeekday: 0, creditSettleDays: 30 },
  purchases: { everyDays: 14, coverDays: 20, paidNow: 1 },
  expenses: [{ key: 'TRANSPORT', amount: cm(420), day: 3 }, { key: 'SERVICES', amount: cm(90), day: 20 }],
  opening: { cash: cm(500), mobile: 0, bank: cm(12000) },
  seed: 2002,
  yearly: (ctx, year) => {
    // Devis accepté avec acompte de 30 % pour une chaudière posée le mois suivant.
    const date = midYear(year);
    const p = ctx.products[2];
    const lines = [{ productId: p.id, name: p.name, qty: 1, unitPrice: p.price, unitCost: ctx.cost.get(p.id) ?? p.cost }, { productId: ctx.products[0].id, name: ctx.products[0].name, qty: 6, unitPrice: ctx.products[0].price, unitCost: 0 }];
    const t = saleTotals(ctx.db.company, lines, 0);
    const quote: Sale = { id: ctx.id(), number: `DV-${year}`, date, customerId: ctx.customers[0].id, customerName: ctx.customers[0].name, lines, discount: 0, vat: t.vat, total: t.total, paid: 0, method: 'BANK', status: 'QUOTE', cashier: 'Sim', createdAt: `${date}T10:00:00.000Z` };
    ctx.emit('sale.record', { sale: quote, ids: { movements: [], saleEntry: ctx.id(), cogsEntry: ctx.id(), debt: ctx.id() } }, date, 10);
    // L'acompte : aucun événement « acompte sur devis ». Le seul moyen : écriture manuelle.
    const deposit = Math.round(t.total * 0.3);
    const bankBefore = ctx.treasury('BANK', date);
    ctx.manual(date, `ACPT-${year}`, 'Acompte reçu sur devis', [{ key: 'BANK', debit: deposit }, { key: 'CUSTOMERS', credit: deposit }]);
    // Pose 25 jours plus tard : conversion du devis. L'application encaisse le total, elle ignore l'acompte.
    const day2 = addDays(date, 25);
    const ok = ctx.emit('quote.confirm', { saleId: quote.id, method: 'BANK', paid: t.total, number: `FA-DV-${year}`, date: day2, ids: { movements: [ctx.id(), ctx.id()], saleEntry: ctx.id(), cogsEntry: ctx.id(), debt: ctx.id() } }, day2, 10);
    if (ok) {
      ctx.stock.set(p.id, (ctx.stock.get(p.id) ?? 0) - 1);
      ctx.stock.set(ctx.products[0].id, (ctx.stock.get(ctx.products[0].id) ?? 0) - 6);
    }
    ctx.finding(`année ${year}`, 'MAJEUR', `Acompte de ${deposit / 100} sur devis : aucun écran ne le prend. Passé en écriture manuelle (banque ${bankBefore / 100} → +${deposit / 100}, compte clients créditeur). À la conversion du devis, l’application encaisse le total ${t.total / 100} : l’acompte est encaissé deux fois si la commerçante ne corrige pas à la main, et le compte clients reste créditeur de ${deposit / 100}.`, 'Devis → acompte (impossible) → convertir le devis : le montant encaissé proposé est le total.');
  },
  trap: (ctx, range) => {
    const cust = balanceOf(ctx.code('CUSTOMERS'), ctx.db.entries, 'DEBIT', range.from, range.to);
    return cust < 0 ? { label: 'Acomptes clients (compte clients créditeur)', falseRevenue: 0, howRecorded: `Compte clients créditeur de ${-cust / 100} à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative.` } : null;
  },
};

const missionLongue: Profile = {
  key: 'consultant', name: 'Cabinet de conseil — Abidjan', forme: 'S3. Mission longue (jalons, facturation d’avancement)',
  company: { ...XAF_REEL, country: 'CI', sector: 'services', tracksStock: false },
  products: [service('Jour de conseil', 250000, 'jour'), service('Atelier', 600000), service('Mission forfait 3 mois', 9000000, 'forfait')],
  customers: ['Ministère', 'Banque Atlantique', 'ONG Espoir'],
  sales: { perDay: [0, 1], linesPerSale: [1, 1], qtyPerLine: [1, 3], methods: { BANK: 50, CREDIT: 50 }, closedWeekday: 0, creditSettleDays: 60 },
  expenses: [{ key: 'RENT', amount: 450000, day: 1 }, { key: 'SERVICES', amount: 200000, day: 10 }, { key: 'TRANSPORT', amount: 300000, day: 20 }],
  staff: [{ name: 'Consultante senior', payKind: 'MONTHLY', rate: 1200000 }, { name: 'Junior', payKind: 'MONTHLY', rate: 450000 }],
  opening: { cash: 200000, mobile: 500000, bank: 15000000 },
  seed: 2003,
  yearly: (ctx, year) => {
    // Un forfait de 3 mois facturé et encaissé le 20 décembre : deux mois et demi de travail sur l'exercice suivant.
    const date = `${2026 + year - 1}-12-20`;
    const p = ctx.products[2];
    ctx.sale(date, [{ product: p, qty: 1 }], 'BANK', ctx.customers[0], 1);
  },
  trap: (ctx, range) => {
    const forfaits = revenueOf(ctx, ['Mission forfait 3 mois'], { from: addDays(range.to, -15), to: range.to });
    return { label: 'Forfait 3 mois facturé le 20 décembre', falseRevenue: Math.round(forfaits * (2.5 / 3)), howRecorded: `Produit intégral au jour de la facture (${forfaits.toLocaleString('fr-FR')} HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain.` };
  },
};

const projetMateriel: Profile = {
  key: 'evenementiel', name: 'Sonorisation d’événements — Dakar', forme: 'S4. Projet avec matériel (immobilisations, amortissement)',
  company: { ...XAF_REEL, country: 'SN', vatRateBp: 1800, sector: 'services', tracksStock: false },
  products: [service('Sono mariage', 350000, 'événement'), service('Sono concert', 1200000, 'événement'), service('Location micro (jour)', 15000, 'jour')],
  customers: ['Mairie', 'Agence Teranga', 'Famille Diop'],
  sales: { perDay: [0, 2], linesPerSale: [1, 2], qtyPerLine: [1, 2], methods: { MOBILE: 40, BANK: 30, CASH: 20, CREDIT: 10 } },
  expenses: [{ key: 'TRANSPORT', amount: 120000, day: 5 }, { key: 'SERVICES', amount: 60000, day: 15 }],
  staff: [{ name: 'Technicien', payKind: 'DAILY', rate: 15000 }],
  opening: { cash: 300000, mobile: 500000, bank: 12000000 },
  seed: 2004,
  yearly: (ctx, year) => {
    const date = midYear(year);
    if (year === 1 || year === 4 || year === 7) {
      // Achat d'une sono 6 000 000, amortie sur 5 ans, avec dotations mensuelles.
      const asset = { id: ctx.id(), name: `Système de sonorisation ${year}`, category: 'Matériel et outillage', acquiredOn: date, cost: 6000000, salvage: 0, months: 60, method: 'LINEAR' as const, status: 'ACTIVE' as const, notes: '', createdAt: `${date}T10:00:00.000Z` };
      ctx.emit('asset.save', { asset, entryId: ctx.id(), paidWith: 'BANK' }, date, 10);
    }
    // Dotation annuelle, passée à la main comme le ferait la commerçante : une par bien actif, 1/60 par mois.
    const dotDate = `${2026 + year - 1}-12-31`;
    const items = ctx.db.assets.filter((a) => a.status === 'ACTIVE').map((a) => {
      const months = Math.min(12, Math.max(0, monthsBetween(a.acquiredOn, dotDate)));
      return { id: ctx.id(), assetId: a.id, amount: Math.round((a.cost - a.salvage) * months / a.months) };
    }).filter((i) => i.amount > 0);
    if (items.length) ctx.emit('depreciation.run', { period: String(2026 + year - 1), items, date: dotDate, entryId: ctx.id() }, dotDate, 18);
    if (year === 1) ctx.finding('année 1', 'INFO', 'La dotation aux amortissements n’est pas automatique à la clôture : si la gérante ne lance pas « dotation », l’exercice se clôt sans amortissement et le résultat est surestimé de 1 200 000 par sono et par an.', 'Immobilisations → ajouter une sono → clôturer sans passer par « dotation ».');
  },
  trap: (ctx, range) => {
    const active = ctx.db.assets.filter((a) => a.status === 'ACTIVE' && a.acquiredOn <= range.to);
    const due = active.reduce((s, a) => s + Math.round(a.cost * Math.min(12, monthsBetween(a.acquiredOn, range.to)) / a.months), 0);
    const posted = ctx.db.depreciations.filter((d) => d.period === range.from.slice(0, 4)).reduce((s, d) => s + d.amount, 0);
    return { label: 'Amortissement de l’exercice', falseRevenue: due - posted, howRecorded: `Dotation due ${due.toLocaleString('fr-FR')}, passée ${posted.toLocaleString('fr-FR')} (saisie à la main dans la simulation).` };
  },
};

function monthsBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) + (b.getUTCDate() >= a.getUTCDate() ? 1 : 0);
}

const coursAbonnements: Profile = {
  key: 'ecole', name: 'École de langues — Addis-Abeba (juillet→juin, ETB)', forme: 'S5. Cours et abonnements (produits constatés d’avance)',
  company: { currency: 'ETB', country: 'ET', chart: 'GENERIC', vatEnabled: true, vatRateBp: 1500, pricesIncludeTax: true, taxLabel: 'VAT', taxRegime: 'REEL', fiscalYearStart: '07-08', sector: 'services', tracksStock: false },
  products: [service('Trimestre anglais', cm(6000), 'trimestre'), service('Année complète', cm(20000), 'an'), service('Cours particulier (h)', cm(400), 'heure')],
  customers: ['Famille Bekele', 'Famille Tesfaye', 'Entreprise Awash', 'Famille Haile'],
  sales: { perDay: [1, 4], linesPerSale: [1, 1], qtyPerLine: [1, 2], methods: { BANK: 50, MOBILE: 30, CASH: 20 }, closedWeekday: 0 },
  expenses: [{ key: 'RENT', amount: cm(15000), day: 1 }, { key: 'UTILITIES', amount: cm(2500), day: 10 }],
  staff: [{ name: 'Professeure 1', payKind: 'MONTHLY', rate: cm(9000) }, { name: 'Professeur 2', payKind: 'MONTHLY', rate: cm(9000) }],
  opening: { cash: cm(5000), mobile: cm(10000), bank: cm(150000) },
  seed: 2005,
  yearly: (ctx, year) => {
    // Rentrée : 30 inscriptions à l'année encaissées en juin (fin d'exercice) pour des cours de septembre à juin.
    const date = `${2026 + year}-06-20`;
    for (let i = 0; i < 30; i += 1) ctx.sale(date, [{ product: ctx.products[1], qty: 1 }], i % 2 ? 'BANK' : 'MOBILE', ctx.pick(ctx.customers), 1, 9 + (i % 8));
  },
  trap: (ctx, range) => {
    const annual = revenueOf(ctx, ['Année complète'], { from: addDays(range.to, -30), to: range.to });
    return { label: 'Inscriptions annuelles encaissées en juin', falseRevenue: annual, howRecorded: `${(annual / 100).toLocaleString('fr-FR')} ETB HT en produit de l’exercice clos le ${range.to} alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance.` };
  },
};

const location: Profile = {
  key: 'location', name: 'Location de matériel de chantier — Bamako', forme: 'S6. Location (dépôt de garantie)',
  company: { ...XAF, country: 'ML', currency: 'XOF', sector: 'services', tracksStock: false, taxRegime: 'IGS' },
  products: [service('Bétonnière (jour)', 15000, 'jour'), service('Échafaudage (semaine)', 45000, 'semaine'), service('Groupe électrogène (jour)', 25000, 'jour'), service('Dépôt de garantie', 100000, 'dépôt')],
  customers: ['Entreprise Keita', 'Maçon Coulibaly', 'Chantier Hôpital', 'Particulier Traoré'],
  sales: { perDay: [1, 4], linesPerSale: [1, 2], qtyPerLine: [1, 7], methods: { CASH: 50, MOBILE: 40, CREDIT: 10 } },
  expenses: [{ key: 'RENT', amount: 120000, day: 1 }, { key: 'SERVICES', amount: 80000, day: 12 }],
  staff: [{ name: 'Gardien', payKind: 'MONTHLY', rate: 60000 }],
  opening: { cash: 200000, mobile: 300000, bank: 5000000 },
  seed: 2006,
  yearly: (ctx, year) => {
    // Chaque année, 12 dépôts de garantie encaissés via l'article « Dépôt de garantie » (seule voie sans écriture manuelle) ; 9 restitués en espèces.
    const date = midYear(year);
    for (let i = 0; i < 12; i += 1) ctx.sale(addDays(date, i), [{ product: ctx.products[3], qty: 1 }], 'CASH', ctx.pick(ctx.customers), 1);
    for (let i = 0; i < 9; i += 1) ctx.expense(addDays(date, 20 + i), 'MISC_EXPENSE', 100000, 'CASH', 'Restitution dépôt de garantie');
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Aucun écran pour un dépôt de garantie : encaissé comme une vente (produit), restitué comme une dépense (charge). Le bilan ne montre aucune dette envers les clients pour les dépôts détenus.', 'Louer une bétonnière avec caution : chercher « caution » ou « dépôt » dans la caisse.');
  },
  trap: (ctx, range) => {
    const deposits = revenueOf(ctx, ['Dépôt de garantie'], range);
    return { label: 'Dépôts de garantie encaissés', falseRevenue: deposits, howRecorded: `${deposits.toLocaleString('fr-FR')} en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé.` };
  },
};

const transport: Profile = {
  key: 'agence', name: 'Agence de voyages — Casablanca', forme: 'S7. Transport / voyage (encaissement pour le compte de tiers)',
  company: { currency: 'MAD', country: 'MA', chart: 'GENERIC', vatEnabled: true, vatRateBp: 2000, pricesIncludeTax: true, taxLabel: 'TVA', taxRegime: 'REEL', fiscalYearStart: '01-01', sector: 'services', tracksStock: false },
  products: [service('Billet d’avion (vendu pour la compagnie)', cm(4500), 'billet'), service('Frais de service', cm(250)), service('Forfait Omra', cm(18000), 'forfait')],
  customers: ['M. Alaoui', 'Société Atlas', 'Famille Benani'],
  sales: { perDay: [2, 8], linesPerSale: [1, 2], qtyPerLine: [1, 2], methods: { CARD: 50, BANK: 30, CASH: 20 } },
  expenses: [{ key: 'RENT', amount: cm(6000), day: 1 }, { key: 'SERVICES', amount: cm(1200), day: 10 }],
  staff: [{ name: 'Agent', payKind: 'MONTHLY', rate: cm(5500) }],
  opening: { cash: cm(3000), mobile: 0, bank: cm(120000) },
  seed: 2007,
  yearly: (ctx, year) => {
    // Reversement aux compagnies : 92 % des billets encaissés, passés en charge « services ».
    const range = { from: `${2026 + year - 1}-01-01`, to: `${2026 + year - 1}-12-31` };
    const billets = revenueOf(ctx, ['Billet d’avion (vendu pour la compagnie)'], range);
    const due = Math.round(billets * 0.92 * 1.2);
    if (due > 0 && ctx.treasury('BANK', range.to) >= due) ctx.expense(`${2026 + year - 1}-12-28`, 'SERVICES', due, 'BANK', 'Reversement compagnies');
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Un billet vendu pour une compagnie entre en chiffre d’affaires pour son prix total ; le reversement à la compagnie part en charge. Le CA affiché est celui d’un grossiste, pas d’une agence : la TVA collectée est calculée sur le prix du billet.', 'Vendre un billet 4 500 : lire Ventes du mois et TVA collectée.');
  },
  trap: (ctx, range) => {
    const billets = revenueOf(ctx, ['Billet d’avion (vendu pour la compagnie)'], range);
    return { label: 'Billets encaissés pour le compte des compagnies', falseRevenue: Math.round(billets * 0.92), howRecorded: `${(billets / 100).toLocaleString('fr-FR')} MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers.` };
  },
};

const atelier: Profile = {
  key: 'garage', name: 'Garage mécanique — Lomé', forme: 'S8. Atelier sur bien confié (véhicule du client, pièces en dépôt)',
  company: { ...XAF, country: 'TG', currency: 'XOF', sector: 'garage', tracksStock: true, taxRegime: 'IGS' },
  products: [service('Main-d’œuvre (h)', 5000, 'heure'), service('Vidange', 15000), ...stockedProducts([['Huile moteur 5 L', 18000, 12500, 30], ['Plaquettes', 25000, 16000, 20], ['Batterie', 65000, 48000, 8], ['Filtre', 6000, 3500, 40]])],
  customers: ['Taxi Kodjo', 'Société Sotral', 'Mme Adjo'], suppliers: ['Pièces Auto Lomé'],
  sales: { perDay: [2, 7], linesPerSale: [1, 3], qtyPerLine: [1, 2], methods: { CASH: 55, MOBILE: 35, CREDIT: 10 }, closedWeekday: 0 },
  purchases: { everyDays: 10, coverDays: 15, paidNow: 1 },
  expenses: [{ key: 'RENT', amount: 100000, day: 1 }, { key: 'UTILITIES', amount: 30000, day: 10 }],
  staff: [{ name: 'Mécanicien', payKind: 'DAILY', rate: 5000 }, { name: 'Apprenti', payKind: 'DAILY', rate: 1500 }],
  opening: { cash: 200000, mobile: 200000, bank: 1500000 },
  seed: 2008,
  yearly: (ctx, year) => {
    // Le client apporte sa propre batterie : le garage ne la possède pas. Rien ne distingue « pièce du client » ; on vend la main-d'œuvre seule.
    // Véhicule immobilisé 3 semaines dont la réparation est à cheval sur la clôture : travail fait, non facturé.
    const date = `${2026 + year - 1}-12-18`;
    ctx.sale(date, [{ product: ctx.products[0], qty: 8 }], 'CREDIT', ctx.customers[1], 0);
    if (year === 1) ctx.finding('année 1', 'INFO', 'Les prestations ont un stock qui descend sous zéro dans un garage (stock activé pour les pièces).', 'Garage → vendre « Vidange » → fiche article.');
  },
  trap: (ctx, range) => {
    // Travaux en cours au 31/12 : 8 h de main-d'œuvre commencées mais non finies et déjà facturées à crédit (le 18/12), plus des travaux non facturés estimés à 5 h.
    const facture = revenueOf(ctx, ['Main-d’œuvre (h)'], { from: `${range.to.slice(0, 4)}-12-18`, to: range.to });
    return { label: 'Travaux en cours à la clôture', falseRevenue: Math.round(facture * 0.5), howRecorded: `Facture de ${facture.toLocaleString('fr-FR')} HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées.` };
  },
};

const sante: Profile = {
  key: 'clinique', name: 'Cabinet dentaire — Kigali', forme: 'S9. Santé réglementée (tiers payant, actes multi-séances)',
  company: { currency: 'RWF', country: 'RW', chart: 'GENERIC', vatEnabled: true, vatRateBp: 1800, pricesIncludeTax: true, taxLabel: 'VAT', taxRegime: 'REEL', fiscalYearStart: '01-01', sector: 'health', tracksStock: true },
  products: [service('Consultation', 15000), service('Détartrage', 30000), service('Prothèse (3 séances)', 450000, 'traitement'), ...stockedProducts([['Composite (seringue)', 0, 22000, 20], ['Gants (boîte)', 0, 8000, 30], ['Anesthésique', 0, 3500, 100]])],
  customers: ['RSSB (assurance)', 'Radiant Insurance', 'Patient direct'], suppliers: ['Dental Supplies Ltd'],
  sales: { perDay: [4, 12], linesPerSale: [1, 1], qtyPerLine: [1, 1], methods: { MOBILE: 40, CARD: 20, CREDIT: 40 }, closedWeekday: 0, creditSettleDays: 75 },
  purchases: { everyDays: 20, coverDays: 25, paidNow: 1 },
  expenses: [{ key: 'RENT', amount: 600000, day: 1 }, { key: 'UTILITIES', amount: 150000, day: 10 }],
  staff: [{ name: 'Dentiste associée', payKind: 'MONTHLY', rate: 1500000 }, { name: 'Assistante', payKind: 'MONTHLY', rate: 300000 }],
  opening: { cash: 500000, mobile: 2000000, bank: 20000000 },
  seed: 2009,
  yearly: (ctx, year) => {
    // Le 15 décembre : 6 prothèses encaissées à la première séance, deux séances restantes en janvier.
    const date = `${2026 + year - 1}-12-15`;
    for (let i = 0; i < 6; i += 1) ctx.sale(date, [{ product: ctx.products[2], qty: 1 }], i % 2 ? 'MOBILE' : 'CARD', ctx.customers[2], 1, 9 + i);
    // Consultation gratuite (journée de dépistage) : ticket à zéro.
    const free = { ...ctx.products[0], price: 0 };
    ctx.sale(midYear(year), [{ product: free, qty: 1 }], 'CASH', null, 1, 11);
    if (year === 1) {
      const gants = ctx.db.products.find((p) => p.name === 'Gants (boîte)');
      ctx.finding('année 1', 'INFO', `Consommables (gants, composite) à prix de vente 0 : ils ne se vendent pas, ils se consomment. Ils ne sortent jamais du stock (stock gants = ${gants?.stock}) car aucune vente ne les porte ; le stock au bilan gonfle d’un achat à l’autre.`, 'Acheter des gants ; faire des consultations ; lire Stock → gants.');
      ctx.finding('année 1', 'INFO', 'Le tiers payant (assurance qui règle 75 jours plus tard) passe par « vente à crédit » au nom de l’assureur : rien ne relie l’acte au patient ET à l’assureur ; pas de bordereau de facturation par assureur.', 'Ventes → vente à crédit « RSSB » → chercher le patient.');
    }
  },
  trap: (ctx, range) => {
    const prot = revenueOf(ctx, ['Prothèse (3 séances)'], { from: `${range.to.slice(0, 4)}-12-01`, to: range.to });
    return { label: 'Traitements multi-séances encaissés en décembre', falseRevenue: Math.round(prot * 2 / 3), howRecorded: `${prot.toLocaleString('fr-FR')} RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement.` };
  },
};

const elevage: Profile = {
  key: 'elevage', name: 'Ferme avicole — Bouaké', forme: 'S10. Personnel posté / élevage (stock vivant, cycle de 45 jours)',
  company: { ...XAF, country: 'CI', currency: 'XOF', sector: 'retail', tracksStock: true, taxRegime: 'NONE' },
  products: stockedProducts([['Poulet de chair (vif)', 3500, 0, 0], ['Œufs (plateau)', 2500, 1200, 0], ['Fientes (sac)', 1000, 0, 0]], 'unité'),
  customers: ['Rôtisserie Bouaké', 'Marché gros', 'Hôtel Ran'], suppliers: ['Provenderie Ivograin', 'Couvoir Yamoussoukro'],
  sales: { perDay: [1, 5], linesPerSale: [1, 2], qtyPerLine: [10, 80], methods: { CASH: 40, MOBILE: 40, CREDIT: 20 }, creditSettleDays: 15 },
  expenses: [{ key: 'UTILITIES', amount: 60000, day: 8 }],
  staff: [{ name: 'Ouvrier jour', payKind: 'DAILY', rate: 2500 }, { name: 'Ouvrier nuit', payKind: 'DAILY', rate: 3000 }, { name: 'Vétérinaire vacataire', payKind: 'HOURLY', rate: 5000 }],
  opening: { cash: 300000, mobile: 500000, bank: 4000000 },
  seed: 2010,
  daily: (ctx, date, day) => {
    // Une bande tous les 45 jours : 1 000 poussins achetés (600 chacun), 2 000 000 d'aliment à J+20, 6 % de mortalité à J+30.
    const poussins = ctx.products[0];
    const phase = day % 45;
    if (phase === 5 && ctx.ensureCash(date, 600000, 7, 45)) ctx.purchase(date, [{ product: poussins, qty: 1000, unitCost: 600 }], ctx.suppliers[1], 1, 1);
    if (phase === 25) {
      // Aliment : dépense, pas stock — l'application ne sait pas capitaliser l'aliment dans le poulet.
      const method = ctx.treasury('BANK', date) >= 2000000 ? 'BANK' : ctx.treasury('MOBILE_MONEY', date) >= 2000000 ? 'MOBILE' : 'CASH';
      if (method !== 'CASH' || ctx.ensureCash(date, 2000000, 7, 45)) ctx.expense(date, 'PURCHASES', 2000000, method, 'Aliment volaille');
    }
    if (phase === 35) {
      const have = ctx.stock.get(poussins.id) ?? 0;
      if (have >= 60) ctx.adjust(poussins, date, -60, 'Mortalité');
    }
    // Œufs : la pondeuse produit 40 plateaux par semaine sans achat : entrée par ajustement.
    if (day % 7 === 0) ctx.adjust(ctx.products[1], date, 40, 'Ponte');
  },
  yearly: (ctx, year) => {
    if (year === 1) ctx.finding('année 1', 'MAJEUR', 'Stock vivant : le poussin acheté 600 vaut 600 au bilan jusqu’à la vente à 45 jours ; l’aliment (2 000 000 par bande) part en charge le jour de l’achat. À la clôture, une bande en cours est au bilan pour ses 600 × 940 = 564 000 alors qu’elle a coûté 2 564 000. Les œufs entrent en stock par ajustement à leur coût unitaire de 1 200 saisi à la main : produit d’ajustement en résultat.', 'Acheter 1 000 poussins, 2 000 000 d’aliment ; lire le bilan avant la vente.');
  },
  trap: (ctx, range) => {
    // Bande en cours à la clôture : aliment consommé et non capitalisé.
    // Une bande est toujours en cours au 31/12 (cycle de 45 jours).
    const feedInProgress = 2000000;
    const eggs = ctx.db.entries.filter((e) => e.date >= range.from && e.date <= range.to && e.label.includes('Ponte')).reduce((s, e) => s + e.lines.filter((l) => l.account === ctx.code('INVENTORY_CHANGE')).reduce((t, l) => t + l.credit, 0), 0);
    return { label: 'Bande en cours + ponte en produit d’ajustement', falseRevenue: eggs - feedInProgress, howRecorded: `Ponte entrée par ajustement = ${eggs.toLocaleString('fr-FR')} en produit divers avant toute vente ; aliment d’une bande en cours ${feedInProgress.toLocaleString('fr-FR')} en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré.` };
  },
};

export const PROFILES: Profile[] = [
  boutique, superette, restaurant, jus, pharmacie, electronique, salon, ambulant, importExport, pmeFrance, reprise,
  prestationPersonne, intervention, missionLongue, projetMateriel, coursAbonnements, location, transport, atelier, sante, elevage,
];

export type { AccountKey, TrapReport };
