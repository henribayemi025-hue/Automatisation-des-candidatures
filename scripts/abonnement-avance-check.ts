/**
 * Abonnement payé d'avance : la recette suit les mois servis, pas l'encaissement.
 *
 *   npx vite-node scripts/abonnement-avance-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import { dashboard } from '../src/lib/kpi';
import { addPeriod, revenueSchedule } from '../src/lib/subscriptions';
import type { DB, Sale, Subscription, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

// Le découpage seul, avant toute écriture.
const douze = revenueSchedule('2026-01-05', addPeriod('2026-01-05', 12, 'MONTH'), 120000);
check(douze.length === 12, `douze mois payés d'avance donnent ${douze.length} tranches`);
check(douze.reduce((n, x) => n + x.amount, 0) === 120000, 'la somme des tranches fait exactement le montant encaissé');
check(douze[0].date === '2026-01-05' && douze[1].date === '2026-02-05', `les tranches suivent le rythme de l'abonnement, du 5 au 5 (${douze[1].date})`);
const reste = revenueSchedule('2026-01-05', addPeriod('2026-01-05', 3, 'MONTH'), 100);
check(reste.reduce((n, x) => n + x.amount, 0) === 100 && reste[reste.length - 1].amount === 34, `le reste de division va au dernier mois (${reste.map((x) => x.amount).join(' + ')})`);
check(revenueSchedule('2026-01-05', addPeriod('2026-01-05', 1, 'MONTH'), 10000).length === 1, 'un mois donne une seule tranche');

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at: string): WorkspaceEvent =>
  ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'U', type, payload });

function espace(): DB {
  let db = emptyDB();
  db = applyEvent(db, ev('company.update', { patch: { name: 'Salle Tonus', currency: 'XAF', chart: 'SYSCOHADA', sector: 'services', onboarded: true } }, '2026-01-01T08:00:00.000Z'));
  return db;
}

function abonner(db: DB, mois: number, montant: number): DB {
  const sub: Subscription = { id: 's1', customerId: null, customerName: 'Awa', phone: '', label: `Salle — ${mois} mois`, amount: montant, every: mois, unit: 'MONTH', startDate: '2026-01-05', endDate: '2026-01-04', periods: [], status: 'ACTIVE', notes: '', createdAt: '2026-01-05T09:00:00.000Z' };
  db = applyEvent(db, ev('subscription.save', { subscription: sub }, '2026-01-05T09:00:00.000Z'));
  const to = addPeriod('2026-01-05', mois, 'MONTH');
  const lines = [{ productId: '', name: `Salle — 2026-01-05 → ${to}`, qty: 1, unitPrice: montant, unitCost: 0 }];
  const t = saleTotals(db.company, lines, 0);
  const sale: Sale = { id: 'sale1', number: 'FA-00001', date: '2026-01-05', customerId: null, customerName: 'Awa', lines, discount: 0, vat: t.vat, total: t.total, paid: t.total, method: 'CASH', status: 'CONFIRMED', cashier: 'U', createdAt: '2026-01-05T09:00:00.000Z' };
  return applyEvent(db, ev('subscription.renew', { subscriptionId: 's1', sale, ids: { movements: [], saleEntry: 'j1', cogsEntry: 'c1', debt: 'd1' }, period: { from: '2026-01-05', to, amount: t.total, saleId: sale.id, paidAt: '2026-01-05' } }, '2026-01-05T09:00:00.000Z'));
}

// Douze mois encaissés le 5 janvier.
let db = abonner(espace(), 12, 120000);
const jusqu = (fin: string) => db.entries.filter((e) => e.date <= fin);
const caRecu = (fin: string) => balanceOf(accountCode('SYSCOHADA', 'SALES'), jusqu(fin), 'CREDIT');
const dette = (fin: string) => balanceOf(accountCode('SYSCOHADA', 'DEFERRED_REVENUE'), jusqu(fin), 'CREDIT');

check(balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 120000, '120 000 sont bien entrés en caisse le jour du paiement');
check(caRecu('2026-01-31') === 10000, `au 31 janvier, la recette est d'un mois seulement (${caRecu('2026-01-31')})`);
check(dette('2026-01-31') === 110000, `au 31 janvier, 110 000 restent dus au client (${dette('2026-01-31')})`);
check(caRecu('2026-06-30') === 60000, `au 30 juin, six mois servis (${caRecu('2026-06-30')})`);
check(caRecu('2026-12-31') === 120000 && dette('2026-12-31') === 0, 'au 31 décembre, tout est servi et plus rien n’est dû');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');

// Le cas courant ne change pas : un mois, aucune écriture ajoutée.
const avant = espace();
const unMois = abonner(avant, 1, 10000);
check(unMois.entries.every((e) => !e.id.includes('-pca')), 'un abonnement d’un mois ne crée aucune écriture d’étalement');
check(balanceOf(accountCode('SYSCOHADA', 'SALES'), unMois.entries, 'CREDIT') === 10000, 'et sa recette est comptée tout de suite');

// Ce que voit la commerçante sur son accueil doit dire la même chose que ses comptes.
const ecran = dashboard(db, 'MTD', '2026-01-31', 1);
check(ecran.current.revenue === 10000, `l'accueil au 31 janvier affiche un mois de recette (${ecran.current.revenue})`);
const ecranJuin = dashboard(db, 'MTD', '2026-06-30', 1);
check(ecranJuin.current.revenue === 10000, `l'accueil au 30 juin affiche le mois de juin seul (${ecranJuin.current.revenue})`);
const ecranAn = dashboard(db, 'YTD', '2026-12-31', 1);
check(ecranAn.current.revenue === 120000, `l'accueil sur l'année entière affiche les douze mois (${ecranAn.current.revenue})`);

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
