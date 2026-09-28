/**
 * Vérifie que les liens WhatsApp fabriqués par l'application sont au format
 * international attendu par wa.me — trouvé le 28/09 : Alpha a découvert le
 * même défaut côté place de marché (wa.me/691024291 au lieu de
 * wa.me/237691024291), les numéros y étant saisis localement, sans
 * indicatif. On vérifie ici qu'Accounting ne l'a pas aussi.
 *
 *   npx vite-node scripts/whatsapp-check.ts
 */
import { whatsappNumber } from '../src/lib/countries';

let failures = 0;
const check = (actual: string, expected: string, label: string) => {
  const ok = actual === expected;
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label} → ${actual}`);
  if (!ok) failures += 1;
};

// Numéro local camerounais, sans indicatif : c'est le cas courant.
check(whatsappNumber('6 91 02 42 91', 'Cameroun'), '237691024291', 'Cameroun, numéro local avec espaces');
check(whatsappNumber('691024291', 'Cameroun'), '237691024291', 'Cameroun, numéro local sans espaces');

// France : le 0 initial doit sauter, pas s'ajouter à l'indicatif.
check(whatsappNumber('06 12 34 56 78', 'France'), '33612345678', 'France, 0 initial retiré');

// Déjà international (+) : on ne touche pas à l'indicatif déjà présent.
check(whatsappNumber('+237 6 91 02 42 91', 'Cameroun'), '237691024291', 'Déjà en +237, inchangé');
check(whatsappNumber('+33 6 12 34 56 78', 'France'), '33612345678', 'Déjà en +33, inchangé');

// Format 00 (international sans le +) : équivalent au +.
check(whatsappNumber('00237691024291', 'Cameroun'), '237691024291', 'Format 00, équivalent au +');

// Pays inconnu ou absent : on ne peut pas deviner, on renvoie les chiffres tels quels.
check(whatsappNumber('691024291', 'Atlantide'), '691024291', 'Pays inconnu : pas d’indicatif inventé');
check(whatsappNumber('691024291'), '691024291', 'Pays absent : pas d’indicatif inventé');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
