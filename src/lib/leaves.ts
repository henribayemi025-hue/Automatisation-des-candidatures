import type { Attendance, ISODate, LeaveRequest } from './types';

/**
 * Les congés : demander, répondre, et que le pointage suive.
 *
 * Aucune écriture comptable ici, et c'est voulu. Un congé ne coûte pas une
 * dépense de plus : le salaire mensuel le couvre déjà, et une paie au jour ou
 * à l'heure ne compte simplement pas ce jour-là — le pointage s'en charge.
 * Écrire quoi que ce soit dans le journal doublerait la charge.
 */

/** Tous les jours d'une demande, bornes comprises. */
export function joursDe(from: ISODate, to: ISODate): ISODate[] {
  const jours: ISODate[] = [];
  const fin = Date.parse(to);
  for (let d = Date.parse(from); d <= fin; d += 86400000) {
    jours.push(new Date(d).toISOString().slice(0, 10));
  }
  return jours;
}

/** Nombre de jours demandés, bornes comprises. Un jour seul en fait un. */
export function nombreDeJours(from: ISODate, to: ISODate): number {
  if (to < from) return 0;
  return joursDe(from, to).length;
}

/**
 * Deux demandes se chevauchent-elles ?
 *
 * On ne bloque pas : on prévient. Une commerçante sait mieux que nous si deux
 * absences sont compatibles — mais elle doit les voir avant de répondre.
 */
export function chevauche(a: { from: ISODate; to: ISODate }, b: { from: ISODate; to: ISODate }): boolean {
  return a.from <= b.to && b.from <= a.to;
}

/**
 * Les personnes déjà en congé accepté sur la même période.
 * Sert à dire « Awa aussi est absente ces jours-là » au moment de répondre.
 */
export function absencesEnMemeTemps(
  demandes: LeaveRequest[],
  demande: LeaveRequest,
): LeaveRequest[] {
  return demandes.filter(
    (x) => x.id !== demande.id && x.status === 'APPROVED' && x.employeeId !== demande.employeeId && chevauche(x, demande),
  );
}

/**
 * Le pointage qu'une acceptation doit produire.
 *
 * On ne remplace JAMAIS un pointage déjà saisi : si quelqu'un a marqué
 * « présent » un de ces jours-là, c'est qu'il a travaillé, et un congé accepté
 * après coup ne réécrit pas le passé. On ne pose le congé que sur les jours
 * encore vides.
 */
export function pointagesAPoser(
  demande: LeaveRequest,
  existants: Attendance[],
): ISODate[] {
  const deja = new Set(
    existants.filter((a) => a.employeeId === demande.employeeId).map((a) => a.date),
  );
  return joursDe(demande.from, demande.to).filter((j) => !deja.has(j));
}

/** Les demandes en attente, la plus ancienne d'abord : c'est l'ordre d'une file. */
export function enAttente(demandes: LeaveRequest[]): LeaveRequest[] {
  return demandes.filter((d) => d.status === 'PENDING').sort((a, b) => a.from.localeCompare(b.from));
}

/** Jours de congé acceptés pour une personne sur une période. */
export function joursAcceptes(
  demandes: LeaveRequest[],
  employeeId: string,
  from: ISODate,
  to: ISODate,
): number {
  return demandes
    .filter((d) => d.employeeId === employeeId && d.status === 'APPROVED')
    .reduce((somme, d) => somme + joursDe(d.from, d.to).filter((j) => j >= from && j <= to).length, 0);
}
