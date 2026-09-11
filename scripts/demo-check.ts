import { buildDemoEvents } from '../src/lib/demo';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { profileToCompany } from '../src/lib/countries';
import { balanceSheet, incomeStatement, runAuditChecks, trialBalance } from '../src/lib/ledger';
import { outstanding, snapshot } from '../src/lib/metrics';
import { countryProfile } from '../src/lib/countries';

const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
let db = emptyDB();
const profile = countryProfile(process.argv[3] ?? 'Cameroun')!;
db = applyEvent(db, {
  id: 'c', at: today + 'T08:00:00.000Z', actorId: null, actorName: 'Test', type: 'company.update',
  payload: { patch: { ...profileToCompany(profile), name: 'Boutique démo', country: profile.name, currency: profile.currency, onboarded: true, mode: 'EXPERT' } },
});
const events = buildDemoEvents(db, { id: null, name: 'Henri' }, 'demo', today);
let failed = 0;
for (const ev of events) { try { db = applyEvent(db, ev); } catch (e) { failed++; console.log('REFUSÉ', ev.type, (e as Error).message); } }

const tb = trialBalance(db.accounts, db.entries);
const is = incomeStatement(db.accounts, db.entries);
const bs = balanceSheet(db.accounts, db.entries);
const s = snapshot(db);
const checks = runAuditChecks(db.accounts, db.entries);
console.log('événements', events.length, 'refusés', failed);
console.log('produits', db.products.length, 'ventes', db.sales.filter(x=>x.status==='CONFIRMED').length, 'devis', db.sales.filter(x=>x.status==='QUOTE').length,
  'achats', db.purchases.length, 'dépenses', db.expenses.length, 'écritures', db.entries.length, 'mouvements', db.movements.length, 'sessions', db.sessions.length, 'historique', db.audit.length);
const totDebit = tb.reduce((a, b) => a + b.debit, 0);
const totCredit = tb.reduce((a, b) => a + b.credit, 0);
console.log('balance débit/crédit', totDebit, totCredit, totDebit === totCredit ? 'ÉQUILIBRÉE' : 'DÉSÉQUILIBRÉE');
console.log('CA', is.totalRevenue, 'charges', is.totalExpenses, 'résultat', is.netIncome);
console.log('actif', bs.totalAssets, '| passif', bs.totalLiabilities, '| capitaux', bs.totalEquity, '| écart bilan', bs.difference);
console.log('trésorerie', s.cashOnHand, 'créances', s.receivables, 'dettes fourn.', s.payables, 'stock', s.stockValue, 'ruptures', s.outOfStock, 'bas', s.lowStock);
console.log('stock négatif ?', db.products.filter(p=>p.stock<0).map(p=>`${p.name}:${p.stock}`).join(', ') || 'aucun');
console.log('dettes ouvertes', db.debts.filter(d=>outstanding(d)>0).length);
for (const c of checks) console.log(c.severity.padEnd(6), c.label, '—', c.detail);
console.log('--- stock final ---');
for (const p of db.products) console.log(`${p.name}: ${p.stock} (seuil ${p.reorderPoint})${p.archived ? ' [archivé]' : ''}`);
console.log('--- soldes par compte ---');
for (const b of tb) if (b.debit || b.credit) console.log(`${b.account.code} ${b.account.label}: D ${b.debit} C ${b.credit} = ${b.balance}`);
console.log('--- caisse ---');
for (const s of db.sessions) console.log(s.openedAt.slice(0,10), 'ouverture', s.opening, 'attendu', s.expected, 'compté', s.counted, 'écart', s.variance);
