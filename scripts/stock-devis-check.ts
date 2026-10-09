/**
 * Audit jour 8 (09/10) : correction de stock et devis refusé.
 *
 *   npx vite-node scripts/stock-devis-check.ts
 *
 * 1. Une correction de stock illisible (NaN) ou nulle est ignorée : le
 *    journal ne s'efface pas, un NaN gâterait le stock pour toujours.
 * 2. Une sortie (quantité négative) baisse le stock et passe en perte.
 * 3. Un devis annulé quitte la liste, laisse une trace dans l'historique,
 *    et ne touche ni journal ni stock. Une vente confirmée ne s'annule pas
 *    par ce chemin.
 */
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceSheet } from '../src/lib/ledger';
import type { DB, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at = '2026-10-09T09:00:00.000Z'): WorkspaceEvent =>
  ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'Awa', type, payload });

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
db = applyEvent(db, ev('product.save', { product: { id: 'p1', name: 'Savon', sku: 'S', barcode: '', category: '', brand: '', price: 500, cost: 300, stock: 10, reorderPoint: 2, unit: 'pièce', createdAt: '2026-10-09' }, movementId: 'm0', entryId: 'j0' }));
const stock = () => db.products.find((p) => p.id === 'p1')!.stock;
const entries0 = db.entries.length;

// 1. Quantités illisibles.
db = applyEvent(db, ev('stock.adjust', { productId: 'p1', qty: Number('2,'), reason: 'x', date: '2026-10-09', movementId: 'm1', entryId: 'j1' }));
db = applyEvent(db, ev('stock.adjust', { productId: 'p1', qty: 0, reason: 'x', date: '2026-10-09', movementId: 'm2', entryId: 'j2' }));
check(stock() === 10, `NaN et zéro ignorés : stock toujours 10 (lu ${stock()})`);
check(db.entries.length === entries0, 'aucune écriture pour une quantité illisible');

// 2. Une sortie de 3 (casse).
db = applyEvent(db, ev('stock.adjust', { productId: 'p1', qty: -3, reason: 'Casse', date: '2026-10-09', movementId: 'm3', entryId: 'j3' }));
check(stock() === 7, `sortie de 3 : stock 7 (lu ${stock()})`);
check(db.movements[0]?.type === 'OUT' && db.movements[0]?.qty === 3, 'mouvement « Sortie » de 3');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré après la casse');

// 3. Devis.
const lines = [{ productId: 'p1', name: 'Savon', qty: 2, unitPrice: 500, unitCost: 300 }];
const tot = saleTotals(db.company, lines, 0);
const quote: Sale = {
  id: 'q1', number: 'DV-K7X-00001', date: '2026-10-09', customerId: null, customerName: 'Mama Nicole',
  lines, discount: 0, vat: tot.vat, total: tot.total, paid: 0,
  method: 'CASH', status: 'QUOTE', cashier: 'Awa', createdAt: '2026-10-09T09:00:00.000Z',
};
db = applyEvent(db, ev('sale.record', { sale: quote, ids: { movements: [], saleEntry: 'jq', cogsEntry: 'cq', debt: 'dq' } }));
const entriesQ = db.entries.length;
check(db.sales.some((s) => s.id === 'q1' && s.status === 'QUOTE'), 'le devis est dans la liste');
db = applyEvent(db, ev('quote.cancel', { saleId: 'q1' }));
check(!db.sales.some((s) => s.id === 'q1'), 'devis annulé : il quitte la liste');
check(db.audit[0]?.action === 'CANCEL' && db.audit[0].summary.includes('DV-K7X-00001'), 'trace « Devis … annulé » dans l’historique');
check(db.entries.length === entriesQ && stock() === 7, 'ni écriture ni stock touchés');

const sale: Sale = { ...quote, id: 's1', number: 'FA-K7X-00001', status: 'CONFIRMED', paid: tot.total };
db = applyEvent(db, ev('sale.record', { sale, ids: { movements: ['m4'], saleEntry: 'j4', cogsEntry: 'c4', debt: 'd4' } }));
db = applyEvent(db, ev('quote.cancel', { saleId: 's1' }));
check(db.sales.some((s) => s.id === 's1' && s.status === 'CONFIRMED'), 'une vente confirmée ne s’annule pas par ce chemin');

console.log(failures ? `\n${failures} échec(s)` : '\nTout est vert.');
process.exit(failures ? 1 : 0);
