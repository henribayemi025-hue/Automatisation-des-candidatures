/**
 * « Publier sur Finjaro » et le stock qui suit (contrat du 14/10, B3).
 *
 *   npx vite-node scripts/publier-finjaro-check.ts
 *
 * 1. Ce qu'on publie : pas de plat composé, pas de prestation, pas d'article
 *    archivé ; le prix est celui que la cliente paie ; le stock est entier et
 *    jamais négatif.
 * 2. Ce qu'on synchronise : seuls les articles publiés dont le stock a changé
 *    depuis le dernier envoi ; tout part à l'ouverture.
 * 3. Point C : une vente livrée sur Finjaro d'un article publié reprend le
 *    coût de la fiche ; la vente ne demande plus de coût ; une ligne sans
 *    fiche (livraison) reste à compléter.
 */
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { buyerPrice, catalogStock, publishable, stockChanges } from '../src/lib/finjaro-catalog';
import { needsCost } from '../src/lib/liaison';
import type { DB, Product, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};
const ev = (id: string, type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id, at: '2026-10-19T09:00:00.000Z', actorId: 'u', actorName: 'Awa', type, payload });

const base = { sku: '', barcode: '', category: '', brand: '', reorderPoint: 0, unit: 'pièce' };
const sac: Product = { ...base, id: 'p-sac', name: 'Sac en raphia', kind: 'GOODS', price: 12000, cost: 7000, stock: 8 };
const riz: Product = { ...base, id: 'p-riz', name: 'Riz', kind: 'GOODS', price: 800, cost: 500, stock: 20.5 };
const plat: Product = { ...base, id: 'p-plat', name: 'Riz sauce', kind: 'GOODS', price: 2500, cost: 0, stock: 0, components: [{ productId: 'p-riz', qty: 0.5 }] };
const pose: Product = { ...base, id: 'p-pose', name: 'Pose d’ongles', kind: 'SERVICE', price: 10000, cost: 0, stock: 0 };

// 1. Ce qu'on publie.
check(publishable(sac) && publishable(riz), 'une marchandise se publie');
check(!publishable(plat), 'un plat composé ne se publie pas (stock tiré des ingrédients)');
check(!publishable(pose), 'une prestation ne se publie pas');
check(!publishable({ ...sac, archived: true }), 'un article archivé ne se publie pas');
check(catalogStock(20.5) === 20 && catalogStock(-3) === 0 && catalogStock(NaN) === 0, 'stock publié : entier, jamais négatif');

let db: DB = emptyDB();
db = applyEvent(db, ev('e0', 'company.update', { patch: { name: 'Awa Créations', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
check(buyerPrice(db.company, sac) === 12000, 'sans taxe : le prix de la fiche');
const ht = { ...db.company, vatEnabled: true, vatRateBp: 1925, pricesIncludeTax: false };
check(buyerPrice(ht, sac) === 12000 + Math.round(12000 * 0.1925), 'prix saisis hors taxe : la cliente paie le prix taxe comprise');
check(buyerPrice({ ...ht, pricesIncludeTax: true }, sac) === 12000, 'prix saisis taxe comprise : inchangé');

// 2. Ce qu'on synchronise.
const published = new Set(['p-sac', 'p-riz']);
const sent = new Map<string, number>();
const first = stockChanges([sac, riz, plat], published, sent);
check(first.length === 2 && first.find((x) => x.ref === 'p-riz')?.stock === 20, 'à l’ouverture : tous les articles publiés partent, en entiers');
for (const c of first) sent.set(c.ref, c.stock);
check(stockChanges([sac, riz], published, sent).length === 0, 'rien n’a bougé : rien ne part');
const apres = stockChanges([{ ...sac, stock: 7 }, { ...riz, stock: 20.2 }], published, sent);
check(apres.length === 1 && apres[0].ref === 'p-sac' && apres[0].stock === 7, 'une vente d’un sac : seul le sac part ; 20,5 → 20,2 reste 20, rien ne part');
check(stockChanges([{ ...plat, stock: 3 }], published, sent).length === 0, 'un article non publié ne part jamais');

// 3. Point C : coût repris de la fiche.
db = applyEvent(db, ev('e1', 'product.save', { product: sac, movementId: 'm0' }));
const lines = [
  { productId: 'p-sac', name: 'Sac en raphia', qty: 2, unitPrice: 12000, unitCost: 0 },
  { productId: '', name: 'Livraison', qty: 1, unitPrice: 1000, unitCost: 0 },
];
const tot = saleTotals(db.company, lines, 0);
const sale: Sale = {
  id: 'o1', number: 'FJ-TEST02', date: '2026-10-19', customerId: null, customerName: 'Acheteuse Finjaro',
  lines, discount: 0, vat: tot.vat, total: tot.total, paid: tot.total, method: 'CASH', status: 'CONFIRMED',
  cashier: 'Finjaro', createdAt: '2026-10-19T09:00:00.000Z', source: 'finjaro',
};
db = applyEvent(db, ev('e2', 'sale.record', { sale, ids: { movements: ['m1'], saleEntry: 'o1-v', cogsEntry: 'o1-c', debt: 'o1-d' } }));
const s = db.sales.find((x) => x.id === 'o1')!;
check(s.lines[0].unitCost === 7000, 'ligne du sac : coût de la fiche repris (7 000)');
check(s.lines[1].unitCost === 0, 'ligne « Livraison » sans fiche : coût laissé à compléter');
check(db.products.find((p) => p.id === 'p-sac')!.stock === 6, 'le stock du sac baisse de 2 à la livraison');

const seul: Sale = { ...sale, id: 'o2', number: 'FJ-TEST03', lines: [{ ...lines[0], qty: 1 }], total: 12000, paid: 12000, vat: 0 };
db = applyEvent(db, ev('e3', 'sale.record', { sale: seul, ids: { movements: ['m2'], saleEntry: 'o2-v', cogsEntry: 'o2-c', debt: 'o2-d' } }));
check(!needsCost(db.sales.find((x) => x.id === 'o2')!), 'une vente d’un article publié ne demande plus de coût');

const comptoir: Sale = { ...seul, id: 'o3', number: 'T-1', source: undefined, lines: [{ ...lines[0], qty: 1, unitCost: 0 }] };
db = applyEvent(db, ev('e4', 'sale.record', { sale: comptoir, ids: { movements: ['m3'], saleEntry: 'o3-v', cogsEntry: 'o3-c', debt: 'o3-d' } }));
check(db.sales.find((x) => x.id === 'o3')!.lines[0].unitCost === 0, 'une vente au comptoir n’est pas touchée (règle réservée aux ventes Finjaro)');

if (failures) {
  console.log(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log('\nTout est bon.');
