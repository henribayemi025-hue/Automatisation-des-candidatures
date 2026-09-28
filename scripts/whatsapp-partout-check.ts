/**
 * Garde-fou structurel : aucun écran ne doit fabriquer un lien wa.me « à la
 * main » (en dehors de whatsappLink/whatsappNumber, dans src/lib/chat.ts et
 * src/lib/countries.ts). Idée d'Alpha (28/09, audit place de marché) — chez
 * elle, cinq liens sur six recomposaient le numéro dans leur coin et
 * oubliaient l'indicatif ; un simple test de rendu n'aurait attrapé qu'un
 * écran à la fois, celui-ci lit le code source et les attrape tous d'un
 * coup. Chez Accounting il n'y a qu'un seul endroit qui fabrique un lien
 * avec un numéro (whatsappLink), donc ce test doit rester vert tel quel —
 * s'il casse, c'est qu'un nouvel écran a contourné la fonction.
 *
 *   npx vite-node scripts/whatsapp-partout-check.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..', 'src');

// Fichiers autorisés à écrire « wa.me » eux-mêmes : la fonction qui sait
// composer l'indicatif, et son test unitaire.
const EXCEPTIONS = new Set([
  'src/lib/chat.ts', // whatsappLink() : le seul endroit qui doit écrire wa.me/${...}
  'src/lib/countries.ts', // commentaires expliquant le format attendu
]);

// Partage sans destinataire (wa.me/?text=...) : personne à joindre, donc pas
// de numéro à mal composer. Autorisé partout.
const SHARE_WITHOUT_NUMBER = /wa\.me\/\?text=/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

let failures = 0;
for (const file of walk(SRC)) {
  const rel = file.slice(join(__dirname, '..').length + 1).replace(/\\/g, '/');
  if (EXCEPTIONS.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (!text.includes('wa.me/')) continue;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('wa.me/') && !SHARE_WITHOUT_NUMBER.test(line)) {
      console.log(`ÉCHEC ${rel}:${i + 1} compose un lien wa.me hors de whatsappLink() → ${line.trim()}`);
      failures += 1;
    }
  });
}

console.log(failures === 0 ? 'Tout est bon : un seul endroit fabrique un lien wa.me avec numéro.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
