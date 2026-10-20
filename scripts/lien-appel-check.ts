/**
 * Messages : seul un lien de salle Jitsi en https s'ouvre (relu le 20/10).
 * Un membre peut écrire lui-même un message « appel » : un lien piégé ne doit
 * jamais devenir un bouton.
 *
 *   npx vite-node scripts/lien-appel-check.ts
 */
import { lienAppelSur } from '../src/pages/Messages';

const cas: [unknown, boolean][] = [
  ['https://meet.jit.si/finjaro-3f9a2c', true],
  ['javascript:alert(document.cookie)', false],
  [' javascript:alert(1)', false],
  ['JaVaScRiPt:alert(1)', false],
  ['data:text/html,<script>alert(1)</script>', false],
  ['http://meet.jit.si/finjaro-x', false],
  ['https://meet.jit.si.attaquant.com/x', false],
  ['https://attaquant.com/meet.jit.si/x', false],
  [42, false],
  [undefined, false],
];
let ko = 0;
for (const [u, attendu] of cas) {
  const r = lienAppelSur(u) !== null;
  if (r !== attendu) ko++;
  console.log(r === attendu ? 'OK ' : 'KO ', attendu ? 'ouvert ' : 'bloqué ', '|', String(u));
}
process.exit(ko ? 1 : 0);
