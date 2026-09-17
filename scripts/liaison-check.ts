/**
 * Liaison place de marché → Accounting : une commande livrée devient une vente,
 * jamais deux fois, sans toucher au stock quand l'article n'est pas relié.
 *   npx vite-node scripts/liaison-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import type { DB, WorkspaceEvent } from '../src/lib/types';
let failures = 0;
const check = (ok: boolean, label: string) => { console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`); if (!ok) failures += 1; };
let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at: string): WorkspaceEvent => ({ id: `e${++seq}`, at, actorId: 'owner-uuid', actorName: 'Finjaro', type, payload });
let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Boutique Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }, '2026-09-01T08:00:00.000Z'));
db = applyEvent(db, ev('product.save', { product: { id: 'p1', name: 'Robe wax', sku: 'RW', barcode: '', category: '', brand: '', price: 15000, cost: 9000, stock: 5, reorderPoint: 0, unit: 'pièce', createdAt: '2026-09-01' }, movementId: 'm0', entryId: 'j0' }, '2026-09-01T08:00:00.000Z'));
// Le contrat : ce que le déclencheur `delivered` écrit dans finia_events.
const order = {
  sale: {
    id: 'order-uuid-1', number: 'FJ-X8HKH5', date: '2026-09-15', customerId: null, customerName: 'Marie (Finjaro)',
    lines: [
      { productId: '', name: 'Robe wax (M, bleu)', qty: 2, unitPrice: 15000, unitCost: 0 },
      { productId: '', name: 'Livraison', qty: 1, unitPrice: 1500, unitCost: 0 },
    ],
    discount: 0, vat: 0, total: 31500, paid: 31500, method: 'CASH', status: 'CONFIRMED', cashier: 'Finjaro',
    createdAt: '2026-09-15T17:20:00.000Z', source: 'finjaro', externalId: 'order-uuid-1',
    fx: { fromCurrency: 'XAF', fromTotal: 31500, rate: 1, currency: 'XAF' },
  },
  ids: { movements: ['fj-m1', 'fj-m2'], saleEntry: 'fj-j1', cogsEntry: 'fj-c1', debt: 'fj-d1' },
};
db = applyEvent(db, ev('sale.record', order, '2026-09-15T17:20:00.000Z'));
check(db.sales.length === 1 && db.sales[0].number === 'FJ-X8HKH5', 'la commande livrée est une vente FJ-X8HKH5');
check(balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 31500, 'encaissée en espèces (paiement à la livraison), livraison comprise');
check(db.products[0].stock === 5 && db.movements.length === 1, 'article non relié : le stock Accounting ne bouge pas (la place de marché l’a déjà sorti)');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');
// Le même événement arrive une seconde fois (re-livraison, rejeu, doublon réseau).
const again = { ...order, sale: { ...order.sale, id: 'order-uuid-1' } };
db = applyEvent(db, ev('sale.record', again, '2026-09-15T17:21:00.000Z'));
check(db.sales.length === 1 && balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 31500, 'reçu deux fois : compté une fois');
const other = { ...order, sale: { ...order.sale, id: 'another-id', externalId: 'order-uuid-1' } };
db = applyEvent(db, ev('sale.record', other, '2026-09-15T17:22:00.000Z'));
check(db.sales.length === 1, 'même commande sous un autre identifiant : ignorée grâce à externalId');
console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
