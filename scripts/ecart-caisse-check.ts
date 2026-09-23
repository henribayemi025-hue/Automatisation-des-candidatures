/**
 * Écart de caisse à la clôture : le mot d'explication (idée 64 de Beau).
 *
 *   npx vite-node scripts/ecart-caisse-check.ts
 */
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { balanceSheet } from '../src/lib/ledger';
import type { WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, at = '2026-09-23T18:00:00.000Z'): WorkspaceEvent =>
  ({ id: `e${++seq}`, at, actorId: 'u', actorName: 'Awa', type, payload });

let db = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'food', onboarded: true } }));
db = applyEvent(db, ev('session.open', {
  session: { id: 's1', openedAt: '2026-09-23T18:00:00.000Z', closedAt: null, cashier: 'Awa', opening: 10000, expected: null, counted: null, variance: null },
}));

// Un manquant de 500, avec le mot d'explication.
db = applyEvent(db, ev('session.close', { sessionId: db.sessions[0].id, counted: 9500, note: 'Rendu de monnaie erroné sur une vente', entryId: 'ecart1' }));

const closed = db.sessions[0];
check(closed.variance === -500, `écart calculé (${closed.variance})`);
check(closed.note === 'Rendu de monnaie erroné sur une vente', `le mot d'explication est gardé sur la session (${closed.note})`);
const entry = db.entries.find((e) => e.id === 'ecart1');
check(!!entry?.label.includes('Rendu de monnaie erroné'), `le mot apparaît dans le libellé de l'écriture (${entry?.label})`);
check(!!db.audit.find((a) => a.action === 'CLOSE' && a.summary.includes('Rendu de monnaie erroné')), "le mot apparaît dans l'audit");

const bilan = balanceSheet(db.accounts, db.entries, '2026-09-23');
check(bilan.difference === 0, 'le bilan reste équilibré malgré l’écriture d’ajustement');

// Une deuxième session, sans écart : aucun mot ne doit rien casser.
db = applyEvent(db, ev('session.open', {
  session: { id: 's2', openedAt: '2026-09-23T19:00:00.000Z', closedAt: null, cashier: 'Awa', opening: 9500, expected: null, counted: null, variance: null },
}, '2026-09-23T19:00:00.000Z'));
db = applyEvent(db, ev('session.close', { sessionId: db.sessions[0].id, counted: 9500, entryId: 'ecart2' }, '2026-09-23T20:00:00.000Z'));
check(db.sessions[0].variance === 0, 'une caisse qui tombe juste reste à écart 0');
check(db.sessions[0].note === undefined, "pas de mot sans écart : aucune note enregistrée");
check(!db.entries.find((e) => e.id === 'ecart2'), 'aucune écriture générée quand il n’y a pas d’écart');

if (failures) {
  console.log(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log('\nTout est bon.');
