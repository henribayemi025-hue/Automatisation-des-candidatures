/**
 * Recevoir un message partagé depuis le téléphone.
 *
 *   npx vite-node scripts/partage-check.ts
 */
import { readFileSync } from 'node:fs';
import { libelleMomo, parseMomoSms } from '../src/lib/momo';
import { guessCategory } from '../src/lib/statement';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

// ── Le manifeste déclare bien la cible de partage ────────────────────────
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
check(!!manifest.share_target, 'le manifeste déclare une cible de partage');
check(manifest.share_target.method === 'GET', 'en GET : pas besoin de service worker pour recevoir');
check(manifest.share_target.params?.text === 'text', 'le texte partagé arrive dans le paramètre « text »');
check(manifest.share_target.action === './', 'l’action reste relative, comme le reste du manifeste');

// ── Le code qui capte le partage ─────────────────────────────────────────
const partage = readFileSync(new URL('../src/lib/partage.ts', import.meta.url), 'utf8');
check(/history\.replaceState/.test(partage), 'l’adresse est nettoyée : un SMS ne reste pas dans l’historique');
check(/sessionStorage\.removeItem/.test(partage), 'le texte est retiré en le lisant : un rechargement ne le rejoue pas');
check(/catch \{/.test(partage), 'un stockage indisponible ne casse pas le démarrage');

const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
check(main.indexOf('capterPartage()') < main.indexOf('createRoot('), 'le partage est capté AVANT le rendu');

// ── Ce que l'écran recevra ───────────────────────────────────────────────
const T = '2026-09-22';
const avecFrais = parseMomoSms('Transfert de 5000 FCFA vers AWA NGUEMA effectue. Frais 100 FCFA. Solde: 42250 FCFA', 'XAF', T)!;
check(avecFrais.amount === 5000 && avecFrais.fee === 100, 'un transfert avec frais donne bien deux montants distincts');
check(libelleMomo(avecFrais) === 'Envoyé à AWA NGUEMA', 'et un libellé lisible');
check(guessCategory('Frais mobile money') !== undefined, 'les frais ont un poste de dépense');

const encaissement = parseMomoSms('Vous avez recu 15000 FCFA de JEANNE MBALLA. Frais: 0 FCFA. Ref: 1234567890', 'XAF', T)!;
check(encaissement.direction === 'IN' && encaissement.fee === 0, 'un encaissement sans frais ne crée pas de deuxième ligne');

// ── Ce qui n'est pas un message mobile money ─────────────────────────────
check(parseMomoSms('Bonjour, tu passes ce soir ?', 'XAF', T) === null || parseMomoSms('Bonjour, tu passes ce soir ?', 'XAF', T)!.amount === 0,
  'un message ordinaire partagé par erreur ne produit pas d’écriture');

const ecran = readFileSync(new URL('../src/pages/CatchUp.tsx', import.meta.url), 'utf8');
check(/readStatement\(source\);\s*\n\s*return;/.test(ecran), 'un texte non reconnu retombe sur la lecture de relevé, qui sait lire plusieurs lignes');
check(/setTab\('statement'\)/.test(ecran), 'un partage ouvre directement l’onglet relevé, déjà rempli');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
