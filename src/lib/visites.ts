import { supabase } from './supabase';
import { currentSource } from './source';

/**
 * Compteur de visites (Beau, 19/10 : « ajoute le compteur de visites de la démo »).
 * On veut savoir si les personnes qui voient les posts arrivent, ouvrent la démonstration, et vont jusqu'à « Créer mon compte ».
 *
 * Ce qui part : l'étape, le mot du lien (?src=) et un numéro de VISITE tiré au hasard à l'ouverture de l'onglet
 * (sessionStorage : il disparaît quand l'onglet se ferme, ce n'est pas une personne). Pas d'identifiant durable,
 * pas d'adresse, pas de cookie : le bandeau de consentement n'a donc rien à bloquer ici.
 * Une étape ne part qu'une fois par visite ; un robot ou un navigateur piloté par un programme n'est jamais compté.
 * Une mesure qui échoue ne doit rien casser : tout est silencieux.
 */

export type EtapeVisite = 'accueil' | 'demo_vue' | 'demo_ouverte' | 'demo_creer_compte';

const CLE_VISITE = 'finia.visite';
const CLE_ENVOYEES = 'finia.visite.etapes';
const ROBOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|monitor/i;

function numeroVisite(): string | null {
  try {
    let id = sessionStorage.getItem(CLE_VISITE);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(CLE_VISITE, id);
    }
    return id;
  } catch {
    return null; // stockage bloqué : on ne compte pas plutôt que de compter deux fois
  }
}

const enCours = new Set<string>();

function dejaEnvoyees(): Set<string> {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem(CLE_ENVOYEES) ?? '[]'));
  } catch {
    return new Set<string>();
  }
}

export function noterVisite(etape: EtapeVisite): void {
  try {
    if (typeof navigator === 'undefined' || navigator.webdriver === true || ROBOTS.test(navigator.userAgent)) return;
    const visite = numeroVisite();
    if (!visite) return;
    const deja = dejaEnvoyees();
    if (deja.has(etape) || enCours.has(etape)) return;
    enCours.add(etape);
    const { visit } = currentSource();
    // « Envoyée » n'est retenu qu'une fois la réponse reçue : si la page se recharge ou se ferme pendant l'envoi,
    // la mesure est retentée à la page suivante au lieu d'être perdue (constaté à l'essai du 19/10).
    void supabase.rpc('finia_noter_visite', { p_etape: etape, p_visite: visite, p_src: visit || null }).then(
      ({ error }) => {
        enCours.delete(etape);
        if (error) return;
        try {
          const maj = dejaEnvoyees();
          maj.add(etape);
          sessionStorage.setItem(CLE_ENVOYEES, JSON.stringify([...maj]));
        } catch {
          /* stockage bloqué : au pire une mesure en double, absorbée par la clé unique côté base */
        }
      },
      () => enCours.delete(etape),
    );
  } catch {
    /* une mesure ne doit jamais gêner la personne */
  }
}
