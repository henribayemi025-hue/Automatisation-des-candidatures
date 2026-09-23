/**
 * Le relais de connexion : le chemin d'arrivée ne peut pas sortir du site.
 *
 *   npx vite-node scripts/relais-check.ts
 */
import { cheminSur } from '../src/pages/Relais';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

check(cheminSur('/dettes') === '/dettes', 'un chemin interne normal passe');
check(cheminSur('/rendez-vous') === '/rendez-vous', 'un autre chemin interne passe');
check(cheminSur(null) === '/', 'rien fourni → accueil');
check(cheminSur('') === '/', 'chaîne vide → accueil');
check(cheminSur('dettes') === '/', 'sans le / de tête → refusé, accueil');
check(cheminSur('//evil.com/phish') === '/', '// change d’hôte pour un navigateur → refusé');
check(cheminSur('https://evil.com') === '/', 'une adresse complète → refusée');

if (failures) {
  console.log(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log('\nTout est bon.');
