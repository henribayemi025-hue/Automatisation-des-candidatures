/**
 * Congés : demander, répondre, et que le pointage suive — sans jamais réécrire
 * le passé ni toucher à la comptabilité.
 *
 *   npx vite-node scripts/conges-check.ts
 */
import { applyEvent, emptyDB } from '../src/lib/reducer';
import { absencesEnMemeTemps, chevauche, enAttente, joursAcceptes, nombreDeJours, pointagesAPoser } from '../src/lib/leaves';
import { daysWorked, attendanceIn } from '../src/lib/payroll';
import type { DB, Employee, LeaveRequest, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

let seq = 0;
const ev = (type: string, payload: Record<string, unknown>, actor = 'Beau'): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: '2026-09-22T08:00:00.000Z', actorId: 'u', actorName: actor, type, payload });

const salarie = (id: string, name: string): Employee => ({
  id, name, role: 'Vendeuse', phone: '', payKind: 'DAILY', rate: 3000,
  startedOn: '2026-01-01', notes: '', createdAt: '2026-01-01T08:00:00.000Z',
});
const demande = (o: Partial<LeaveRequest> & { id: string; employeeId: string; employeeName: string; from: string; to: string }): LeaveRequest => ({
  reason: '', status: 'PENDING', decidedBy: '', decidedAt: '', createdAt: '2026-09-20T08:00:00.000Z', ...o,
});

// ── Compter des jours ────────────────────────────────────────────────────
check(nombreDeJours('2026-10-05', '2026-10-05') === 1, 'un jour seul compte pour un');
check(nombreDeJours('2026-10-05', '2026-10-09') === 5, 'du 5 au 9 fait cinq jours, bornes comprises');
check(nombreDeJours('2026-10-09', '2026-10-05') === 0, 'une fin avant le début ne compte rien');
check(nombreDeJours('2026-10-30', '2026-11-02') === 4, 'un congé à cheval sur deux mois compte bien');
check(chevauche({ from: '2026-10-05', to: '2026-10-09' }, { from: '2026-10-09', to: '2026-10-12' }), 'deux congés qui partagent un jour se chevauchent');
check(!chevauche({ from: '2026-10-05', to: '2026-10-08' }, { from: '2026-10-09', to: '2026-10-12' }), 'deux congés bout à bout ne se chevauchent pas');

let db: DB = emptyDB();
db = applyEvent(db, ev('company.update', { patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', sector: 'retail', onboarded: true } }));
db = applyEvent(db, ev('employee.save', { employee: salarie('awa', 'Awa') }));
db = applyEvent(db, ev('employee.save', { employee: salarie('lea', 'Léa') }));
const ecrituresAvant = db.entries.length;

// ── Une demande, puis une réponse ────────────────────────────────────────
db = applyEvent(db, ev('leave.request', { leave: demande({ id: 'c1', employeeId: 'awa', employeeName: 'Awa', from: '2026-10-05', to: '2026-10-07', reason: 'Voyage' }) }));
check(enAttente(db.leaves).length === 1, 'la demande entre dans la file d’attente');
check(db.attendance.length === 0, 'une demande NON répondue ne pointe rien');

db = applyEvent(db, ev('leave.decide', { leaveId: 'c1', status: 'APPROVED', attendanceIds: ['p1', 'p2', 'p3'] }, 'Beau'));
check(enAttente(db.leaves).length === 0, 'répondre sort la demande de la file');
check(db.leaves[0].decidedBy === 'Beau', 'on garde qui a répondu');
check(db.attendance.filter((a) => a.status === 'LEAVE').length === 3, 'accepter pose les trois jours de congé au pointage');
check(db.attendance.every((a) => a.note === 'Voyage'), 'le motif suit sur le pointage');

// ── LA règle : on ne réécrit pas le passé ────────────────────────────────
db = applyEvent(db, ev('attendance.mark', { employeeId: 'lea', date: '2026-10-12', status: 'PRESENT', hours: 8 }));
db = applyEvent(db, ev('leave.request', { leave: demande({ id: 'c2', employeeId: 'lea', employeeName: 'Léa', from: '2026-10-12', to: '2026-10-14' }) }));
const aPoser = pointagesAPoser(db.leaves.find((l) => l.id === 'c2')!, db.attendance);
check(aPoser.length === 2 && !aPoser.includes('2026-10-12'), 'le jour déjà pointé est laissé de côté avant même la réponse');
db = applyEvent(db, ev('leave.decide', { leaveId: 'c2', status: 'APPROVED', attendanceIds: ['q1', 'q2'] }));
const le12 = db.attendance.find((a) => a.employeeId === 'lea' && a.date === '2026-10-12');
check(le12?.status === 'PRESENT', 'une personne pointée présente le reste : un congé accepté après coup ne réécrit pas le passé');
check(db.attendance.filter((a) => a.employeeId === 'lea' && a.status === 'LEAVE').length === 2, 'seuls les jours vides reçoivent le congé');

// ── Refuser ne pointe rien ───────────────────────────────────────────────
db = applyEvent(db, ev('leave.request', { leave: demande({ id: 'c3', employeeId: 'awa', employeeName: 'Awa', from: '2026-11-03', to: '2026-11-04' }) }));
const avantRefus = db.attendance.length;
db = applyEvent(db, ev('leave.decide', { leaveId: 'c3', status: 'REFUSED' }));
check(db.attendance.length === avantRefus, 'un congé refusé ne pointe rien');

// ── Aucune écriture comptable, jamais ────────────────────────────────────
check(db.entries.length === ecrituresAvant, 'aucun congé n’écrit dans le journal : le salaire le couvre déjà');

// ── Ce que la paie en fait ───────────────────────────────────────────────
check(daysWorked(attendanceIn(db.attendance, 'awa', '2026-10')) === 0, 'trois jours de congé comptent zéro jour travaillé');
check(daysWorked(attendanceIn(db.attendance, 'lea', '2026-10')) === 1, 'et le jour réellement travaillé compte toujours');

// ── Prévenir sans bloquer ────────────────────────────────────────────────
db = applyEvent(db, ev('leave.request', { leave: demande({ id: 'c4', employeeId: 'lea', employeeName: 'Léa', from: '2026-10-06', to: '2026-10-08' }) }));
const conflits = absencesEnMemeTemps(db.leaves, db.leaves.find((l) => l.id === 'c4')!);
check(conflits.length === 1 && conflits[0].employeeName === 'Awa', 'on signale qui est déjà absent sur les mêmes jours');
check(enAttente(db.leaves).length === 1, 'mais on ne bloque pas la demande : c’est son commerce');

check(joursAcceptes(db.leaves, 'awa', '2026-10-01', '2026-10-31') === 3, 'on sait compter les jours acceptés d’un mois');
check(joursAcceptes(db.leaves, 'awa', '2026-11-01', '2026-11-30') === 0, 'un congé refusé n’est pas compté');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
