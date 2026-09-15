// Coût d'un événement en fonction de la taille de l'état : c'est ce qui décide
// si dix ans d'activité tiennent dans un navigateur.
import { applyEvent, emptyDB } from '../../src/lib/reducer';
import { accountCode } from '../../src/lib/chart';
import type { DB, Sale } from '../../src/lib/types';
let seq = 0;
let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>, date = '2026-01-01') => {
  seq += 1;
  db = applyEvent(db, { id: `e${seq}`, at: `${date}T10:00:00.000Z`, actorId: 'u', actorName: 'T', type, payload });
};
feed('company.update', { patch: { name: 'Bench', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', vatEnabled: false, onboarded: true } });
feed('entry.manual', { entryId: 'ap', date: '2026-01-01', journal: 'OD', ref: 'AP', label: 'Apport', lines: [{ account: accountCode(db.company.chart, 'CASH'), debit: 10_000_000, credit: 0 }, { account: accountCode(db.company.chart, 'CAPITAL'), debit: 0, credit: 10_000_000 }] });
feed('product.save', { product: { id: 'p1', name: 'Riz', sku: 'R', barcode: '', category: 'E', brand: '', price: 1000, cost: 700, stock: 1_000_000, reorderPoint: 0, unit: 'sac', createdAt: '2026-01-01' }, movementId: 'm0', entryId: 'j0' });
const sale = (i: number): Sale => ({ id: `s${i}`, number: `FA-${i}`, date: '2026-01-02', customerId: null, customerName: 'Client', lines: [{ productId: 'p1', name: 'Riz', qty: 1, unitPrice: 1000, unitCost: 700 }], discount: 0, vat: 0, total: 1000, paid: 1000, method: 'CASH', status: 'CONFIRMED', cashier: 'T', createdAt: '2026-01-02T10:00:00.000Z' });
const marks = [100, 200, 500, 1000, 2000, 5000];
let i = 0; let t0 = performance.now(); let last = t0;
for (const m of marks) {
  while (i < m) { feed('sale.record', { sale: sale(i), ids: { movements: [`mv${i}`], saleEntry: `se${i}`, cogsEntry: `ce${i}`, debt: `d${i}` } }); i += 1; }
  const now = performance.now();
  const per = (now - last) / (m - (marks[marks.indexOf(m) - 1] ?? 0));
  console.log(`${String(m).padStart(6)} ventes → ${((now - t0) / 1000).toFixed(1)} s cumulés, ${per.toFixed(2)} ms/événement, écritures ${db.entries.length}, audit ${db.audit.length}, état ≈ ${(JSON.stringify(db).length / 1e6).toFixed(1)} Mo`);
  last = now;
  if (now - t0 > 240_000) { console.log('arrêt : plus de 4 minutes'); break; }
}
