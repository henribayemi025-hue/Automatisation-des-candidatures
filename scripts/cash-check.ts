// Une caisse n'est jamais négative : on rejoue le jeu d'essai jour par jour
// et on vérifie que caisse, compte mobile et banque restent à zéro ou plus.
import { buildDemoEvents } from '../src/lib/demo';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { profileToCompany, countryProfile } from '../src/lib/countries';
import { accountCode } from '../src/lib/chart';

const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
let db = emptyDB();
const profile = countryProfile('Cameroun')!;
db = applyEvent(db, {
  id: 'c', at: today + 'T08:00:00.000Z', actorId: null, actorName: 'Test', type: 'company.update',
  payload: { patch: { ...profileToCompany(profile), name: 'Boutique démo', country: profile.name, currency: profile.currency, onboarded: true, mode: 'EXPERT' } },
});
for (const ev of buildDemoEvents(db, { id: null, name: 'Henri' }, 'demo', today)) db = applyEvent(db, ev);

const chart = db.company.chart;
const accounts = { Caisse: accountCode(chart, 'CASH'), Mobile: accountCode(chart, 'MOBILE_MONEY'), Banque: accountCode(chart, 'BANK') };
let ok = true;
for (const [name, code] of Object.entries(accounts)) {
  const sorted = db.entries.filter((e) => e.posted).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  let bal = 0;
  let min = 0;
  let minDate = '';
  for (const e of sorted) for (const l of e.lines) if (l.account === code) { bal += l.debit - l.credit; if (bal < min) { min = bal; minDate = `${e.date} ${e.label}`; } }
  console.log(`${name.padEnd(8)} solde final ${bal}  minimum ${min}${min < 0 ? '  ← NÉGATIF le ' + minDate : ''}`);
  if (min < 0) ok = false;
}
console.log(ok ? 'OK — aucun compte de trésorerie ne passe sous zéro.' : 'ERREUR — un compte de trésorerie passe sous zéro.');
