/**
 * Étanchéité de la démonstration : rien d'un exemple ne doit atteindre un
 * espace en ligne.
 *
 * Signalé par Beau le 22/09 : connecté avec Google, il a ouvert la
 * démonstration du métier « santé » et a retrouvé les chiffres d'exemple dans
 * SON espace. Le journal étant en écriture seule, c'était définitif.
 *
 *   npx vite-node scripts/demo-etanche-check.ts
 */
import { readFileSync } from 'node:fs';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

const collab = readFileSync(new URL('../src/lib/collab.tsx', import.meta.url), 'utf8');

// Le garde doit être dans le chemin d'envoi, pas ailleurs : c'est le seul
// endroit par lequel tout passe.
const abonnement = collab.slice(collab.indexOf('store.subscribe(async (ev)'), collab.indexOf('store.subscribe(async (ev)') + 1400);
check(/if \(isDemo\(\)\) return;/.test(abonnement), 'l’envoi d’un événement s’arrête si l’on est dans la démonstration');
check(abonnement.indexOf('if (isDemo()) return;') < abonnement.indexOf('pushEvent'), 'et il s’arrête AVANT l’envoi, pas après');

const file = collab.slice(collab.indexOf('const flushOutbox'), collab.indexOf('const flushOutbox') + 700);
check(/if \(isDemo\(\)\) return;/.test(file), 'la file d’attente ne se vide pas non plus depuis une démonstration');

check(/localStorage\.removeItem\(DEMO_FLAG_KEY\)/.test(collab), 'charger un espace éteint le drapeau de démonstration');
check(collab.includes("from './demo-state'"), 'le drapeau est lu depuis la source unique, pas recopié');

// Un garde posé uniquement à l'écran de démonstration ne protégerait rien :
// on peut ouvrir la démonstration en étant déjà connecté.
const demo = readFileSync(new URL('../src/pages/Demo.tsx', import.meta.url), 'utf8');
check(!/pushEvent|finia_events/.test(demo), 'l’écran de démonstration n’envoie rien lui-même : le garde est en aval');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
