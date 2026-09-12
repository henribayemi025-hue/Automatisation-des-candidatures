/**
 * Importation : facture en dollars, douane, fret, transit et TVA de douane.
 * Ce qu'un fiscaliste vérifiera en premier : le stock entre au coût rendu
 * magasin, la TVA de douane est déduite, aucune TVA locale n'est inventée sur
 * une facture étrangère, et le bilan reste équilibré.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { balanceOf, balanceSheet, runAuditChecks } from '../src/lib/ledger';
import type { DB, Product, Purchase, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
function ev(type: string, payload: Record<string, unknown>): WorkspaceEvent {
  seq += 1;
  return { id: `e${seq}`, at: '2026-08-20T10:00:00.000Z', actorId: 'u1', actorName: 'Duviol', type, payload };
}
let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>) => {
  db = applyEvent(db, ev(type, payload));
};
const chart = () => db.company.chart;
const money = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ');

// Import-export au Cameroun : TVA 19,25 %, prix saisis hors taxe.
feed('company.update', {
  patch: { name: 'Duviol Import', currency: 'XAF', country: 'Cameroun', chart: 'SYSCOHADA', sector: 'trade', vatEnabled: true, vatRateBp: 1925, pricesIncludeTax: false },
});
feed('entry.manual', {
  entryId: 'ap1', date: '2026-08-01', journal: 'OD', ref: 'AP-0001', label: 'Apport',
  lines: [
    { account: accountCode(chart(), 'BANK'), debit: 20_000_000, credit: 0 },
    { account: accountCode(chart(), 'CAPITAL'), debit: 0, credit: 20_000_000 },
  ],
});

const tiles: Product = { id: 'p1', name: 'Carton de tuiles', sku: 'TUI', barcode: '', category: 'Matériaux', brand: '', price: 15_000, cost: 0, stock: 0, reorderPoint: 0, unit: 'carton', createdAt: '2026-08-01' };
const gen: Product = { ...tiles, id: 'p2', name: 'Groupe électrogène', sku: 'GEN', price: 450_000, unit: 'pièce' };
feed('product.save', { product: tiles, movementId: 'm0', entryId: 'j0' });
feed('product.save', { product: gen, movementId: 'm1', entryId: 'j1' });

// Facture du fournisseur chinois : 10 000 $ de tuiles (1 000 cartons à 10 $)
// et 5 000 $ de groupes (10 pièces à 500 $). Taux : 1 $ = 600 F.
const rate = 600;
const usd = (n: number) => n * 100; // cents
const local = (cents: number) => Math.round((cents * rate) / 100);
const order: Purchase = {
  id: 'pu1', number: 'BC-0001', date: '2026-08-10', supplierId: null, supplierName: 'Guangzhou Building Co.',
  lines: [
    { productId: tiles.id, name: tiles.name, qty: 1000, unitCost: local(usd(10)) },
    { productId: gen.id, name: gen.name, qty: 10, unitCost: local(usd(500)) },
  ],
  total: local(usd(15_000)),
  paid: 0,
  status: 'PENDING',
  foreign: { currency: 'USD', total: usd(15_000), rate },
  landed: [
    { kind: 'CUSTOMS', label: 'Droits de douane', amount: 1_800_000 },
    { kind: 'FREIGHT', label: 'Fret maritime', amount: 900_000 },
    { kind: 'FORWARDING', label: 'Transitaire', amount: 300_000 },
  ],
  importVat: 2_079_000, // 19,25 % de (marchandise + droits) — payé au port
  landedPaidWith: 'BANK',
  createdAt: '2026-08-10T09:00:00.000Z',
};
feed('purchase.record', { purchase: order });
feed('purchase.receive', { purchaseId: order.id, date: '2026-08-20', ids: { movements: ['m2', 'm3'], entry: 'j2', payment: 'j3', debt: 'd1' } });

const goods = order.total; // 9 000 000
const landed = order.landed!.reduce((s, c) => s + c.amount, 0); // 3 000 000
const tilesAfter = db.products.find((p) => p.id === tiles.id)!;
const genAfter = db.products.find((p) => p.id === gen.id)!;
const stockValue = tilesAfter.stock * tilesAfter.cost + genAfter.stock * genAfter.cost;

console.log('--- facture étrangère ---');
console.log('facture 15 000 $ à 600     :', money(goods), 'F');
console.log('frais d’approche           :', money(landed), 'F (douane + fret + transit)');
console.log('coût rendu magasin         :', money(goods + landed), 'F');
console.log('\n--- répartition sur les articles ---');
console.log('tuiles : 6 000 F + part des frais →', money(tilesAfter.cost), 'F le carton');
console.log('groupe : 300 000 F + part des frais →', money(genAfter.cost), 'F la pièce');
console.log('valeur du stock            :', money(stockValue), 'F', Math.abs(stockValue - (goods + landed)) <= 1000 ? '≈ coût rendu (arrondis)' : 'ÉCART');

const inv = balanceOf(accountCode(chart(), 'INVENTORY'), db.entries, 'DEBIT');
const vatDed = balanceOf(accountCode(chart(), 'VAT_DEDUCTIBLE'), db.entries, 'DEBIT');
const supp = balanceOf(accountCode(chart(), 'SUPPLIERS'), db.entries, 'CREDIT');
const bank = balanceOf(accountCode(chart(), 'BANK'), db.entries, 'DEBIT');
console.log('\n--- écritures ---');
console.log('compte stock (31)          :', money(inv), '(attendu', money(goods + landed) + ')');
console.log('TVA déductible (4451)      :', money(vatDed), '(attendu 2 079 000 : douane seulement, rien sur la facture étrangère)');
console.log('dû au fournisseur (401)    :', money(supp), '(attendu 9 000 000 : la facture, sans les frais)');
console.log('banque                     :', money(bank), '(20 000 000 − frais 3 000 000 − TVA douane 2 079 000)');
const debt = db.debts.find((d) => d.sourceId === order.id);
console.log('dette fournisseur suivie   :', debt ? money(debt.amount) : 'aucune');

const sheet = balanceSheet(db.accounts, db.entries, '2026-08-31');
const checks = runAuditChecks(db.accounts, db.entries);
console.log('\nécart bilan                :', sheet.difference);
for (const c of checks) if (c.severity !== 'OK') console.log(c.severity.padEnd(6), c.label);

const ok =
  inv === goods + landed &&
  vatDed === 2_079_000 &&
  supp === goods &&
  bank === 20_000_000 - landed - 2_079_000 &&
  debt?.amount === goods &&
  Math.abs(stockValue - (goods + landed)) <= 1000 &&
  sheet.difference === 0 &&
  checks.every((c) => c.severity !== 'ERROR');
console.log(ok ? '\nOK — coût rendu magasin, TVA de douane déduite, aucune TVA inventée, bilan équilibré.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
