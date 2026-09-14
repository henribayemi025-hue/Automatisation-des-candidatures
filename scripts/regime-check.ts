/**
 * Régime d'imposition. Une entreprise à l'IGS ne facture pas de TVA ; ses
 * fournisseurs retiennent un précompte sur achat, qui est un acompte d'impôt
 * (créance sur l'État), pas un coût du stock ni une charge. On vérifie que
 * le passage au réel rallume la TVA, et que tout reste équilibré.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import { taxRegime } from '../src/lib/countries';
import type { DB, Product, Purchase, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>) => {
  seq += 1;
  const ev: WorkspaceEvent = { id: `e${seq}`, at: '2026-09-14T10:00:00.000Z', actorId: 'u1', actorName: 'Test', type, payload };
  db = applyEvent(db, ev);
};
const chart = () => db.company.chart;
const bal = (key: Parameters<typeof accountCode>[1], normal: 'DEBIT' | 'CREDIT' = 'DEBIT') => balanceOf(accountCode(chart(), key), db.entries, normal);

// Boutique camerounaise à l'IGS : le profil pays proposait la TVA, le régime la coupe.
feed('company.update', { patch: { name: 'Boutique IGS', currency: 'XAF', country: 'Cameroun', chart: 'SYSCOHADA', sector: 'retail', vatEnabled: true, vatRateBp: 1925, pricesIncludeTax: true } });
feed('company.update', { patch: { taxRegime: 'IGS', withholdingBp: 200 } });
console.log('régime IGS → taxe coupée      :', db.company.vatEnabled === false ? 'oui' : 'NON', `(régime ${taxRegime(db.company)})`);

feed('entry.manual', { entryId: 'ap', date: '2026-09-01', journal: 'OD', ref: 'AP-1', label: 'Apport', lines: [
  { account: accountCode(chart(), 'CASH'), debit: 1_000_000, credit: 0 },
  { account: accountCode(chart(), 'CAPITAL'), debit: 0, credit: 1_000_000 },
] });
const rice: Product = { id: 'p1', name: 'Sac de riz', sku: 'RIZ', barcode: '', category: 'Épicerie', brand: '', price: 25_000, cost: 0, stock: 0, reorderPoint: 0, unit: 'sac', createdAt: '2026-09-01' };
feed('product.save', { product: rice, movementId: 'm0', entryId: 'j0' });

// Achat chez un grossiste : 10 sacs à 20 000, précompte 2 % = 4 000.
const order: Purchase = { id: 'pu1', number: 'BC-1', date: '2026-09-05', supplierId: null, supplierName: 'Grossiste Mbarga', lines: [{ productId: 'p1', name: 'Sac de riz', qty: 10, unitCost: 20_000 }], total: 200_000, paid: 0, status: 'PENDING', withholding: 4_000, createdAt: '2026-09-05T09:00:00.000Z' };
feed('purchase.record', { purchase: order });
feed('purchase.receive', { purchaseId: 'pu1', date: '2026-09-05', ids: { movements: ['m1'], entry: 'j1', payment: 'j2', debt: 'd1' } });

const stock = bal('INVENTORY');
const prepaid = bal('TAX_PREPAID');
const vatDed = bal('VAT_DEDUCTIBLE');
const suppliers = bal('SUPPLIERS', 'CREDIT');
const debt = db.debts[0]?.amount ?? 0;
console.log('stock (attendu 200 000)       :', stock);
console.log('précompte 4492 (attendu 4 000):', prepaid);
console.log('TVA déductible (attendu 0)    :', vatDed);
console.log('fournisseur (attendu 204 000) :', suppliers, '· dette', debt);
console.log('coût unitaire (attendu 20 000):', db.products[0].cost);

// Vente : pas de TVA collectée sous l'IGS.
feed('sale.record', { sale: { id: 's1', number: 'FA-1', date: '2026-09-06', customerId: null, customerName: 'Client', lines: [{ productId: 'p1', name: 'Sac de riz', qty: 2, unitPrice: 25_000, unitCost: 20_000 }], discount: 0, gross: 50_000, net: 50_000, vat: 0, total: 50_000, cost: 40_000, method: 'CASH', status: 'CONFIRMED', paid: 50_000, createdAt: '2026-09-06T10:00:00.000Z' }, ids: { movements: ['m2'], saleEntry: 'j3', cogsEntry: 'j4', debt: 'd2' } });
const vatCol = bal('VAT_COLLECTED', 'CREDIT');
console.log('TVA collectée (attendu 0)     :', vatCol);
const sheet = balanceSheet(db.accounts, db.entries);
console.log('écart bilan                   :', sheet.difference);

// Retour au réel : la taxe se rallume.
feed('company.update', { patch: { taxRegime: 'REEL' } });
console.log('régime réel → taxe active     :', db.company.vatEnabled ? 'oui' : 'NON');

const ok = !db.entries.some((e) => !e.posted) && stock === 200_000 && prepaid === 4_000 && vatDed === 0 && suppliers === 204_000 && debt === 204_000 && db.products[0].cost === 20_000 && vatCol === 0 && sheet.difference === 0 && db.company.vatEnabled;
console.log(ok ? 'OK — IGS sans TVA, précompte en acompte d’impôt, bilan équilibré.' : 'ÉCHEC');
process.exit(ok ? 0 : 1);
