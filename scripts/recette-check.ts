/**
 * Plat préparé : vendre un plat sort ses ingrédients, pas le plat.
 *
 *   npx vite-node scripts/recette-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import type { DB, Product, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: '2026-09-18T12:00:00.000Z', actorId: 'u', actorName: 'Awa', type, payload });

const article = (o: Partial<Product> & { id: string; name: string }): Product => ({
  sku: o.id, barcode: '', category: '', brand: '', price: 0, cost: 0, stock: 0, reorderPoint: 0,
  unit: 'pièce', createdAt: '2026-09-01', ...o,
});

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'food', onboarded: true } }));
const stockAvant = balanceOf(accountCode('SYSCOHADA', 'INVENTORY'), db.entries, 'DEBIT');

db = applyEvent(db, ev('product.save', { product: article({ id: 'riz', name: 'Riz (portion)', cost: 200, price: 0, stock: 100, unit: 'portion' }), movementId: 'm-riz', entryId: 'j-riz' }));
db = applyEvent(db, ev('product.save', { product: article({ id: 'sauce', name: 'Sauce (louche)', cost: 100, price: 0, stock: 50, unit: 'louche' }), movementId: 'm-sauce', entryId: 'j-sauce' }));
db = applyEvent(db, ev('product.save', {
  product: article({ id: 'dg', name: 'Poulet DG', price: 2500, cost: 0, stock: 0, components: [{ productId: 'riz', qty: 1 }, { productId: 'sauce', qty: 2 }] }),
  movementId: 'm-dg', entryId: 'j-dg',
}));

// Trois plats vendus. L'appareil envoie un coût faux exprès : le moteur doit le refaire.
const lines = [{ productId: 'dg', name: 'Poulet DG', qty: 3, unitPrice: 2500, unitCost: 9999 }];
const t = saleTotals(db.company, lines, 0);
const sale: Sale = { id: 'v1', number: 'FA-00001', date: '2026-09-18', customerId: null, customerName: '', lines, discount: 0, vat: t.vat, total: t.total, paid: t.total, method: 'CASH', status: 'CONFIRMED', cashier: 'Awa', createdAt: '2026-09-18T12:00:00.000Z' };
db = applyEvent(db, ev('sale.record', { sale, ids: { movements: [], saleEntry: 'j1', cogsEntry: 'c1', debt: 'd1' } }));

const stockDe = (id: string) => db.products.find((p) => p.id === id)!.stock;
check(stockDe('riz') === 97, `le riz a baissé de trois portions (${stockDe('riz')} restantes)`);
check(stockDe('sauce') === 44, `la sauce a baissé de six louches (${stockDe('sauce')} restantes)`);
check(stockDe('dg') === 0, `le plat lui-même n'a pas de stock à entamer (${stockDe('dg')})`);

const cout = balanceOf(accountCode('SYSCOHADA', 'INVENTORY_CHANGE'), db.entries, 'DEBIT');
check(cout === 1200, `le coût des marchandises vaut celui des ingrédients : 3 × (200 + 2×100) = 1 200 (obtenu ${cout})`);
check(db.sales[0].lines[0].unitCost === 400, `le coût faux envoyé par l'appareil a été refait (${db.sales[0].lines[0].unitCost})`);

const sorties = db.movements.filter((m) => m.ref === 'FA-00001');
check(sorties.length === 2 && sorties.every((m) => m.reason.includes('Poulet DG')), `deux sorties de stock, chacune disant pour quel plat (${sorties.map((m) => `${m.productName} ${m.qty}`).join(' / ')})`);

const stockApres = balanceOf(accountCode('SYSCOHADA', 'INVENTORY'), db.entries, 'DEBIT');
check(stockApres === stockAvant + 100 * 200 + 50 * 100 - 1200, `le compte de stock suit la même valeur (${stockApres})`);
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');

// Un article ordinaire n'est pas touché.
db = applyEvent(db, ev('product.save', { product: article({ id: 'coca', name: 'Coca', cost: 300, price: 500, stock: 24 }), movementId: 'm-coca', entryId: 'j-coca' }));
const l2 = [{ productId: 'coca', name: 'Coca', qty: 2, unitPrice: 500, unitCost: 300 }];
const t2 = saleTotals(db.company, l2, 0);
db = applyEvent(db, ev('sale.record', { sale: { ...sale, id: 'v2', number: 'FA-00002', lines: l2, vat: t2.vat, total: t2.total, paid: t2.total }, ids: { movements: [], saleEntry: 'j2', cogsEntry: 'c2', debt: 'd2' } }));
check(stockDe('coca') === 22, `un article revendu tel quel sort normalement (${stockDe('coca')})`);
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan toujours équilibré');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
