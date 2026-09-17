/**
 * Abonnements : dates, compte à rebours, encaissement = vente, sans stock.
 *
 *   npx vite-node scripts/subscription-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import { addPeriod, daysLeft, stateOf, summarize } from '../src/lib/subscriptions';
import type { DB, Sale, Subscription, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

// Dates : un mois pris le 31 janvier finit le 27 février (veille du 28) ; 30 jours pris le 1er finissent le 30.
check(addPeriod('2026-01-31', 1, 'MONTH') === '2026-02-27', `un mois depuis le 31 janvier → ${addPeriod('2026-01-31', 1, 'MONTH')}`);
check(addPeriod('2026-03-03', 1, 'MONTH') === '2026-04-02', `un mois depuis le 3 mars → ${addPeriod('2026-03-03', 1, 'MONTH')}`);
check(addPeriod('2026-03-01', 30, 'DAY') === '2026-03-30', `30 jours depuis le 1er mars → ${addPeriod('2026-03-01', 30, 'DAY')}`);
check(addPeriod('2026-01-15', 3, 'MONTH') === '2026-04-14', `trois mois depuis le 15 janvier → ${addPeriod('2026-01-15', 3, 'MONTH')}`);

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at = '2026-03-03T10:00:00.000Z'): WorkspaceEvent => ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'U', type, payload });
let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Salle Tonus', currency: 'XAF', chart: 'SYSCOHADA', sector: 'services', onboarded: true } }));
db = applyEvent(db, ev('product.save', { product: { id: 'p1', name: 'Boisson', sku: 'B', barcode: '', category: '', brand: '', price: 500, cost: 300, stock: 20, reorderPoint: 0, unit: 'pièce', createdAt: '2026-03-01' }, movementId: 'm0', entryId: 'j0' }));
const stockBefore = balanceOf(accountCode('SYSCOHADA', 'INVENTORY'), db.entries, 'DEBIT');

const sub: Subscription = { id: 's1', customerId: null, customerName: 'Awa', phone: '+237699123456', label: 'Salle — mensuel', amount: 10000, every: 1, unit: 'MONTH', startDate: '2026-03-03', endDate: '2026-03-02', periods: [], status: 'ACTIVE', notes: '', createdAt: '2026-03-03T10:00:00.000Z' };
db = applyEvent(db, ev('subscription.save', { subscription: sub }));
check(db.subscriptions.length === 1 && stateOf(db.subscriptions[0], '2026-03-03') === 'EXPIRED', 'créé sans période payée : en attente (expiré)');

const renew = (n: number, from: string, method: 'CASH' | 'MOBILE') => {
  const to = addPeriod(from, 1, 'MONTH');
  const lines = [{ productId: '', name: `Salle — mensuel — ${from} → ${to}`, qty: 1, unitPrice: 10000, unitCost: 0 }];
  const t = saleTotals(db.company, lines, 0);
  const sale: Sale = { id: `sale${n}`, number: `FA-0000${n}`, date: from, customerId: null, customerName: 'Awa', lines, discount: 0, vat: t.vat, total: t.total, paid: t.total, method, status: 'CONFIRMED', cashier: 'U', createdAt: `${from}T10:00:00.000Z` };
  db = applyEvent(db, ev('subscription.renew', { subscriptionId: 's1', sale, ids: { movements: [`m${n}`], saleEntry: `j${n}`, cogsEntry: `c${n}`, debt: `d${n}` }, period: { from, to, amount: t.total, saleId: sale.id, paidAt: from } }, `${from}T10:00:00.000Z`));
  return to;
};
const to1 = renew(1, '2026-03-03', 'CASH');
const s1 = db.subscriptions[0];
check(s1.endDate === '2026-04-02' && s1.periods.length === 1, `première période payée : jusqu'au ${s1.endDate}`);
check(db.sales.length === 1 && balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 10000, 'l’encaissement est une vente : 10 000 en caisse');
check(balanceOf(accountCode('SYSCOHADA', 'INVENTORY'), db.entries, 'DEBIT') === stockBefore && db.products[0].stock === 20, 'aucun mouvement de stock ni coût des marchandises');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');
check(daysLeft(s1, '2026-03-27') === 6 && stateOf(s1, '2026-03-27') === 'SOON', `à J-6, « finit bientôt » (${daysLeft(s1, '2026-03-27')} j)`);
check(stateOf(s1, '2026-04-02') === 'SOON' && daysLeft(s1, '2026-04-02') === 0, 'dernier jour : encore couvert');
check(stateOf(s1, '2026-04-03') === 'EXPIRED', 'le lendemain : expiré');

// Renouvellement à la suite : du 3 avril au 2 mai.
const next = addPeriod(to1, 2, 'DAY');
check(next === '2026-04-03', `la période suivante commence le ${next}`);
renew(2, next, 'MOBILE');
check(db.subscriptions[0].endDate === '2026-05-02' && db.subscriptions[0].periods.length === 2, `deux périodes, couvert jusqu'au ${db.subscriptions[0].endDate}`);
check(balanceOf(accountCode('SYSCOHADA', 'MOBILE_MONEY'), db.entries, 'DEBIT') === 10000, 'second encaissement en mobile money');

const sum = summarize(db, '2026-04-28');
check(sum.soon === 1 && sum.expired === 0 && sum.active === 0 && sum.monthlyValue === 10000, `résumé au 28 avril : ${sum.soon} bientôt, ${sum.expired} expiré, valeur mensuelle ${sum.monthlyValue}`);

db = applyEvent(db, ev('subscription.cancel', { subscriptionId: 's1' }));
check(db.subscriptions[0].status === 'CANCELLED' && db.sales.length === 2, 'arrêté : les ventes passées restent');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
