/**
 * Mention « pas un conseil fiscal » (12/10) : elle apparaît quand la question
 * ou la réponse touche à l'impôt, à la taxe ou à la comptabilité, pas sous un
 * simple chiffre de caisse.
 *
 *   npx vite-node scripts/mention-fiscale-check.ts
 */
import { speaksFiscal } from '../src/lib/fiscal-mention';
const cas: [string, boolean][] = [
  ['Combien de TVA je dois reverser ce mois ?', true],
  ["Votre chiffre d'affaires du mois est de 450 000 FCFA.", false],
  ['Est-ce que je dois payer l’impôt libératoire ?', true],
  ['Quel est mon régime fiscal ?', true],
  ['Qui me doit de l’argent ?', false],
  ['Comment amortir mon congélateur ?', true],
  ['Do I need to file VAT?', true],
  ['Montrez-moi le bilan', true],
  ['Quel produit se vend le mieux ?', false],
  ['Taxi : 2 000 FCFA de dépense', false],
];
let ko = 0;
for (const [q, attendu] of cas) { const r = speaksFiscal(q); if (r !== attendu) ko++; console.log(r === attendu ? 'OK ' : 'KO ', attendu ? 'mention' : 'rien   ', '|', q); }
process.exit(ko ? 1 : 0);
