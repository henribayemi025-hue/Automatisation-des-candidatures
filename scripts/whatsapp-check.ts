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
const check = (actual: string | null, expected: string | null, label: string) => {
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

// Indicatif déjà tapé, sans « + » (recopié tel que WhatsApp l'affiche) :
// il ne doit pas être doublé. Trouvé par Alpha le 07/10.
check(whatsappNumber('237 691 02 42 91', 'Cameroun'), '237691024291', 'Indicatif sans +, pas doublé');
check(whatsappNumber('33 6 12 34 56 78', 'France'), '33612345678', 'France, indicatif sans +, pas doublé');

// Pays inconnu ou absent : on ne devine pas. Pas de lien du tout (null)
// plutôt qu'un lien mort qui fait croire que le message est parti.
check(whatsappNumber('691024291', 'Atlantide'), null, 'Pays inconnu, numéro local : pas de lien');
check(whatsappNumber('691024291'), null, 'Pays absent, numéro local : pas de lien');
check(whatsappNumber('237691024291'), '237691024291', 'Pays absent, indicatif connu : gardé');
check(whatsappNumber('+237 691 02 42 91'), '237691024291', 'Pays absent, +237 : gardé');

// Numéros impossibles : pas de lien.
check(whatsappNumber('', 'Cameroun'), null, 'Vide : pas de lien');
check(whatsappNumber('12', 'Cameroun'), null, 'Trop court : pas de lien');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
