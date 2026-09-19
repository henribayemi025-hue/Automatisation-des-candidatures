/**
 * Rendez-vous : ce qu'on répond à « qui vient aujourd'hui ? ».
 *
 * Tout ce qui se calcule sur un rendez-vous passe par ici, pour que l'écran,
 * l'accueil et l'assistant disent la même chose.
 *
 * Un rendez-vous n'est pas une écriture comptable et ne le deviendra jamais :
 * il devient une vente le jour où la personne paie, par la caisse. Ce fichier
 * ne connaît donc ni compte, ni journal.
 */
import type { Appointment, DB } from './types';

/** « 14:30 » → 870. Sert à ranger une journée dans l'ordre des heures. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map((x) => Number(x) || 0);
  return h * 60 + m;
}

/** « 14:30 » + 45 min → « 15:15 ». Au-delà de minuit, on s'arrête à 23:59. */
export function endTime(time: string, minutes: number): string {
  const fin = Math.min(minutesOfDay(time) + Math.max(0, minutes), 23 * 60 + 59);
  return `${String(Math.floor(fin / 60)).padStart(2, '0')}:${String(fin % 60).padStart(2, '0')}`;
}

/** Les rendez-vous d'un jour, dans l'ordre des heures, annulés exclus. */
export function dayOf(db: DB, date: string): Appointment[] {
  return db.appointments
    .filter((a) => a.date === date && a.status !== 'CANCELLED')
    .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
}

/**
 * Les rendez-vous qui se chevauchent, pour le dire AVANT d'enregistrer.
 *
 * Une coiffeuse seule ne peut pas coiffer deux têtes à la fois, et c'est
 * exactement l'erreur que le carnet papier laisse passer. On ne refuse rien —
 * un salon à deux fauteuils a raison de doubler — on prévient.
 */
export function overlapping(db: DB, rdv: Pick<Appointment, 'id' | 'date' | 'time' | 'minutes'>): Appointment[] {
  const debut = minutesOfDay(rdv.time);
  const fin = debut + Math.max(0, rdv.minutes);
  return dayOf(db, rdv.date).filter((a) => {
    if (a.id === rdv.id || a.status === 'NOSHOW') return false;
    const d = minutesOfDay(a.time);
    return d < fin && debut < d + Math.max(0, a.minutes);
  });
}

export interface AppointmentSummary {
  /** Ce qui reste à faire aujourd'hui, heure passée exclue. */
  aVenir: Appointment[];
  /** Ceux d'aujourd'hui, tous états confondus sauf annulés. */
  jour: Appointment[];
  /** Ceux de demain : ce qu'on regarde le soir en fermant. */
  demain: Appointment[];
  /** Ce que la journée devrait rapporter, d'après les montants connus. */
  attendu: number;
  /** Rendez-vous passés jamais soldés : ni honorés, ni annulés. */
  enRetard: Appointment[];
}

/** `now` est l'heure « HH:MM » ; on la passe pour que les contrôles soient stables. */
export function summarize(db: DB, today: string, now = '00:00'): AppointmentSummary {
  const jour = dayOf(db, today);
  const maintenant = minutesOfDay(now);
  const demain = new Date(`${today}T12:00:00.000Z`);
  demain.setUTCDate(demain.getUTCDate() + 1);
  return {
    jour,
    aVenir: jour.filter((a) => a.status === 'BOOKED' && minutesOfDay(a.time) >= maintenant),
    demain: dayOf(db, demain.toISOString().slice(0, 10)),
    attendu: jour.filter((a) => a.status !== 'NOSHOW').reduce((n, a) => n + a.amount, 0),
    enRetard: db.appointments.filter((a) => a.status === 'BOOKED' && a.date < today),
  };
}
