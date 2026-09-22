/**
 * Un champ de réglage n'enregistre jamais d'espaces inutiles.
 *
 * Signalé par Alpha le 22/09 : chez elle, une adresse faite de trois espaces
 * passait la validation et partait au serveur — la vendeuse recevait une
 * commande sans adresse de livraison. Le même défaut existait ici, sur des
 * champs qui s'IMPRIMENT : nom de l'entreprise, adresse, numéro
 * d'immatriculation, numéro de TVA.
 *
 * Le journal étant en écriture seule, un espace de trop y serait définitif.
 *
 *   npx vite-node scripts/saisie-check.ts
 */
import { readFileSync } from 'node:fs';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

// On reproduit la logique de `save` telle qu'elle est écrite, puis on vérifie
// que le fichier la contient bien — un contrôle qui ne lit pas le vrai code
// finirait par vérifier une copie périmée.
const source = readFileSync(new URL('../src/components/TextSetting.tsx', import.meta.url), 'utf8');
check(/const next = brut\.trim\(\);/.test(source), 'TextSetting détoure la valeur avant de l’enregistrer');
check(/function save\(brut: string\)/.test(source), 'et le détourage est dans `save`, donc au repos et non pendant la frappe');
check(!/onChange=\{\(e\) => \{[\s\S]{0,200}?\.trim\(\)/.test(source), 'rien n’est détouré pendant la frappe');

// Le comportement attendu, cas par cas.
const enregistre = (connu: string, saisi: string): string | null => {
  const next = saisi.trim();
  return next === connu ? null : next;
};

check(enregistre('', '   ') === null, 'trois espaces sur un champ vide : rien n’est enregistré');
check(enregistre('', '  Chez Awa  ') === 'Chez Awa', 'les espaces autour du nom sont retirés');
check(enregistre('Chez Awa', 'Chez Awa ') === null, 'une espace en trop ne crée pas un événement de plus');
check(enregistre('', 'Rue des Manguiers, Akwa') === 'Rue des Manguiers, Akwa', 'les espaces à l’intérieur sont gardés');
check(enregistre('', '  12 rue des Lilas  ') === '12 rue des Lilas', 'une adresse se détoure aussi');
check(enregistre('Chez Awa', '   ') === '', 'effacer un champ reste possible');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
