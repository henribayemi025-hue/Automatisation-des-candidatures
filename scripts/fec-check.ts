/**
 * Export FEC : on vérifie le format sur le jeu d'essai — 18 colonnes par ligne,
 * dates AAAAMMJJ, montants avec virgule décimale, et surtout total débit égal
 * au total crédit une fois le fichier relu.
 */
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { buildDemoEvents } from '../src/lib/demo';
import { buildFec, fecFileName } from '../src/lib/fec';
import { countryProfile, profileToCompany } from '../src/lib/countries';
import { currency } from '../src/lib/money';
import type { DB } from '../src/lib/types';

const todayISO = process.argv[2] ?? '2026-09-12';

function demoFor(country: string): DB {
  const profile = countryProfile(country)!;
  let db: DB = emptyDB();
  db = applyEvent(db, {
    id: 'c',
    at: `${todayISO}T08:00:00.000Z`,
    actorId: null,
    actorName: 'Test',
    type: 'company.update',
    payload: {
      patch: { ...profileToCompany(profile), name: 'Boutique démo', country: profile.name, currency: profile.currency, onboarded: true, mode: 'EXPERT' },
    },
  });
  for (const ev of buildDemoEvents(db, { id: null, name: 'Henri' }, 'demo', todayISO)) db = applyEvent(db, ev);
  return db;
}

for (const [label, state] of [['XAF (0 décimale)', demoFor('Cameroun')], ['EUR (2 décimales)', demoFor('France')]] as const) {
  const decimals = currency(state.company.currency).decimals;
  const text = buildFec(state.accounts, state.entries, { decimals });
  const lines = text.split('\r\n');
  const header = lines[0].split('\t');
  const body = lines.slice(1);

  let debit = 0;
  let credit = 0;
  let badColumns = 0;
  let badDates = 0;
  const parse = (v: string) => Math.round(Number(v.replace(',', '.')) * 10 ** decimals);

  for (const line of body) {
    const cells = line.split('\t');
    if (cells.length !== 18) badColumns += 1;
    if (!/^\d{8}$/.test(cells[3]) || !/^\d{8}$/.test(cells[9])) badDates += 1;
    debit += parse(cells[11]);
    credit += parse(cells[12]);
  }

  console.log(`--- ${label} ---`);
  console.log('colonnes en-tête   :', header.length, header.length === 18 ? 'OK' : 'ÉCHEC');
  console.log('lignes             :', body.length);
  console.log('lignes mal formées :', badColumns, '· dates invalides', badDates);
  console.log('débit / crédit     :', debit, credit, debit === credit ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRÉ');
  console.log('nom de fichier     :', fecFileName(state.company, todayISO));
  console.log('exemple            :', body[0]?.slice(0, 110), '\n');

  if (header.length !== 18 || badColumns || badDates || debit !== credit) {
    console.log('ÉCHEC');
    process.exit(1);
  }
}
console.log('OK — FEC conforme sur les deux devises.');
