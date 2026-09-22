/**
 * Recevoir un texte partagé depuis le téléphone.
 *
 * Beau voulait que l'application lise les SMS mobile money toute seule. Alpha
 * a vérifié : sur Android c'est une permission sous contrôle de Google Play
 * dont notre usage ne fait pas partie — le risque est le retrait du magasin —
 * et sur iPhone aucune interface n'existe. La voie qui marche partout et sans
 * aucune autorisation : la personne appuie longuement sur le message, choisit
 * « Partager », puis Finjaro.
 *
 * Le manifeste déclare une cible de partage en GET : le système ouvre
 * l'application avec le texte dans l'adresse. Comme le routeur est à dièse,
 * ces paramètres n'arrivent dans aucune route — il faut les récupérer AVANT
 * que l'application démarre, les mettre de côté, et nettoyer l'adresse.
 *
 * On nettoie pour deux raisons : un texte de SMS dans la barre d'adresse se
 * retrouve dans l'historique du navigateur, et un rechargement rejouerait le
 * partage à l'infini.
 */

const CLE = 'finia.partage';

/**
 * À appeler UNE FOIS au démarrage, avant le rendu.
 * Renvoie vrai si un partage a été reçu.
 */
export function capterPartage(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const morceaux = [params.get('title'), params.get('text'), params.get('url')].filter(Boolean);
    if (!morceaux.length) return false;
    sessionStorage.setItem(CLE, morceaux.join('\n'));
    // On retire les paramètres sans recharger la page.
    const propre = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', propre || '/');
    return true;
  } catch {
    return false;
  }
}

/** Le texte partagé, une seule fois : on le retire en le lisant. */
export function lirePartage(): string {
  try {
    const texte = sessionStorage.getItem(CLE) ?? '';
    if (texte) sessionStorage.removeItem(CLE);
    return texte;
  } catch {
    return '';
  }
}
