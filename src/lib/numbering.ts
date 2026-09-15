/**
 * Numéros de tickets, devis et commandes.
 *
 * Ligne 1 du tableau docs/SIMULATION-DECISIONS.md : deux caisses sans réseau
 * numérotaient toutes deux « FA-00001 » d'après le nombre de ventes qu'elles
 * voyaient ; à la synchronisation, le moteur ajoutait « -B » à la seconde, et
 * le reçu du client ne portait plus le numéro gardé dans les comptes.
 *
 * Désormais chaque appareil a une marque (trois caractères, tirée une fois et
 * gardée dans le navigateur) et son propre compteur par espace de travail :
 * « FA-K7X-00001 ». Deux appareils ne peuvent plus produire le même numéro,
 * et un numéro imprimé n'est jamais réattribué ni modifié après coup.
 *
 * Si le stockage du navigateur a été vidé, le compteur repart de ce que le
 * journal connaît déjà pour cette marque : jamais en dessous.
 */

const DEVICE_KEY = 'finia.device';
const COUNTER_PREFIX = 'finia.counter.';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I, lisible sur un ticket

// Sans stockage (navigation privée bloquée, quota), la mémoire de la page
// prend le relais : les numéros restent uniques le temps de la session.
const memory = new Map<string, string>();

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return memory.get(key) ?? '';
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

/** La marque de cet appareil, créée à la première demande. */
export function deviceTag(): string {
  const saved = read(DEVICE_KEY);
  if (saved) return saved;
  const bytes = new Uint8Array(3);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 3; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  const tag = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  write(DEVICE_KEY, tag);
  return tag;
}

/**
 * Prochain numéro pour un préfixe (FA, DV, BC) dans un espace donné.
 * `known` : les numéros déjà présents dans l'état, pour ne jamais repasser
 * sous un numéro déjà émis par cet appareil.
 */
export function nextNumber(scope: string, prefix: string, known: string[]): string {
  const tag = deviceTag();
  const key = `${COUNTER_PREFIX}${scope}.${prefix}`;
  const head = `${prefix}-${tag}-`;
  let max = Number(read(key) || 0) || 0;
  for (const n of known) {
    if (!n.startsWith(head)) continue;
    const v = Number(n.slice(head.length).split('-')[0]);
    if (v > max) max = v;
  }
  const next = max + 1;
  write(key, String(next));
  return `${head}${String(next).padStart(5, '0')}`;
}
