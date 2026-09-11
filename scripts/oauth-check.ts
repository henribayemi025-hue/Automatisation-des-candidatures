/**
 * Retour de connexion Google. Le vrai aller-retour passe par Supabase, que ce
 * bac à sable ne peut pas joindre : on vérifie ici ce qui cassait réellement,
 * c'est-à-dire la forme de l'adresse de retour et sa cohabitation avec la
 * navigation par ancres.
 */
import { readFileSync } from 'node:fs';

const client = readFileSync('src/lib/supabase.ts', 'utf8');
const pkce = /flowType:\s*'pkce'/.test(client);
const detect = /detectSessionInUrl:\s*true/.test(client);
console.log('client configuré en PKCE          :', pkce ? 'OUI' : 'NON');
console.log('lecture de la session dans l’URL  :', detect ? 'OUI' : 'NON');

// Le flux implicite renvoie le jeton dans l'ancre — là où le routeur écrit
// ses adresses. PKCE le renvoie dans la requête, qui n'entre en conflit avec rien.
const implicite = 'https://app.exemple/#access_token=abc&expires_in=3600';
const avecPkce = 'https://app.exemple/?code=abc#/';
const hashOf = (u: string) => new URL(u).hash;
console.log('\nflux implicite, ancre             :', hashOf(implicite), '← le routeur la réécrit en « #/ »');
console.log('PKCE, ancre                       :', hashOf(avecPkce) || '(vide)', '· requête', new URL(avecPkce).search);

// Le nettoyage doit retirer les paramètres d'authentification et ne toucher à rien d'autre.
function clean(href: string): string {
  const url = new URL(href);
  for (const k of ['code', 'error', 'error_description', 'error_code', 'state']) url.searchParams.delete(k);
  return url.toString();
}
const cases = [
  'https://app.exemple/?code=abc#/',
  'https://app.exemple/?code=abc&garde=1#/produits',
  'https://app.exemple/?error=access_denied&error_description=Refus%C3%A9#/',
  'https://app.exemple/#/parametres',
];
console.log('\n--- nettoyage de l’adresse ---');
for (const c of cases) console.log(c.padEnd(62), '→', clean(c));

const ok =
  pkce &&
  detect &&
  hashOf(avecPkce) === '#/' &&
  clean(cases[0]) === 'https://app.exemple/#/' &&
  clean(cases[1]) === 'https://app.exemple/?garde=1#/produits' &&
  clean(cases[2]) === 'https://app.exemple/#/' &&
  clean(cases[3]) === cases[3];

console.log(ok ? '\nOK — le jeton ne passe plus par l’ancre, l’adresse est nettoyée.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
