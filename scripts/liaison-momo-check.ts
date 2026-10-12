/**
 * Liaison commande → vente, paiement mobile money confirmé plus tard (12/10).
 *
 *   npx vite-node scripts/liaison-momo-check.ts
 *
 * Proposition d'Alpha (docs/en-attente/liaison-mobile-money.sql, place de
 * marché) : une commande payée en ligne mais pas encore confirmée arrive avec
 * paid = 0 et method 'MOBILE' ; la confirmation écrit un debt.pay dont le
 * debtId est relu dans payload.ids.debt de la vente.
 *
 * 1. À la vente : tout en 411 Clients, une créance, rien en 523 ni en 571.
 * 2. À la confirmation : 523 débité, 411 soldé, créance réglée.
 * 3. Le même règlement rejoué (même événement, ou même paiement sous un autre
 *    événement) est ignoré : pas de double encaissement.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import type { DB, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};
const ev = (id: string, type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id, at: '2026-10-12T09:00:00.000Z', actorId: 'finjaro', actorName: 'Finjaro', type, payload });

let db: DB = emptyDB();
db = applyEvent(db, ev('e0', 'company.update', { patch: { name: 'K-Drinks', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
const net = (key: string) =>
  balanceOf(accountCode('SYSCOHADA', key as never), db.entries, 'DEBIT');

const lines = [{ productId: '', name: 'Jus de bissap', qty: 2, unitPrice: 1500, unitCost: 0 }];
const tot = saleTotals(db.company, lines, 0);
const sale: Sale = {
  id: 'o1', number: 'FJ-TEST01', date: '2026-10-12', customerId: null, customerName: 'Acheteuse Finjaro',
  lines, discount: 0, vat: tot.vat, total: tot.total, paid: 0, method: 'MOBILE', status: 'CONFIRMED',
  cashier: 'Finjaro', createdAt: '2026-10-12T09:00:00.000Z',
};
const saleEv = ev('e1', 'sale.record', { sale, ids: { movements: [], saleEntry: 'o1-v', cogsEntry: 'o1-c', debt: 'o1-d' } });
db = applyEvent(db, saleEv);

// 1. La vente.
const debtId = (saleEv.payload as { ids: { debt: string } }).ids.debt;
const debt = db.debts.find((d) => d.id === debtId);
check(!!debt && debt.amount === tot.total, `créance de ${tot.total} au nom de l'acheteuse`);
check(net('CUSTOMERS') === tot.total, '411 Clients débité du total');
check(net('MOBILE_MONEY') === 0 && net('CASH') === 0, 'rien en 523 ni en 571 tant que ce n’est pas confirmé');

// 2. La confirmation.
const reste = debt!.amount;
const pay = ev('e2', 'debt.pay', { debtId, entryId: 'o1-p', payment: { id: 'o1-pay', date: '2026-10-12', amount: reste, method: 'MOBILE' } });
db = applyEvent(db, pay);
check(net('MOBILE_MONEY') === reste && net('CUSTOMERS') === 0, `confirmé : ${reste} en 523, 411 soldé`);

// 3. Rejeux.
db = applyEvent(db, pay);
check(db.debts[0].payments.length === 1 && net('MOBILE_MONEY') === reste, 'le même événement rejoué est ignoré');
db = applyEvent(db, ev('e3', 'debt.pay', { debtId, entryId: 'o1-p2', payment: { id: 'o1-pay', date: '2026-10-12', amount: reste, method: 'MOBILE' } }));
check(db.debts[0].payments.length === 1 && net('MOBILE_MONEY') === reste, 'le même paiement sous un autre événement est ignoré');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');

console.log(failures ? `\n${failures} échec(s)` : '\nTout est vert.');
process.exit(failures ? 1 : 0);
