/**
 * Contrôles des correctifs issus de la simulation (docs/SIMULATION-DECISIONS.md).
 *
 *   npx vite-node scripts/correctifs-check.ts
 *
 * 1. Numéros de tickets : une marque par appareil, jamais deux fois le même
 *    numéro entre deux appareils, jamais de numéro réattribué.
 * 2. Exercice clôturé : une écriture datée dedans est refusée, la clôture et
 *    la réouverture passent toujours.
 * 3. Achat « payé avec » : un virement débite la banque, pas la caisse ;
 *    sans le champ, la caisse comme avant.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, replay } from '../src/lib/reducer';
import { balanceOf } from '../src/lib/ledger';
import { closingPlan, carryForwardLines, dayAfter } from '../src/lib/closing';
import type { DB, WorkspaceEvent } from '../src/lib/types';

// localStorage minimal, un par « appareil ».
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
}
const g = globalThis as unknown as { localStorage: MemoryStorage };
let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

// ---------------------------------------------------------------------------
// 1. Numérotation
// ---------------------------------------------------------------------------
const { nextNumber, deviceTag } = await import('../src/lib/numbering');
const deviceA = new MemoryStorage();
const deviceB = new MemoryStorage();
g.localStorage = deviceA;
const tagA = deviceTag();
const a1 = nextNumber('ws1', 'FA', []);
const a2 = nextNumber('ws1', 'FA', [a1]);
g.localStorage = deviceB;
const tagB = deviceTag();
const b1 = nextNumber('ws1', 'FA', []);
check(tagA !== tagB, `deux appareils, deux marques (${tagA}, ${tagB})`);
check(a1 !== b1, `premier ticket de chaque appareil différent (${a1} / ${b1})`);
check(a2 === `FA-${tagA}-00002`, `compteur local qui avance (${a2})`);
// Stockage vidé sur A : le compteur repart de ce que le journal connaît.
g.localStorage = new MemoryStorage();
g.localStorage.setItem('finia.device', tagA);
const a3 = nextNumber('ws1', 'FA', [a1, a2, b1]);
check(a3 === `FA-${tagA}-00003`, `après effacement du stockage, jamais en dessous du journal (${a3})`);
// Deux appareils, ordre différent : les numéros ne changent pas.
let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at = '2026-03-01T10:00:00.000Z'): WorkspaceEvent => ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'U', type, payload });
let base: DB = emptyDB();
base = applyEvent(base, ev('company.update', { patch: { name: 'Test', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
base = applyEvent(base, ev('product.save', { product: { id: 'p1', name: 'Savon', sku: 'SAV', barcode: '', category: '', brand: '', price: 350, cost: 250, stock: 100, reorderPoint: 0, unit: 'pièce', createdAt: '2026-03-01' }, movementId: 'm0', entryId: 'j0' }));
const sale = (id: string, number: string) => ev('sale.record', { sale: { id, number, date: '2026-03-02', customerId: null, customerName: 'Client', lines: [{ productId: 'p1', name: 'Savon', qty: 1, unitPrice: 350, unitCost: 250 }], discount: 0, vat: 0, total: 350, paid: 350, method: 'CASH', status: 'CONFIRMED', cashier: 'x', createdAt: '2026-03-02T10:00:00.000Z' }, ids: { movements: [`${id}m`], saleEntry: `${id}j`, cogsEntry: `${id}c`, debt: `${id}d` } });
const evA = sale('sa', a1);
const evB = sale('sb', b1);
const orderAB = replay(base, [evA, evB]);
const orderBA = replay(base, [evB, evA]);
check(orderAB.sales.find((s) => s.id === 'sb')!.number === b1 && orderBA.sales.find((s) => s.id === 'sb')!.number === b1, 'même numéro sur les deux appareils quel que soit l’ordre d’arrivée');

// ---------------------------------------------------------------------------
// 2. Exercice clôturé
// ---------------------------------------------------------------------------
let db = orderAB;
db = applyEvent(db, ev('expense.add', { expense: { id: 'x1', date: '2026-06-10', category: 'Loyer', account: accountCode('SYSCOHADA', 'RENT'), description: 'Loyer', amount: 100, method: 'CASH', createdAt: '2026-06-10T10:00:00.000Z' }, entryId: 'jx1' }, '2026-06-10T10:00:00.000Z'));
const range = { from: '2026-01-01', to: '2026-12-31', label: '2026' };
const plan = closingPlan(db.accounts, db, range);
db = applyEvent(db, ev('year.close', { closingId: 'c1', from: range.from, to: range.to, lines: plan.lines, revenue: plan.revenue, expenses: plan.expenses, result: plan.result, closingEntryId: 'jc1', carryEntryId: 'jc2', carryDate: dayAfter(range.to), carryLines: carryForwardLines('SYSCOHADA', plan.result) }, '2027-01-05T10:00:00.000Z'));
check(db.closings.length === 1, 'la clôture passe');
let refused = '';
try {
  applyEvent(db, ev('expense.add', { expense: { id: 'x2', date: '2026-12-28', category: 'Électricité', account: accountCode('SYSCOHADA', 'UTILITIES'), description: 'Facture en retard', amount: 50, method: 'CASH', createdAt: '2027-07-01T10:00:00.000Z' }, entryId: 'jx2' }, '2027-07-01T10:00:00.000Z'));
} catch (e) {
  refused = (e as Error).message;
}
check(refused.includes('clôturé'), `dépense datée dans l’exercice clos refusée : « ${refused} »`);
const after = applyEvent(db, ev('expense.add', { expense: { id: 'x3', date: '2027-01-10', category: 'Loyer', account: accountCode('SYSCOHADA', 'RENT'), description: 'Loyer', amount: 100, method: 'CASH', createdAt: '2027-01-10T10:00:00.000Z' }, entryId: 'jx3' }, '2027-01-10T10:00:00.000Z'));
check(after.entries.length === db.entries.length + 1, 'dépense datée dans l’exercice suivant acceptée');
const reopened = applyEvent(db, ev('year.reopen', { closingId: 'c1', date: '2027-07-01', closingReversalId: 'jr1', carryReversalId: 'jr2' }, '2027-07-01T10:00:00.000Z'));
check(reopened.closings.length === 0, 'la réouverture passe (journal CL)');
const late = applyEvent(reopened, ev('expense.add', { expense: { id: 'x2', date: '2026-12-28', category: 'Électricité', account: accountCode('SYSCOHADA', 'UTILITIES'), description: 'Facture en retard', amount: 50, method: 'CASH', createdAt: '2027-07-01T10:00:00.000Z' }, entryId: 'jx2' }, '2027-07-01T10:00:00.000Z'));
check(late.entries.length === reopened.entries.length + 1, 'après réouverture, la dépense en retard passe');

// ---------------------------------------------------------------------------
// 3. Achat payé avec
// ---------------------------------------------------------------------------
let pdb: DB = emptyDB();
pdb = applyEvent(pdb, ev('company.update', { patch: { name: 'Test', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
pdb = applyEvent(pdb, ev('entry.manual', { entryId: 'ap', date: '2026-03-01', journal: 'OD', ref: 'AP', label: 'Apport', lines: [{ account: accountCode('SYSCOHADA', 'BANK'), label: 'b', debit: 100000, credit: 0 }, { account: accountCode('SYSCOHADA', 'CASH'), label: 'c', debit: 20000, credit: 0 }, { account: accountCode('SYSCOHADA', 'CAPITAL'), label: 'k', debit: 0, credit: 120000 }] }));
pdb = applyEvent(pdb, ev('product.save', { product: { id: 'p1', name: 'Riz', sku: 'RIZ', barcode: '', category: '', brand: '', price: 1000, cost: 800, stock: 0, reorderPoint: 0, unit: 'sac', createdAt: '2026-03-01' }, movementId: 'm0', entryId: 'j0' }));
const purchase = (id: string, paidWith?: string) => ({ id, number: `BC-${id}`, date: '2026-03-02', supplierId: null, supplierName: 'F', lines: [{ productId: 'p1', name: 'Riz', qty: 10, unitCost: 800 }], total: 8000, paid: 8000, status: 'PENDING', createdAt: '2026-03-02T08:00:00.000Z', ...(paidWith ? { paidWith } : {}) });
pdb = applyEvent(pdb, ev('purchase.record', { purchase: purchase('b1', 'BANK') }));
pdb = applyEvent(pdb, ev('purchase.receive', { purchaseId: 'b1', date: '2026-03-02', ids: { movements: ['bm1'], entry: 'bj1', payment: 'bp1', debt: 'bd1' } }));
const bank = balanceOf(accountCode('SYSCOHADA', 'BANK'), pdb.entries, 'DEBIT');
const cash = balanceOf(accountCode('SYSCOHADA', 'CASH'), pdb.entries, 'DEBIT');
check(bank === 92000 && cash === 20000, `achat payé par virement : banque ${bank}, caisse ${cash}`);
pdb = applyEvent(pdb, ev('purchase.record', { purchase: purchase('b2') }));
pdb = applyEvent(pdb, ev('purchase.receive', { purchaseId: 'b2', date: '2026-03-03', ids: { movements: ['bm2'], entry: 'bj2', payment: 'bp2', debt: 'bd2' } }));
check(balanceOf(accountCode('SYSCOHADA', 'CASH'), pdb.entries, 'DEBIT') === 12000, 'sans « payé avec », la caisse comme avant');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
