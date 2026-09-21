/**
 * Une prestation ne va pas au compte des marchandises.
 *
 * Relevé le 21/09 par une comptable française qui testait l'application sur
 * une prothésiste ongulaire : ses deux poses d'ongles, rangées dans
 * « Prestations », créditaient le 707 « Ventes de marchandises ». Le 706
 * « Prestations de services » existait dans le plan comptable et n'était
 * appelé nulle part.
 *
 *   npx vite-node scripts/prestation-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf } from '../src/lib/ledger';
import type { DB, Product, Sale, SaleLine, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: '2026-09-21T12:00:00.000Z', actorId: 'u', actorName: 'Léa', type, payload });

const article = (o: Partial<Product> & { id: string; name: string }): Product => ({
  sku: o.id, barcode: '', category: '', brand: '', price: 0, cost: 0, stock: 0, reorderPoint: 0,
  unit: 'pièce', createdAt: '2026-09-01', ...o,
});

const vendre = (db: DB, id: string, lines: SaleLine[], discount = 0) => {
  const t = saleTotals(db.company, lines, discount);
  const sale: Sale = {
    id, number: `FA-${id}`, date: '2026-09-21', customerId: null, customerName: 'Client passager',
    lines, discount, vat: t.vat, total: t.total, paid: t.total, method: 'CASH',
    status: 'CONFIRMED', cashier: 'Léa', createdAt: '2026-09-21T12:00:00.000Z',
  };
  return applyEvent(db, ev('sale.record', {
    sale,
    ids: { movements: lines.map((_, i) => `${id}-m${i}`), saleEntry: `${id}-e`, cogsEntry: `${id}-c`, debt: `${id}-d` },
  }));
};

// ── Le cas exact de la comptable : prothésie ongulaire en France ──────────
let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', {
  patch: { name: 'Ongles de Léa', currency: 'EUR', chart: 'PCG', sector: 'beauty', country: 'FR', onboarded: true },
}));

const c706 = accountCode('PCG', 'SERVICE_REVENUE');
const c707 = accountCode('PCG', 'SALES');
check(c706 === '706', `le plan PCG connaît le 706 (${c706})`);
check(c707 === '707', `le plan PCG connaît le 707 (${c707})`);

db = applyEvent(db, ev('product.save', {
  product: article({ id: 'pose', name: 'Pose d’ongles', category: 'Prestations', price: 4500, kind: 'SERVICE' }),
  movementId: 'm1', entryId: 'j1',
}));
db = vendre(db, 'v1', [{ productId: 'pose', name: 'Pose d’ongles', qty: 2, unitPrice: 4500, unitCost: 0, kind: 'SERVICE' }]);

check(balanceOf(c706, db.entries, 'CREDIT') === 9000, 'deux poses d’ongles créditent le 706');
check(balanceOf(c707, db.entries, 'CREDIT') === 0, 'et ne touchent pas le 707');

// ── Une vente sans nature sur la ligne : l'article décide ─────────────────
db = vendre(db, 'v2', [{ productId: 'pose', name: 'Pose d’ongles', qty: 1, unitPrice: 4500, unitCost: 0 }]);
check(balanceOf(c706, db.entries, 'CREDIT') === 13500, 'ligne sans nature : la nature de l’article s’applique');

// ── Ni ligne ni article : le métier décide (vente rapide dans un salon) ───
db = vendre(db, 'v3', [{ productId: '', name: 'Retouche', qty: 1, unitPrice: 1500, unitCost: 0 }]);
check(balanceOf(c706, db.entries, 'CREDIT') === 15000, 'vente rapide en salon : 706 par défaut du métier');
check(balanceOf(c707, db.entries, 'CREDIT') === 0, 'toujours rien sur le 707');

// ── Vente mixte avec remise : la remise se partage au prorata ─────────────
let boutique: DB = emptyDB();
boutique = applyEvent(boutique, ev('company.update', {
  patch: { name: 'Salon & Boutique', currency: 'EUR', chart: 'PCG', sector: 'beauty', country: 'FR', onboarded: true, tracksStock: true },
}));
boutique = applyEvent(boutique, ev('product.save', {
  product: article({ id: 'creme', name: 'Crème', price: 2000, cost: 800, stock: 10, kind: 'GOODS' }),
  movementId: 'm2', entryId: 'j2',
}));
boutique = vendre(boutique, 'v4', [
  { productId: 'pose2', name: 'Soin', qty: 1, unitPrice: 6000, unitCost: 0, kind: 'SERVICE' },
  { productId: 'creme', name: 'Crème', qty: 1, unitPrice: 2000, unitCost: 800, kind: 'GOODS' },
], 800);

const net706 = balanceOf(c706, boutique.entries, 'CREDIT');
const net707 = balanceOf(c707, boutique.entries, 'CREDIT');
const t4 = saleTotals(boutique.company, [
  { productId: 'pose2', name: 'Soin', qty: 1, unitPrice: 6000, unitCost: 0 },
  { productId: 'creme', name: 'Crème', qty: 1, unitPrice: 2000, unitCost: 800 },
], 800);
check(net706 + net707 === t4.net, `706 + 707 font exactement le net (${net706} + ${net707} = ${t4.net})`);
check(net706 === Math.round((t4.net * 6000) / 8000), 'la remise se partage au prorata du brut');
check(net707 > 0, 'la crème reste une marchandise');

// ── L'écriture doit rester équilibrée ─────────────────────────────────────
const vente = boutique.entries.find((e) => e.id === 'v4-e');
const debit = vente?.lines.reduce((s, l) => s + l.debit, 0) ?? -1;
const credit = vente?.lines.reduce((s, l) => s + l.credit, 0) ?? -2;
check(debit === credit, `l’écriture de vente est équilibrée (${debit} = ${credit})`);

// ── Une boutique pure ne doit jamais voir le 706 ──────────────────────────
let epicerie: DB = emptyDB();
epicerie = applyEvent(epicerie, ev('company.update', {
  patch: { name: 'Épicerie', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true },
}));
epicerie = vendre(epicerie, 'v5', [{ productId: '', name: 'Riz', qty: 1, unitPrice: 5000, unitCost: 0 }]);
check(balanceOf(accountCode('SYSCOHADA', 'SERVICE_REVENUE'), epicerie.entries, 'CREDIT') === 0, 'une épicerie ne crédite pas le 706');
check(balanceOf(accountCode('SYSCOHADA', 'SALES'), epicerie.entries, 'CREDIT') === 5000, 'elle crédite le 701');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
