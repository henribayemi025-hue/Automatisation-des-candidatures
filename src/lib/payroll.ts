import type { Attendance, DB, Employee, ISODate, Minor, Payslip } from './types';

/**
 * Paie. Volontairement simple, et honnête sur ce qu'elle ne fait pas : c'est
 * un suivi de ce qu'on doit et de ce qu'on a versé, pas un logiciel de paie.
 * Les cotisations sociales et les bulletins réglementaires dépendent du pays
 * et changent chaque année — ils ne sont pas ici, et on ne fait pas semblant.
 *
 * Trois façons de payer, celles qu'on rencontre vraiment :
 *   — au mois : le montant est le même, présent ou pas ;
 *   — à la journée : on paie les jours pointés (une demi-journée compte 0,5) ;
 *   — à l'heure : on paie les heures pointées.
 */

/** Première et dernière date d'une période AAAA-MM. */
export function periodBounds(period: string): { from: ISODate; to: ISODate } {
  const [y, m] = period.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, '0')}` };
}

export function attendanceIn(list: Attendance[], employeeId: string, period: string): Attendance[] {
  const { from, to } = periodBounds(period);
  return list.filter((a) => a.employeeId === employeeId && a.date >= from && a.date <= to);
}

/** Jours travaillés : une journée entière compte 1, une demi-journée 0,5. */
export function daysWorked(list: Attendance[]): number {
  return list.reduce((s, a) => s + (a.status === 'PRESENT' ? 1 : a.status === 'HALF' ? 0.5 : 0), 0);
}

export function hoursWorked(list: Attendance[]): number {
  return list.reduce((s, a) => s + (a.status === 'ABSENT' || a.status === 'LEAVE' ? 0 : a.hours), 0);
}

/** Avances versées sur la période et pas encore retenues sur une paie. */
export function openAdvances(db: DB, employeeId: string, upTo: ISODate): Minor {
  const paid = db.advances
    .filter((a) => a.employeeId === employeeId && a.date <= upTo)
    .reduce((s, a) => s + a.amount, 0);
  const withheld = db.payrolls
    .flatMap((r) => r.slips)
    .filter((s) => s.employeeId === employeeId)
    .reduce((s, x) => s + x.advances, 0);
  return Math.max(0, paid - withheld);
}

/** Ce qui est dû à une personne pour une période, avant retenue des avances. */
export function grossFor(employee: Employee, list: Attendance[]): { gross: Minor; basis: string } {
  if (employee.payKind === 'MONTHLY') {
    return { gross: employee.rate, basis: 'Salaire du mois' };
  }
  if (employee.payKind === 'DAILY') {
    const days = daysWorked(list);
    return { gross: Math.round(employee.rate * days), basis: `${days} jour(s) pointé(s)` };
  }
  const hours = hoursWorked(list);
  return { gross: Math.round(employee.rate * hours), basis: `${hours} heure(s) pointée(s)` };
}

/**
 * Bulletins proposés pour une période. Les avances en cours sont retenues,
 * sans jamais dépasser ce qui est dû : on ne crée pas un net négatif, le
 * reliquat d'avance suit sur la paie suivante.
 */
export function payrollPreview(db: DB, period: string): Payslip[] {
  const { to } = periodBounds(period);
  const done = new Set(db.payrolls.filter((r) => r.period === period).flatMap((r) => r.slips.map((s) => s.employeeId)));

  return db.employees
    .filter((e) => !e.archived && e.startedOn <= to && !done.has(e.id))
    .map((employee) => {
      const list = attendanceIn(db.attendance, employee.id, period);
      const { gross, basis } = grossFor(employee, list);
      const advances = Math.min(openAdvances(db, employee.id, to), gross);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        gross,
        advances,
        net: gross - advances,
        basis,
      };
    })
    .filter((s) => s.gross > 0);
}

/** Masse salariale versée sur une période, pour l'accueil et les rapports. */
export function payrollCost(db: DB, from: ISODate, to: ISODate): Minor {
  return db.payrolls.filter((r) => r.date >= from && r.date <= to).reduce((s, r) => s + r.gross, 0);
}

export const PAY_KIND_LABEL: Record<Employee['payKind'], string> = {
  MONTHLY: 'Au mois',
  DAILY: 'À la journée',
  HOURLY: 'À l’heure',
};

export const ATTENDANCE_LABEL: Record<Attendance['status'], string> = {
  PRESENT: 'Présent',
  HALF: 'Demi-journée',
  ABSENT: 'Absent',
  LEAVE: 'Congé',
};
