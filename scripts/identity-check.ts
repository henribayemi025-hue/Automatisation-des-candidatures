/** Connexion par numéro : ce qui est accepté, ce qui est refusé, et le retour. */
import { displayIdentity, isPhoneAddress, looksLikePhone, toLogin } from '../src/lib/identity';

const cases: [string, string][] = [
  ['awa@exemple.com', 'email'],
  ['AWA@Exemple.COM', 'email en majuscules'],
  ['+237 6 99 12 34 56', 'numéro camerounais'],
  ['+33 6 12 34 56 78', 'numéro français'],
  ['237699123456', 'numéro sans le +'],
  ['0699123456', 'numéro local sans indicatif'],
  ['12345', 'trop court'],
  ['+1234567890123456789', 'trop long'],
  ['', 'vide'],
  ['pas une adresse', 'texte'],
];

let ok = true;
for (const [input, label] of cases) {
  const r = toLogin(input);
  const out = r.address ? r.address : `refusé — ${r.error}`;
  console.log(`${label.padEnd(28)} ${JSON.stringify(input).padEnd(24)} → ${out}`);
}

// Deux écritures du même numéro doivent donner le même compte.
const a = toLogin('+237 6 99 12 34 56').address;
const b = toLogin('237699123456').address;
const c = toLogin('+237-699-123-456').address;
console.log('\nmême numéro écrit de 3 façons :', a, b, c, a === b && b === c ? 'MÊME COMPTE' : 'COMPTES DIFFÉRENTS');

// Et deux pays différents ne doivent pas se retrouver sur le même compte.
const cm = toLogin('+237699123456').address;
const fr = toLogin('+33699123456').address;
console.log('pays différents, numéro proche :', cm !== fr ? 'comptes séparés' : 'COLLISION');

// Aller-retour d'affichage : l'adresse interne ne doit jamais s'afficher.
const shown = displayIdentity(a!);
console.log('affiché à la personne          :', shown);
console.log('retour vers le même compte     :', toLogin(shown).address === a ? 'OK' : 'ÉCHEC');
console.log('un email reste un email        :', displayIdentity('awa@exemple.com'));

ok =
  a === b && b === c &&
  cm !== fr &&
  toLogin(shown).address === a &&
  isPhoneAddress(a!) &&
  !isPhoneAddress('awa@exemple.com') &&
  looksLikePhone('+237 6 99 12 34 56') &&
  !looksLikePhone('awa@exemple.com') &&
  toLogin('0699123456').address === null &&
  toLogin('12345').address === null;

console.log(ok ? '\nOK — numéros normalisés, pas de collision, affichage lisible.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
