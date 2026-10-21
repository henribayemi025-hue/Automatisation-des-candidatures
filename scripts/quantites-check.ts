/**
 * Saisie et affichage des quantités (audits jours 13 et 14, 20-21/10) :
 * « 2,5 », « 1 000 » se lisent ; un champ vide n'est pas 0 ; l'affichage suit
 * la langue.
 *
 *   npx vite-node scripts/quantites-check.ts
 */
import { formatQty, parseQty } from '../src/lib/parse';

let ko = 0;
const ok = (n: string, c: boolean) => { if (!c) ko++; console.log(c ? 'OK ' : 'KO ', n); };
ok('« 2,5 » → 2,5', parseQty('2,5') === 2.5);
ok('« 2.5 » → 2,5', parseQty('2.5') === 2.5);
ok('« 1 000 » (espaces, insécables) → 1000', parseQty('1 000') === 1000 && parseQty('1 000') === 1000);
ok('« -3 » → -3 (correction de stock)', parseQty('-3') === -3);
ok('champ vide → NaN, jamais 0', Number.isNaN(parseQty('')) && Number.isNaN(parseQty('   ')));
ok('« abc » → NaN', Number.isNaN(parseQty('abc')));
ok('affichage français : 1,5', formatQty(1.5, 'fr') === '1,5');
ok('affichage anglais : 1.5', formatQty(1.5, 'en') === '1.5');
ok('pas de 0,30000000000000004', formatQty(0.1 + 0.2, 'fr') === '0,3');
ok('entier : 3', formatQty(3) === '3');
process.exit(ko ? 1 : 0);
