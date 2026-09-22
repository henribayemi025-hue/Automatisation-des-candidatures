/**
 * Feuille de temps : les heures posées d'office doivent pouvoir se corriger,
 * et la paie à l'heure doit suivre la correction.
 *
 *   npx vite-node scripts/heures-check.ts
 */
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { attendanceIn, daysWorked, grossFor, hoursWorked, payrollPreview } from '../src/lib/payroll';
import type { DB, Employee, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: '2026-09-22T08:00:00.000Z', actorId: 'u', actorName: 'Beau', type, payload });

const salarie = (id: string, name: string, payKind: Employee['payKind'], rate: number): Employee => ({
  id, name, role: 'Apprenti', phone: '', payKind, rate,
  startedOn: '2026-01-01', notes: '', createdAt: '2026-01-01T08:00:00.000Z',
});

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Garage', currency: 'XAF', chart: 'SYSCOHADA', sector: 'garage', onboarded: true } }));
db = applyEvent(db, ev('employee.save', { employee: salarie('ap', 'Éric', 'HOURLY', 500) }));
db = applyEvent(db, ev('employee.save', { employee: salarie('ch', 'Awa', 'MONTHLY', 120000) }));

// ── Ce que le pointage pose tout seul ────────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-01', status: 'PRESENT', hours: 8 }));
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-02', status: 'HALF', hours: 4 }));
let liste = attendanceIn(db.attendance, 'ap', '2026-09');
check(hoursWorked(liste) === 12, 'une journée et une demie posent 8 + 4 heures d’office');
check(grossFor(salarie('ap', 'Éric', 'HOURLY', 500), liste).gross === 6000, 'et la paie à l’heure vaut 12 × 500');

// ── La correction, qui est tout l'intérêt ────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-01', status: 'PRESENT', hours: 11 }));
liste = attendanceIn(db.attendance, 'ap', '2026-09');
check(hoursWorked(liste) === 15, 'corriger 8 en 11 donne 15 heures');
check(grossFor(salarie('ap', 'Éric', 'HOURLY', 500), liste).gross === 7500, 'la paie à l’heure suit la correction');
check(liste.length === 2, 'et ne crée pas une deuxième ligne pour le même jour');
check(daysWorked(liste) === 1.5, 'le nombre de jours ne change pas quand on corrige des heures');

// ── Une correction à la baisse ───────────────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-01', status: 'PRESENT', hours: 5 }));
liste = attendanceIn(db.attendance, 'ap', '2026-09');
check(hoursWorked(liste) === 9, 'un apprenti qui a fait cinq heures n’est plus payé huit');

// ── Ce que les heures ne doivent PAS changer ─────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ch', date: '2026-09-01', status: 'PRESENT', hours: 3 }));
const mensuel = payrollPreview(db, '2026-09').find((s) => s.employeeId === 'ch');
check(mensuel?.gross === 120000, 'un salaire mensuel ne bouge pas avec les heures pointées');

// ── Un congé ne compte aucune heure ──────────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-03', status: 'LEAVE', hours: 8 }));
liste = attendanceIn(db.attendance, 'ap', '2026-09');
check(hoursWorked(liste) === 9, 'un congé ne compte aucune heure, même si des heures traînent sur la ligne');

// ── L'absence non plus ───────────────────────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'ap', date: '2026-09-04', status: 'ABSENT', hours: 8 }));
check(hoursWorked(attendanceIn(db.attendance, 'ap', '2026-09')) === 9, 'une absence non plus');

// ── Les bornes de saisie, telles que l'écran les applique ────────────────
const borne = (v: string) => Math.max(0, Math.min(24, Number(v.replace(',', '.')) || 0));
check(borne('88') === 24, 'un doigt qui glisse et tape 88 est ramené à 24');
check(borne('-3') === 0, 'un nombre négatif est ramené à zéro');
check(borne('7,5') === 7.5, 'la virgule décimale est acceptée : on écrit 7,5 en français');
check(borne('') === 0, 'un champ vidé vaut zéro, pas NaN');
check(borne('abc') === 0, 'du texte vaut zéro, pas NaN');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
