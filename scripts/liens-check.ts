/**
 * Les adresses données par l'assistante doivent être cliquables — et rien
 * d'autre ne doit le devenir.
 *
 * Signalé par Alpha le 21/09 : chez elle, l'assistante donnait la bonne
 * adresse et elle restait du texte mort. Le même défaut existait ici.
 *
 *   npx vite-node scripts/liens-check.ts
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Linkify } from '../src/components/Linkify';
import { answer, emptyDB } from './_liens-helpers';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

const rendu = (texte: string) => renderToStaticMarkup(createElement(Linkify, { text: texte }));

// ── Ce qui doit devenir un lien ──────────────────────────────────────────
check(rendu('Allez sur https://finjaro.net').includes('href="https://finjaro.net"'), 'une adresse en fin de phrase devient un lien');
check(
  rendu('Voir https://finjaro.net. Merci.').includes('href="https://finjaro.net"'),
  'le point final reste dans la phrase, pas dans l’adresse',
);
check(!rendu('Voir https://finjaro.net. Merci.').includes('href="https://finjaro.net."'), 'et n’est pas avalé par l’adresse');
check(rendu('a https://a.fr b https://b.fr').match(/<a /g)?.length === 2, 'deux adresses dans la même phrase');
check(rendu('http://exemple.fr').includes('href="http://exemple.fr"'), 'http simple accepté');
check(rendu('Allez sur https://finjaro.net').includes('rel="noopener noreferrer"'), 'les liens s’ouvrent sans donner la main à la page visée');

// ── Ce qui NE doit PAS devenir un lien ───────────────────────────────────
for (const poison of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'JAVASCRIPT:alert(1)']) {
  check(!rendu(`Cliquez ${poison}`).includes('href'), `« ${poison.slice(0, 22)}… » reste du texte`);
}
check(!rendu('<script>alert(1)</script>').includes('<script>'), 'aucun HTML du texte n’est exécuté');
check(rendu('finjaro.net sans protocole').includes('finjaro.net') && !rendu('finjaro.net sans protocole').includes('href'), 'une adresse sans protocole reste du texte');

// ── L'assistante connaît la place de marché ──────────────────────────────
const db = emptyDB();
for (const q of ['place de marché', 'je veux vendre en ligne', 'comment ouvrir une boutique en ligne', 'tu connais finjaro market place ?']) {
  const a = answer(db, q);
  check(a.text.includes('https://finjaro.net'), `« ${q} » → l’adresse de la place de marché`);
}
const presentation = answer(db, 'qui es-tu ?').text;
check(presentation.includes('https://finjaro.net'), 'sa présentation cite la place de marché');
check(!/diaspora/i.test(presentation), 'sa présentation ne parle pas de « diaspora »');
check(!/(en |d')Afrique|africain/i.test(presentation), 'et n’enferme pas Finjaro dans une région');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
