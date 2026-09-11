/**
 * Personnel : avances, présences et paie rejouées sur un cas complet.
 * Ce qu'on vérifie, c'est qu'une avance n'est jamais comptée deux fois — une
 * fois en sortie d'argent, une fois en charge — et que le bilan tient avant
 * comme après la paie.
 */
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { grossFor, openAdvances, payrollPreview, attendanceIn, daysWorked } from '../src/lib/payroll';
import { balanceOf, balanceSheet, incomeStatement, runAuditChecks } from '../src/lib/ledger';
import type { DB, Employee, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
function ev(type: string, payload: Record<string, unknown>, at = '2026-03-31T18:00:00.000Z'): WorkspaceEvent {
  seq += 1;
  return { id: `e${seq}`, at, actorId: 'u1', actorName: 'Beau', type, payload };
}
let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>, at?: string) => {
  db = applyEvent(db, ev(type, payload, at));
};
const chart = () => db.company.chart;
const money = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ');

feed('company.update', { patch: { name: 'Boutique Awa', currency: 'XAF', chart: 'SYSCOHADA', fiscalYearStart: '01-01' } });
feed('entry.manual', {
  entryId: 'ap1',
  date: '2026-03-01',
  journal: 'OD',
  ref: 'AP-0001',
  label: 'Apport',
  lines: [
    { account: accountCode(chart(), 'CASH'), debit: 2_000_000, credit: 0 },
    { account: accountCode(chart(), 'CAPITAL'), debit: 0, credit: 2_000_000 },
  ],
});

const awa: Employee = {
  id: 'emp1', name: 'Awa', role: 'Vendeuse', phone: '', payKind: 'MONTHLY', rate: 120_000,
  startedOn: '2026-01-05', notes: '', createdAt: '2026-01-05T08:00:00.000Z',
};
const paul: Employee = {
  id: 'emp2', name: 'Paul', role: 'Livreur', phone: '', payKind: 'DAILY', rate: 4_000,
  startedOn: '2026-02-01', notes: '', createdAt: '2026-02-01T08:00:00.000Z',
};
feed('employee.save', { employee: awa });
feed('employee.save', { employee: paul });

// Paul est pointé : 18 journées entières et 2 demi-journées en mars.
for (let d = 1; d <= 20; d += 1) {
  const date = `2026-03-${String(d).padStart(2, '0')}`;
  feed('attendance.mark', { employeeId: paul.id, date, status: d <= 18 ? 'PRESENT' : 'HALF', hours: d <= 18 ? 8 : 4, attendanceId: `at${d}` });
}
// Un repointage : le 5 mars était en fait une absence.
feed('attendance.mark', { employeeId: paul.id, date: '2026-03-05', status: 'ABSENT', hours: 0, attendanceId: 'at5b' });

// Avance de 30 000 à Awa en milieu de mois.
feed('staff.advance', {
  advance: { id: 'av1', employeeId: awa.id, date: '2026-03-15', amount: 30_000, method: 'CASH', note: 'École', entryId: 'jav1', createdAt: '2026-03-15T10:00:00.000Z' },
});

const paulDays = daysWorked(attendanceIn(db.attendance, paul.id, '2026-03'));
console.log('--- pointage ---');
console.log('lignes de présence Paul :', attendanceIn(db.attendance, paul.id, '2026-03').length, '(20 attendu, le repointage ne duplique pas)');
console.log('jours travaillés Paul   :', paulDays, '(17 entiers + 1 demi + 1 demi = 18)');
console.log('brut Paul               :', money(grossFor(paul, attendanceIn(db.attendance, paul.id, '2026-03')).gross));
console.log('avance en cours Awa     :', money(openAdvances(db, awa.id, '2026-03-31')));
console.log('compte 421 avances      :', money(balanceOf(accountCode(chart(), 'STAFF_ADVANCE'), db.entries, 'DEBIT')));

