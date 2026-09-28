import type { DB } from './types';
import { today } from './store';

/**
 * Jours récents sans aucune écriture, pour prévenir « il manque mardi et
 * mercredi » dans l'application. Trouvé le 28/09 (Alpha, entonnoir mesuré) :
 * un rappel par notification atteint 0 personne sur 8 (personne n'a activé
 * les notifications) et aucun envoi d'e-mail n'existe dans l'environnement —
 * ceci rattrape au moins celles qui reviennent, sans dépendre d'un canal qui
 * n'existe pas encore.
 *
 * Ne signale rien pour une entreprise qui n'a encore jamais rien saisi
 * (onboarding, pas un oubli) : le compteur part du premier jour où une
 * écriture existe.
 */
export function missingRecentDays(db: DB, days = 4): string[] {
  if (!db.entries.length) return [];
  const dates = db.entries.map((e) => e.date).filter(Boolean).sort();
  const firstDate = dates[0];
  const withEntry = new Set(dates);
  const missing: string[] = [];
  const base = new Date(`${today()}T00:00:00Z`);
  for (let i = 1; i <= days; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (iso < firstDate) break;
    if (!withEntry.has(iso)) missing.push(iso);
  }
  return missing.sort();
}

const NOTIF_ASK_KEY = 'finia.notif.asked';

/**
 * Demande la permission de notification une seule fois dans la vie de
 * l'appareil, au bon moment (juste après un premier encaissement réussi,
 * quand la personne vient de voir que l'application lui sert) plutôt qu'à
 * l'ouverture. Sans effet si le navigateur ne supporte pas les
 * notifications, ou si la permission a déjà été demandée une fois (acceptée
 * ou non — on ne harcèle pas).
 */
export function maybeAskNotificationPermission() {
  try {
    if (typeof Notification === 'undefined') return;
    if (localStorage.getItem(NOTIF_ASK_KEY)) return;
    if (Notification.permission !== 'default') {
      localStorage.setItem(NOTIF_ASK_KEY, '1');
      return;
    }
    localStorage.setItem(NOTIF_ASK_KEY, '1');
    void Notification.requestPermission();
  } catch {
    // Contexte sans notifications (navigateur ancien, iframe) : on ignore.
  }
}
