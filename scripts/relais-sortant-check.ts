/**
 * Le sens Accounting → finjaro.net : l'adresse du relais sortant.
 *
 *   npx vite-node scripts/relais-sortant-check.ts
 */
import { adresseRelais } from '../src/lib/apps';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

const url = adresseRelais('https://finjaro.net/relais', 'abc123', '/vendor');
check(url === 'https://finjaro.net/relais?code=abc123&vers=%2Fvendor', `adresse construite (${url})`);

// Un code ou un chemin avec des caractères spéciaux doit rester une seule
// paire clé=valeur, jamais une deuxième donnée qui s'invite dans l'adresse.
const pollue = adresseRelais('https://finjaro.net/relais', 'a&b=c', '/x?y=z');
check(pollue === 'https://finjaro.net/relais?code=a%26b%3Dc&vers=%2Fx%3Fy%3Dz', `caractères spéciaux échappés (${pollue})`);

if (failures) {
  console.log(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log('\nTout est bon.');
