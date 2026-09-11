/**
 * Immobilisations, amortissements et clôture d'exercice, rejoués sur un cas
 * complet : on vérifie que le bilan reste équilibré avant et après la clôture,
 * que le compte de résultat de l'exercice clos reste lisible, et que le
 * résultat part bien en report à nouveau.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { accumulatedAt, depreciationPlan, netValue } from '../src/lib/assets';
import { carryForwardLines, closingPlan, dayAfter } from '../src/lib/closing';
import { balanceOf, balanceSheet, incomeStatement, runAuditChecks, trialBalance } from '../src/lib/ledger';
import type { DB, FixedAsset, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
function ev(type: string, payload: Record<string, unknown>, at = '2025-06-01T10:00:00.000Z'): WorkspaceEvent {
  seq += 1;
  return { id: `e${seq}`, at, actorId: 'u1', actorName: 'Beau', type, payload };
}

let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>, at?: string) => {
  db = applyEvent(db, ev(type, payload, at));
};
const chart = () => db.company.chart;
const money = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ');

feed('company.update', { patch: { name: 'Boulangerie Awa', currency: 'XAF', country: 'Cameroun', chart: 'SYSCOHADA', fiscalYearStart: '01-01' } });

// Apport du fondateur, pour partir d'un bilan qui tient debout.
feed('entry.manual', {
  entryId: 'ap1',
  date: '2025-01-02',
  journal: 'OD',
  ref: 'AP-0001',
  label: 'Apport en capital',
  lines: [
    { account: accountCode(chart(), 'BANK'), debit: 3_000_000, credit: 0 },
    { account: accountCode(chart(), 'CAPITAL'), debit: 0, credit: 3_000_000 },
  ],
});

// Un four à 1 200 000, amorti sur 5 ans, payé par la banque.
const four: FixedAsset = {
  id: 'a1',
  name: 'Four à pain',
  category: 'Matériel et outillage',
  acquiredOn: '2025-01-15',
  cost: 1_200_000,
  salvage: 0,
  months: 60,
  method: 'LINEAR',
  status: 'ACTIVE',
  notes: '',
  createdAt: '2025-01-15T08:00:00.000Z',
};
feed('asset.save', { asset: four, paidWith: 'BANK', entryId: 'im1' });

// Un peu d'activité : des ventes encaissées et un loyer.
for (const [i, amount] of [900_000, 1_100_000, 850_000].entries()) {
  feed('entry.manual', {
    entryId: `v${i}`,
    date: `2025-0${i + 3}-10`,
    journal: 'VT',
    ref: `FA-000${i + 1}`,
    label: 'Ventes du mois',
    lines: [
      { account: accountCode(chart(), 'CASH'), debit: amount, credit: 0 },
      { account: accountCode(chart(), 'SALES'), debit: 0, credit: amount },
    ],
  });
}
feed('entry.manual', {
  entryId: 'lo1',
  date: '2025-04-05',
  journal: 'OD',
  ref: 'OD-0002',
  label: 'Loyer du trimestre',
  lines: [
    { account: accountCode(chart(), 'RENT'), debit: 600_000, credit: 0 },
    { account: accountCode(chart(), 'BANK'), debit: 0, credit: 600_000 },
  ],
});

// Douze dotations mensuelles, une par mois de 2025.
for (let m = 1; m <= 12; m += 1) {
  const period = `2025-${String(m).padStart(2, '0')}`;
  const plan = depreciationPlan(db.assets.filter((a) => a.status === 'ACTIVE'), db.depreciations, period);
  if (!plan.length) continue;
  feed('depreciation.run', {
    period,
    date: `${period}-28`,
    entryId: `dot-${period}`,
    items: plan.map((l, i) => ({ id: `d-${period}-${i}`, assetId: l.asset.id, amount: l.amount })),
  });
}

const posted = db.depreciations.reduce((s, d) => s + d.amount, 0);
console.log('--- amortissements ---');
console.log('dotations 2025        :', money(posted), '(attendu 240 000 = 1 200 000 / 5)');
console.log('cumul théorique       :', money(accumulatedAt(four, '2025-12')));
console.log('valeur nette du four  :', money(netValue(db.assets[0], db.depreciations)));
console.log('compte 681 (dotations):', money(balanceOf(accountCode(chart(), 'DEPRECIATION_EXPENSE'), db.entries, 'DEBIT')));
console.log('compte 2844 (cumul)   :', money(balanceOf(accountCode(chart(), 'DEPRECIATION'), db.entries, 'CREDIT')));

const before = balanceSheet(db.accounts, db.entries, '2025-12-31');
const incomeBefore = incomeStatement(db.accounts, db.entries, '2025-01-01', '2025-12-31');
console.log('\n--- avant clôture ---');
console.log('produits', money(incomeBefore.totalRevenue), '· charges', money(incomeBefore.totalExpenses), '· résultat', money(incomeBefore.netIncome));
console.log('écart bilan           :', before.difference);

// Clôture de l'exercice 2025.
const range = { from: '2025-01-01', to: '2025-12-31', label: '2025' };
const plan = closingPlan(db.accounts, db, range);
feed(
  'year.close',
  {
    closingId: 'c1',
    from: range.from,
    to: range.to,
    lines: plan.lines,
    revenue: plan.revenue,
    expenses: plan.expenses,
    result: plan.result,
    closingEntryId: 'clo1',
    carryEntryId: 'an1',
    carryDate: dayAfter(range.to),
    carryLines: carryForwardLines(chart(), plan.result),
  },
  '2026-01-05T09:00:00.000Z',
);

const after = balanceSheet(db.accounts, db.entries, '2026-01-31');
const incomeAfter = incomeStatement(db.accounts, db.entries, '2025-01-01', '2025-12-31');
const gestion2025 = trialBalance(db.accounts, db.entries, '2025-01-01', '2025-12-31').filter(
  (b) => b.account.kind === 'REVENUE' || b.account.kind === 'EXPENSE',
);

console.log('\n--- après clôture ---');
console.log('résultat comptabilisé :', money(plan.result));
console.log('compte de résultat 2025 (rapport) : produits', money(incomeAfter.totalRevenue), '· charges', money(incomeAfter.totalExpenses));
console.log('soldes 6 et 7 après clôture       :', gestion2025.reduce((s, b) => s + b.balance, 0), '(attendu 0)');
console.log('compte 121 report à nouveau       :', money(balanceOf(accountCode(chart(), 'RETAINED'), db.entries, 'CREDIT')));
console.log('compte 120 résultat               :', money(balanceOf(accountCode(chart(), 'RESULT'), db.entries, 'CREDIT')), '(attendu 0 après affectation)');
console.log('écart bilan                       :', after.difference);

const checks = runAuditChecks(db.accounts, db.entries);
console.log('\n--- audit ---');
for (const c of checks) console.log(c.severity.padEnd(6), c.label);

// Réouverture : tout doit revenir exactement à l'état d'avant.
feed('year.reopen', { closingId: 'c1', date: '2026-02-01', closingReversalId: 'r1', carryReversalId: 'r2' }, '2026-02-01T09:00:00.000Z');
const reopened = incomeStatement(db.accounts, db.entries, '2025-01-01', '2025-12-31');
const afterReopen = balanceSheet(db.accounts, db.entries, '2026-02-28');
console.log('\n--- après réouverture ---');
console.log('résultat 2025 retrouvé :', money(reopened.netIncome), '· clôtures restantes', db.closings.length, '· écart bilan', afterReopen.difference);

const ok =
  posted === 240_000 &&
  plan.result === incomeBefore.netIncome &&
  before.difference === 0 &&
  after.difference === 0 &&
  afterReopen.difference === 0 &&
  gestion2025.reduce((s, b) => s + b.balance, 0) === 0 &&
  balanceOf(accountCode(chart(), 'RETAINED'), db.entries, 'CREDIT') === 0 &&
  incomeAfter.totalRevenue === incomeBefore.totalRevenue &&
  checks.every((c) => c.severity !== 'ERROR');

console.log(ok ? '\nOK — amortissements, clôture et réouverture équilibrés.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
