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
export function useBackToClose(open: boolean, onClose: () => void): void {
  // `onClose` change à chaque rendu chez les appelants : on le garde dans une
  // référence pour ne pas réinstaller l'écouteur, ce qui perdrait l'étape.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    // Marqueur reconnaissable : plusieurs couches peuvent s'empiler.
    const mark = { finiaOverlay: Date.now() };
    let ours = true;
    try {
      window.history.pushState(mark, '');
    } catch {
      // Historique indisponible : on ne bloque rien, la croix reste là.
      return undefined;
    }

    const onPop = () => {
      // L'étape vient d'être consommée par le retour : plus rien à retirer.
      ours = false;
      close.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Fermeture par la croix ou Échap : notre étape est encore en haut de la
      // pile, on la retire pour qu'un retour ne soit pas avalé dans le vide.
      if (ours) {
        try {
          window.history.back();
        } catch {
          /* rien à faire de plus */
        }
      }
    };
  }, [open]);
}
