/**
 * Vente rapide : une vente sans fiche article doit rester comptablement juste.
 *
 *   npx vite-node scripts/vente-rapide-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import { startChecklist } from '../src/lib/guide';
import type { DB, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at = '2026-09-18T09:00:00.000Z'): WorkspaceEvent =>
  ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'Awa', type, payload });

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'food', onboarded: true } }));

// L'ordre de la liste de démarrage : la première vente passe avant les fiches.
const steps = startChecklist(db).map((s) => s.id);
check(steps.indexOf('sale') < steps.indexOf('products'), `la première vente est demandée avant les fiches articles (${steps.join(' → ')})`);

// La vente rapide : une ligne sans productId, 500 en espèces.
const lines = [{ productId: '', name: 'Beignets', qty: 1, unitPrice: 500, unitCost: 0 }];
const tot = saleTotals(db.company, lines, 0);
const sale: Sale = {
  id: 's1', number: 'FA-K7X-00001', date: '2026-09-18', customerId: null, customerName: '',
  lines, discount: 0, vat: tot.vat, total: tot.total, paid: tot.total,
  method: 'CASH', status: 'CONFIRMED', cashier: 'Awa', createdAt: '2026-09-18T09:00:00.000Z',
};
db = applyEvent(db, ev('sale.record', { sale, ids: { movements: [], saleEntry: 'j1', cogsEntry: 'c1', debt: 'd1' } }));

check(db.sales.length === 1, 'la vente est enregistrée sans aucune fiche article');
check(db.products.length === 0, 'aucun article n’a été créé au passage');
check(balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 500, '500 entrés en caisse');
check(balanceOf(accountCode('SYSCOHADA', 'SALES'), db.entries, 'CREDIT') === 500 - tot.vat, 'la recette est au compte de ventes');
check(balanceOf(accountCode('SYSCOHADA', 'INVENTORY'), db.entries, 'DEBIT') === 0, 'aucun mouvement de stock');
check(balanceOf(accountCode('SYSCOHADA', 'INVENTORY_CHANGE'), db.entries, 'DEBIT') === 0, 'aucun coût des marchandises inventé');
check(db.movements.length === 0, 'aucun mouvement d’inventaire');

const bilan = balanceSheet(db.accounts, db.entries);
check(bilan.difference === 0, `bilan équilibré (écart ${bilan.difference})`);

// Un mélange : la même vente avec une fiche article et une ligne libre.
db = applyEvent(db, ev('product.save', { product: { id: 'p1', name: 'Jus', sku: 'J', barcode: '', category: '', brand: '', price: 300, cost: 200, stock: 10, reorderPoint: 0, unit: 'pièce', createdAt: '2026-09-18' }, movementId: 'm0', entryId: 'j0' }));
const mix = [
  { productId: 'p1', name: 'Jus', qty: 2, unitPrice: 300, unitCost: 200 },
  { productId: '', name: 'Livraison', qty: 1, unitPrice: 400, unitCost: 0 },
];
const tot2 = saleTotals(db.company, mix, 0);
const sale2: Sale = { ...sale, id: 's2', number: 'FA-K7X-00002', lines: mix, vat: tot2.vat, total: tot2.total, paid: tot2.total };
db = applyEvent(db, ev('sale.record', { sale: sale2, ids: { movements: ['m1'], saleEntry: 'j2', cogsEntry: 'c2', debt: 'd2' } }));

check(db.products[0].stock === 8, `le stock de l’article suit (${db.products[0].stock} restants), la ligne libre n’y touche pas`);
const achats = balanceOf(accountCode('SYSCOHADA', 'INVENTORY_CHANGE'), db.entries, 'DEBIT');
console.log('       (coût des ventes :', achats, ')');
check(achats === 400, `le coût des marchandises ne compte que la ligne avec fiche (attendu 400, obtenu ${achats})`);
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan toujours équilibré après le mélange');

// Un montant vide ou négatif ne doit rien produire : vérifié côté écran, ici on
// contrôle au moins que le total d'une ligne à zéro reste nul.
check(saleTotals(db.company, [{ productId: '', name: 'Vente', qty: 1, unitPrice: 0, unitCost: 0 }], 0).total === 0, 'un montant à zéro donne un total nul');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
