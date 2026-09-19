/**
 * Rendez-vous : l'ordre de la journée, les chevauchements, et surtout le fait
 * qu'un rendez-vous ne touche JAMAIS la comptabilité.
 *
 *   npx vite-node scripts/rendez-vous-check.ts
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { balanceOf, balanceSheet } from '../src/lib/ledger';
import { dayOf, endTime, overlapping, summarize } from '../src/lib/appointments';
import type { Appointment, DB, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: '2026-09-19T08:00:00.000Z', actorId: 'u', actorName: 'Awa', type, payload });

const rdv = (o: Partial<Appointment> & { id: string; time: string }): Appointment => ({
  customerId: null, customerName: 'Cliente', phone: '', label: 'Coupe',
  date: '2026-09-19', minutes: 60, amount: 0, notes: '', status: 'BOOKED',
  saleId: null, createdAt: '2026-09-19T08:00:00.000Z', ...o,
});

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Salon Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'beauty', onboarded: true } }));

check(endTime('14:30', 45) === '15:15', `14:30 + 45 min = ${endTime('14:30', 45)}`);
check(endTime('23:40', 60) === '23:59', `on ne déborde pas sur le lendemain (${endTime('23:40', 60)})`);

// Trois rendez-vous saisis dans le désordre.
db = applyEvent(db, ev('appointment.save', { appointment: rdv({ id: 'r2', time: '14:00', customerName: 'Awa M.', label: 'Tresses', minutes: 120, amount: 15000 }) }));
db = applyEvent(db, ev('appointment.save', { appointment: rdv({ id: 'r1', time: '09:30', customerName: 'Ngo Bell', label: 'Coupe', amount: 3000 }) }));
db = applyEvent(db, ev('appointment.save', { appointment: rdv({ id: 'r3', time: '17:00', customerName: 'Rose', label: 'Brushing', minutes: 30, amount: 2000 }) }));

const jour = dayOf(db, '2026-09-19');
check(jour.map((a) => a.time).join(' ') === '09:30 14:00 17:00', `la journée se lit dans l'ordre des heures (${jour.map((a) => a.time).join(' ')})`);

// Un quatrième qui tombe pendant les tresses.
const conflit = overlapping(db, { id: 'r4', date: '2026-09-19', time: '15:00', minutes: 60 });
check(conflit.length === 1 && conflit[0].id === 'r2', `un chevauchement est repéré (${conflit.map((a) => a.customerName).join(', ')})`);
check(overlapping(db, { id: 'r5', date: '2026-09-19', time: '16:00', minutes: 30 }).length === 0, 'un créneau libre ne déclenche rien');
check(overlapping(db, { id: 'r2', date: '2026-09-19', time: '14:00', minutes: 120 }).length === 0, 'un rendez-vous ne se chevauche pas lui-même');

// Le résumé, vu à 10 h.
const s = summarize(db, '2026-09-19', '10:00');
check(s.jour.length === 3, `trois rendez-vous aujourd'hui (${s.jour.length})`);
check(s.aVenir.map((a) => a.time).join(' ') === '14:00 17:00', `à 10 h, il reste ${s.aVenir.length} rendez-vous`);
check(s.attendu === 20000, `la journée devrait rapporter ${s.attendu}`);

// AUCUNE écriture comptable : c'est le point le plus important.
check(db.entries.length === 0, `aucune écriture produite par trois rendez-vous (${db.entries.length})`);
check(balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 0, 'rien en caisse tant que personne n’a payé');

// La cliente vient et paie : là seulement, une vente.
const lines = [{ productId: '', name: 'Tresses', qty: 1, unitPrice: 15000, unitCost: 0 }];
const t = saleTotals(db.company, lines, 0);
const sale: Sale = { id: 'v1', number: 'FA-00001', date: '2026-09-19', customerId: null, customerName: 'Awa M.', lines, discount: 0, vat: t.vat, total: t.total, paid: t.total, method: 'CASH', status: 'CONFIRMED', cashier: 'Awa', createdAt: '2026-09-19T16:00:00.000Z' };
db = applyEvent(db, ev('sale.record', { sale, ids: { movements: [], saleEntry: 'j1', cogsEntry: 'c1', debt: 'd1' } }));
db = applyEvent(db, ev('appointment.status', { appointmentId: 'r2', status: 'DONE', saleId: 'v1' }));

check(db.appointments.find((a) => a.id === 'r2')!.status === 'DONE', 'le rendez-vous est marqué honoré');
check(db.appointments.find((a) => a.id === 'r2')!.saleId === 'v1', 'et il pointe la vente qui l’a encaissé');
check(balanceOf(accountCode('SYSCOHADA', 'CASH'), db.entries, 'DEBIT') === 15000, 'la caisse ne bouge qu’au paiement');
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');

// Annulé : il disparaît de la journée, mais reste dans l'historique.
db = applyEvent(db, ev('appointment.status', { appointmentId: 'r3', status: 'CANCELLED' }));
check(dayOf(db, '2026-09-19').length === 2 && db.appointments.length === 3, 'un rendez-vous annulé sort de la journée sans être effacé');

// Un rendez-vous d'hier jamais soldé doit se voir.
db = applyEvent(db, ev('appointment.save', { appointment: rdv({ id: 'r9', date: '2026-09-18', time: '11:00', customerName: 'Oubliée' }) }));
check(summarize(db, '2026-09-19', '10:00').enRetard.map((a) => a.id).join() === 'r9', 'un rendez-vous passé jamais soldé remonte');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
