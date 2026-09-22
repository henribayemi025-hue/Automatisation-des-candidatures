/**
 * Rendu de monnaie : les billets proposés et le calcul.
 *
 *   npx vite-node scripts/monnaie-check.ts
 */
import { aRendre, billetsProposes } from '../src/lib/monnaie';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};
const egal = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// FCFA : pas de centimes, le minor vaut l'unité.
const fcfa = billetsProposes(3750, 'XAF');
check(egal(fcfa, [4000, 5000, 10000]), `3 750 FCFA → 4 000, 5 000, 10 000 (${fcfa.join(', ')})`);

const rond = billetsProposes(5000, 'XAF');
check(!rond.includes(5000) && rond[0] > 5000, `un total déjà rond ne se propose pas lui-même (${rond.join(', ')})`);

// Euro : deux décimales, 12,40 € = 1 240 centimes.
const eur = billetsProposes(1240, 'EUR');
check(egal(eur, [1500, 2000, 5000]), `12,40 € → 15, 20, 50 € (${eur.map((v) => v / 100).join(', ')})`);

const livre = billetsProposes(320, 'GBP');
check(egal(livre, [400, 500, 1000]), `3,20 £ → 4, 5, 10 £ (${livre.map((v) => v / 100).join(', ')})`);

check(billetsProposes(0, 'XAF').length === 0, 'rien à proposer pour un panier vide');
check(billetsProposes(987654, 'XAF').every((v) => v > 987654), 'toujours au-dessus du total, même pour un gros panier');

check(aRendre(3750, 5000) === 1250, '5 000 reçus pour 3 750 : rendre 1 250');
check(aRendre(3750, 3000) === -750, '3 000 reçus pour 3 750 : il manque 750');

if (failures) {
  console.log(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log('\nTout est bon.');
