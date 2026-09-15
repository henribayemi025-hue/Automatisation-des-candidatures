/**
 * Le scellé de l'instantané. Ce que vérifie ce script : une empreinte stable,
 * sensible au moindre changement d'écriture, et un verdict qui distingue
 * l'instantané conforme de l'instantané réécrit après coup.
 */
import { hashState, verifySeal, SEAL_EVENT } from '../src/lib/seal';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { accountCode } from '../src/lib/chart';
import type { DB, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
const feed = (db: DB, type: string, payload: Record<string, unknown>): DB => {
  seq += 1;
  return applyEvent(db, { id: `e${seq}`, seq, at: '2026-09-15T10:00:00.000Z', actorId: 'u1', actorName: 'Test', type, payload });
};

let db = emptyDB();
db = feed(db, 'company.update', { patch: { name: 'Boutique', currency: 'XAF', chart: 'SYSCOHADA', onboarded: true } });
const chart = db.company.chart;
db = feed(db, 'entry.manual', {
  entryId: 'j1', date: '2026-09-01', journal: 'OD', ref: 'OD-1', label: 'Apport',
  lines: [
    { account: accountCode(chart, 'CASH'), debit: 500_000, credit: 0 },
    { account: accountCode(chart, 'CAPITAL'), debit: 0, credit: 500_000 },
  ],
});

const seal = (sealedSeq: number, hash: string, entries: number, at = seq + 1): WorkspaceEvent => ({
  id: `s${at}`, seq: at, at: '2026-09-15T10:00:00.000Z', actorId: 'u1', actorName: 'Test',
  type: SEAL_EVENT, payload: { sealedSeq, hash, entries } as unknown as Record<string, unknown>,
});

const h1 = await hashState(db);
const h1bis = await hashState(structuredClone(db));
console.log('empreinte stable                 :', h1 === h1bis ? 'oui' : 'NON', h1.slice(0, 12));

// Une écriture de plus doit changer l'empreinte.
let db2 = feed(db, 'entry.manual', {
  entryId: 'j2', date: '2026-09-02', journal: 'OD', ref: 'OD-2', label: 'Faux',
  lines: [
    { account: accountCode(chart, 'CASH'), debit: 100_000, credit: 0 },
    { account: accountCode(chart, 'MISC_REVENUE'), debit: 0, credit: 100_000 },
  ],
});
const h2 = await hashState(db2);
console.log('une écriture ajoutée la change   :', h1 !== h2 ? 'oui' : 'NON');

// Un montant modifié en douce doit la changer aussi.
const truque = structuredClone(db);
truque.entries[0].lines[0].debit = 900_000;
console.log('un montant modifié la change     :', (await hashState(truque)) !== h1 ? 'oui' : 'NON');

// Un réglage d'affichage ne doit PAS la changer : sinon on crie au loup.
const cosmetique = structuredClone(db);
cosmetique.company.name = 'Boutique renommée';
console.log('un renommage ne la change pas    :', (await hashState(cosmetique)) === h1 ? 'oui' : 'NON');

const cas: [string, ReturnType<typeof verifySeal>['state'], boolean][] = [];
cas.push(['aucun instantané', verifySeal(0, h1, []).state, true]);
cas.push(['instantané conforme', verifySeal(2, h1, [seal(2, h1, 1)]).state, true]);
cas.push(['instantané jamais scellé', verifySeal(2, h1, []).state, true]);
cas.push(['instantané réécrit', verifySeal(2, await hashState(truque), [seal(2, h1, 1)]).state, true]);
cas.push(['deux empreintes pour le même rang', verifySeal(2, h1, [seal(2, h1, 1, 3), seal(2, h2, 1, 4)]).state, true]);

const attendus = ['AUCUN_INSTANTANE', 'CONFORME', 'NON_SCELLE', 'DIVERGENT', 'DIVERGENT'];
console.log('--- verdicts ---');
let ok = h1 === h1bis && h1 !== h2 && (await hashState(truque)) !== h1 && (await hashState(cosmetique)) === h1;
cas.forEach(([nom, verdict], i) => {
  const bon = verdict === attendus[i];
  if (!bon) ok = false;
  console.log(`${bon ? 'OK ' : 'KO '} ${nom.padEnd(34)} → ${verdict} (attendu ${attendus[i]})`);
});
console.log(ok ? 'OK — l’empreinte est stable et sensible, le réécrit est détecté.' : 'ÉCHEC');
process.exit(ok ? 0 : 1);
