/**
 * Saisie d'un montant (audit jour 12, 14/10) : « 25 000 » tapé avec un espace
 * de milliers devenait 25, parce que parseFloat s'arrête au premier espace.
 *
 *   npx vite-node scripts/saisie-montant-check.ts
 */
import { toMinor } from '../src/lib/money';

const cas: [string | number, string, number][] = [
  ['25 000', 'XAF', 25000],
  ['25 000', 'XAF', 25000],
  ['25 000', 'XAF', 25000],
  [' 1 250 000 ', 'XAF', 1250000],
  ['12,50', 'EUR', 1250],
  ['1 234,56', 'EUR', 123456],
  ['1500', 'XAF', 1500],
  [42, 'EUR', 4200],
  ['', 'XAF', 0],
  ['abc', 'XAF', 0],
];
let ko = 0;
for (const [v, cur, attendu] of cas) {
  const r = toMinor(v, cur);
  if (r !== attendu) ko++;
  console.log(r === attendu ? 'OK ' : 'KO ', JSON.stringify(v), cur, '→', r, r === attendu ? '' : `(attendu ${attendu})`);
}
process.exit(ko ? 1 : 0);
