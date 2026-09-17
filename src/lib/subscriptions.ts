/**
 * Abonnements : dates, compte à rebours, alertes.
 *
 * Demande d'un commerçant (Abraham D., 15/09) : « nom du client, contact,
 * montant, durée avec un compte à rebours, des alertes à la fin ou à
 * l'approche de la fin, la facture sur place, envoyée par WhatsApp ». Tout ce
 * qui est calculé sur un abonnement passe par ici, pour que l'écran, l'accueil
 * et l'assistant disent la même chose.
 */
import type { DB, Subscription } from './types';

/** Sous ce nombre de jours restants, l'abonnement est « bientôt fini ». */
export const SOON_DAYS = 7;

export type SubscriptionState = 'ACTIVE' | 'SOON' | 'EXPIRED' | 'CANCELLED';

export function addPeriod(from: string, every: number, unit: 'DAY' | 'MONTH'): string {
  const d = new Date(`${from}T12:00:00.000Z`);
  if (unit === 'DAY') d.setUTCDate(d.getUTCDate() + every);
  else {
    // Un mois d'abonnement pris le 31 janvier finit le 28 février, pas le 3 mars.
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + every);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  // La période s'arrête la veille du jour anniversaire : du 1er au 31, pas au 1er suivant.
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Jours restants (négatif si dépassé), le jour de fin compris. */
export function daysLeft(sub: Pick<Subscription, 'endDate'>, todayISO: string): number {
  const end = new Date(`${sub.endDate}T12:00:00.000Z`).getTime();
  const today = new Date(`${todayISO}T12:00:00.000Z`).getTime();
  return Math.round((end - today) / 86_400_000);
}

export function stateOf(sub: Subscription, todayISO: string): SubscriptionState {
  if (sub.status === 'CANCELLED') return 'CANCELLED';
  const left = daysLeft(sub, todayISO);
  if (left < 0) return 'EXPIRED';
  if (left < SOON_DAYS) return 'SOON';
  return 'ACTIVE';
}

export interface SubscriptionSummary {
  active: number;
  soon: number;
  expired: number;
  /** Ce que rapporteraient tous les abonnements en cours s'ils étaient renouvelés une fois. */
  monthlyValue: number;
  soonList: Subscription[];
  expiredList: Subscription[];
}

export function summarize(db: DB, todayISO: string): SubscriptionSummary {
  const live = db.subscriptions.filter((s) => s.status !== 'CANCELLED');
  const soonList = live.filter((s) => stateOf(s, todayISO) === 'SOON').sort((a, b) => a.endDate.localeCompare(b.endDate));
  const expiredList = live.filter((s) => stateOf(s, todayISO) === 'EXPIRED').sort((a, b) => b.endDate.localeCompare(a.endDate));
  const active = live.filter((s) => stateOf(s, todayISO) === 'ACTIVE').length;
  const monthlyValue = live
    .filter((s) => stateOf(s, todayISO) !== 'EXPIRED')
    .reduce((sum, s) => sum + (s.unit === 'MONTH' ? Math.round(s.amount / Math.max(1, s.every)) : Math.round((s.amount * 30) / Math.max(1, s.every))), 0);
  return { active, soon: soonList.length, expired: expiredList.length, monthlyValue, soonList, expiredList };
}

/** Libellé de la durée : « 1 mois », « 3 mois », « 30 jours ». */
export function durationLabel(every: number, unit: 'DAY' | 'MONTH', t: (s: string, v?: Record<string, string | number>) => string): string {
  if (unit === 'MONTH') return every === 1 ? t('1 mois') : t('{n} mois', { n: every });
  return every === 1 ? t('1 jour') : t('{n} jours', { n: every });
}
