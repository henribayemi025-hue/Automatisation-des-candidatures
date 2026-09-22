import { useEffect, useRef, useState } from 'react';

/**
 * Un champ de réglage qui n'enregistre qu'une fois la frappe finie.
 *
 * Trouvé le 17/09 dans l'activité réelle d'une vendeuse de Douala : elle a
 * tapé son numéro de téléphone dans les réglages, et l'application a inscrit
 * NEUF événements dans le journal — un par chiffre : « 6 », « 69 », « 696 »…
 * jusqu'à « 696602630 ».
 *
 * Ce n'est pas un détail d'affichage. Chaque frappe créait un événement
 * définitif : impossible à effacer (le journal est en ajout seul), envoyé au
 * cloud, rejoué à chaque ouverture, et recopiant tout l'état au passage. Taper
 * un nom de boutique sur un réseau lent revenait à envoyer une vingtaine
 * d'écritures pour un seul renseignement.
 *
 * Ici, la frappe reste locale. On n'enregistre qu'à deux moments : quand la
 * personne quitte le champ, et après une seconde sans frappe — pour que rien
 * ne se perde si elle ferme l'application sans quitter le champ.
 *
 * Les listes déroulantes et les cases à cocher n'ont pas ce problème : un
 * choix y est un geste unique, elles enregistrent tout de suite.
 */
export default function TextSetting({
  id,
  value,
  onCommit,
  disabled,
  placeholder,
  inputMode,
  className = 'field',
}: {
  id?: string;
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'decimal';
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  // `onCommit` change à chaque rendu chez les appelants : on le garde dans une
  // référence pour que le minuteur n'enregistre pas une version périmée.
  const commit = useRef(onCommit);
  commit.current = onCommit;

  // La valeur peut changer ailleurs (un autre appareil, une restauration).
  // On ne bouscule pas quelqu'un en train d'écrire : on ne reprend la valeur
  // du dehors que si elle diffère de ce qu'on a déjà enregistré.
  const known = useRef(value);
  useEffect(() => {
    if (value !== known.current) {
      known.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function save(brut: string) {
    window.clearTimeout(timer.current);
    // On détoure avant d'enregistrer, jamais pendant la frappe : quelqu'un qui
    // tape « rue des » et marque une pause ne doit pas voir son espace
    // disparaître sous ses doigts.
    //
    // Signalé par Alpha le 22/09 : chez elle, une adresse faite de trois
    // espaces passait la validation et partait au serveur, et la vendeuse
    // recevait une commande sans adresse de livraison. J'avais le même défaut
    // ici, sur des champs qui s'impriment : le nom de l'entreprise, son
    // adresse, son numéro d'immatriculation, son numéro de TVA. Un espace de
    // trop sur une facture, c'est laid ; un nom fait de trois espaces, c'est
    // une facture anonyme.
    //
    // Et comme le journal est en écriture seule, cet espace serait définitif.
    const next = brut.trim();
    if (next === known.current) return;
    known.current = next;
    setDraft(next);
    commit.current(next);
  }

  return (
    <input
      id={id}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      inputMode={inputMode}
      className={className}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => save(next), 1000);
      }}
      onBlur={() => save(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save(draft);
      }}
    />
  );
}
