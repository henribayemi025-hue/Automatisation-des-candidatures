/**
 * L'assistante reconnaît les demandes de réglage (B7, 20/10) :
 * « mets le mode light » ne doit plus recevoir « il n'existe que Simple et Expert ».
 *
 *   npx vite-node scripts/reglages-assistante-check.ts
 */
import { settingsIntent } from '../src/lib/settings-intent';

const cas: [string, string | null][] = [
  ['mets le mode light', 'theme:light'],
  ['Mets le mode sombre stp', 'theme:dark'],
  ['dark mode', 'theme:dark'],
  ['je veux un fond noir', 'theme:dark'],
  ['passe l’affichage en clair', 'theme:light'],
  ['thème automatique comme mon téléphone', 'theme:system'],
  ['mets l’application en anglais', 'lang:en'],
  ['switch to English', 'lang:en'],
  ['change la langue en français', 'lang:fr'],
  ['passe en mode expert', 'mode:EXPERT'],
  ['mode simple', 'mode:SIMPLE'],
  ['change la devise en euros', 'currency:EUR'],
  ['passe la monnaie en FCFA', 'currency:XAF'],
  ['changer de devise', 'currency:null'],
  ['quels réglages tu peux changer ?', 'list'],
  // Ce qui ne doit PAS être pris pour un réglage :
  ['réponds en anglais', null],
  ['Quel est le mode de paiement le plus utilisé ?', null],
  ['Combien j’ai vendu la nuit dernière ?', null],
  ['Explique-moi cet écran', null],
  ['en clair, qui me doit de l’argent ?', null],
  ['Quel produit se vend le mieux ?', null],
];
let ko = 0;
for (const [q, attendu] of cas) {
  const r = settingsIntent(q);
  const got = !r ? null : r.kind === 'list' ? 'list' : r.kind === 'currency' ? `currency:${r.code}` : `${r.kind}:${r.value}`;
  const ok = got === attendu;
  if (!ok) ko++;
  console.log(ok ? 'OK ' : 'KO ', String(attendu).padEnd(14), '|', q, ok ? '' : `→ ${got}`);
}
process.exit(ko ? 1 : 0);