const before = balanceSheet(db.accounts, db.entries, '2026-03-31');
const preview = payrollPreview(db, '2026-03');
console.log('\n--- paie de mars ---');
for (const s of preview) console.log(` ${s.employeeName.padEnd(6)} ${s.basis.padEnd(22)} brut ${money(s.gross).padStart(9)} · avances ${money(s.advances).padStart(7)} · net ${money(s.net).padStart(9)}`);

const gross = preview.reduce((s, x) => s + x.gross, 0);
const advances = preview.reduce((s, x) => s + x.advances, 0);
const net = preview.reduce((s, x) => s + x.net, 0);
feed('payroll.run', {
  run: { id: 'run1', period: '2026-03', date: '2026-03-31', slips: preview, gross, advances, net, paid: true, method: 'CASH', entryId: 'jp1', createdAt: '2026-03-31T18:00:00.000Z' },
});

const after = balanceSheet(db.accounts, db.entries, '2026-03-31');
const income = incomeStatement(db.accounts, db.entries, '2026-03-01', '2026-03-31');
console.log('\ntotal brut              :', money(gross), '= avances', money(advances), '+ net', money(net));
console.log('charge 661 salaires     :', money(balanceOf(accountCode(chart(), 'PAYROLL'), db.entries, 'DEBIT')), '(doit valoir le brut, pas le net)');
console.log('compte 421 après paie   :', money(balanceOf(accountCode(chart(), 'STAFF_ADVANCE'), db.entries, 'DEBIT')), '(avance soldée)');
console.log('avance restante Awa     :', money(openAdvances(db, awa.id, '2026-03-31')));
console.log('charges du mois         :', money(income.totalExpenses));
console.log('écart bilan avant/après :', before.difference, '/', after.difference);

// Une paie non versée doit rester au passif, puis se solder au versement.
feed('employee.save', { employee: { ...paul, id: 'emp3', name: 'Sali', payKind: 'MONTHLY', rate: 80_000, startedOn: '2026-04-01' } }, '2026-04-30T18:00:00.000Z');
const april = payrollPreview(db, '2026-04');
feed(
  'payroll.run',
  { run: { id: 'run2', period: '2026-04', date: '2026-04-30', slips: april, gross: april.reduce((s, x) => s + x.gross, 0), advances: 0, net: april.reduce((s, x) => s + x.net, 0), paid: false, method: 'CASH', entryId: 'jp2', createdAt: '2026-04-30T18:00:00.000Z' } },
  '2026-04-30T18:00:00.000Z',
);
const owed = balanceOf(accountCode(chart(), 'STAFF_PAYABLE'), db.entries, 'CREDIT');
feed('payroll.settle', { runId: 'run2', method: 'MOBILE', date: '2026-05-03', entryId: 'jp3' }, '2026-05-03T09:00:00.000Z');
const owedAfter = balanceOf(accountCode(chart(), 'STAFF_PAYABLE'), db.entries, 'CREDIT');

console.log('\n--- paie différée ---');
console.log('salaires dus (422)      :', money(owed), '→ après versement', money(owedAfter));

const checks = runAuditChecks(db.accounts, db.entries);
console.log('\n--- audit ---');
for (const c of checks) console.log(c.severity.padEnd(6), c.label);

const final = balanceSheet(db.accounts, db.entries, '2026-05-31');
const ok =
  paulDays === 18 &&
  gross === 120_000 + 72_000 &&
  advances === 30_000 &&
  net === gross - 30_000 &&
  balanceOf(accountCode(chart(), 'PAYROLL'), db.entries, 'DEBIT') === gross + april.reduce((s, x) => s + x.gross, 0) &&
  balanceOf(accountCode(chart(), 'STAFF_ADVANCE'), db.entries, 'DEBIT') === 0 &&
  owedAfter === 0 &&
  before.difference === 0 &&
  after.difference === 0 &&
  final.difference === 0 &&
  checks.every((c) => c.severity !== 'ERROR');

console.log(ok ? '\nOK — avance comptée une seule fois, charge au brut, bilan équilibré.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
