import { useEffect, useRef } from 'react';

/**
 * Le bouton retour du téléphone ferme ce qui est ouvert par-dessus l'écran.
 *
 * Dans un navigateur d'ordinateur, une fenêtre se ferme avec la croix ou la
 * touche Échap. Sur Android il n'y a ni l'un ni l'autre sous le pouce : il y a
 * le bouton retour. Sans ce crochet, ce bouton quitte l'écran en cours — et
 * dans la fenêtre de l'application Finjaro, il peut ramener à la place de
 * marché, voire refermer l'application, alors que la personne voulait
 * seulement fermer un formulaire.
 *
 * Fonctionnement : à l'ouverture on ajoute une étape dans l'historique, sans
 * changer l'adresse. Le retour consomme cette étape et nous prévient ; on
 * ferme. Si la personne ferme elle-même (croix, Échap, Annuler), on retire
 * l'étape pour ne pas laisser un retour qui ne fait rien.
 */
let counter = 0;

export function useBackToClose(open: boolean, onClose: () => void): void {
  // `onClose` change à chaque rendu chez les appelants : on le garde dans une
  // référence pour ne pas réinstaller l'écouteur, ce qui perdrait l'étape.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    // Marqueur reconnaissable : plusieurs couches peuvent s'empiler.
    counter += 1;
    const mark = { finiaOverlay: counter };
    let ours = true;
    try {
      window.history.pushState(mark, '');
    } catch {
      // Historique indisponible : on ne bloque rien, la croix reste là.
      return undefined;
    }

    const onPop = () => {
      // Si l'historique est encore sur notre étape, ce retour concernait une
      // couche ouverte après nous (un reçu après un formulaire) : pas pour nous.
      if ((window.history.state as { finiaOverlay?: number } | null)?.finiaOverlay === mark.finiaOverlay) return;
      // L'étape vient d'être consommée par le retour : plus rien à retirer.
      ours = false;
      close.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Fermeture par la croix ou Échap : notre étape est encore en haut de la
      // pile, on la retire pour qu'un retour ne soit pas avalé dans le vide.
      // Un instant plus tard, pour laisser une couche ouverte dans le même
      // rendu (le reçu qui suit un formulaire) poser sa propre étape : si elle
      // l'a fait, reculer maintenant la fermerait à sa place. On laisse alors
      // notre étape sous la sienne ; un retour de plus la consommera sans rien
      // faire.
      if (ours) {
        setTimeout(() => {
          if ((window.history.state as { finiaOverlay?: number } | null)?.finiaOverlay !== mark.finiaOverlay) return;
          try {
            window.history.back();
          } catch {
            /* rien à faire de plus */
          }
        }, 0);
      }
    };
  }, [open]);
}
