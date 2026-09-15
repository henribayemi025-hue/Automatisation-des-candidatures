/**
 * Verrou d'ouverture.
 *
 * Point 4 de docs/SECURITE-2026-09-15.md : un téléphone déverrouillé donne
 * accès à tout — noms et téléphones des clients, salaires, chiffre d'affaires,
 * et la session elle-même. Dans une boutique, l'appareil de caisse est souvent
 * posé sur le comptoir et passe de main en main.
 *
 * Ce verrou demande un code avant d'ouvrir l'application. Il faut être clair
 * sur ce qu'il protège : il arrête quelqu'un qui prend le téléphone, il
 * n'arrête pas quelqu'un qui sait ouvrir les outils du navigateur. Les données
 * restent en clair dans le navigateur — c'est vrai de toute application web, il
 * n'existe pas de coffre côté navigateur. L'écran de réglage le dit.
 *
 * Le code n'est jamais gardé tel quel : on garde son empreinte, salée, ce qui
 * évite qu'il se lise dans le stockage. Comme le même code sert souvent
 * ailleurs, ça compte.
 */

const CODE_KEY = 'finia.lock.code';
const SALT_KEY = 'finia.lock.salt';
const UNTIL_KEY = 'finia.lock.until';

/** Au-delà de ce silence, l'application se reverrouille toute seule. */
const INACTIVITY_MS = 10 * 60 * 1000;

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : le verrou ne tiendra pas, on ne casse rien */
  }
}

function clear(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* rien à faire */
  }
}

async function digest(code: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${code}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function lockEnabled(): boolean {
  return read(CODE_KEY).length > 0;
}

/** Le verrou est-il possible ici ? Sans crypto.subtle, on ne le propose pas. */
export function lockAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}

export async function setLockCode(code: string): Promise<void> {
  const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
  write(SALT_KEY, salt);
  write(CODE_KEY, await digest(code, salt));
  touch();
}

export function removeLock(): void {
  clear(CODE_KEY);
  clear(SALT_KEY);
  clear(UNTIL_KEY);
}

export async function checkLockCode(code: string): Promise<boolean> {
  const stored = read(CODE_KEY);
  if (!stored) return true;
  const ok = (await digest(code, read(SALT_KEY))) === stored;
  if (ok) touch();
  return ok;
}

/** Repousse le reverrouillage : appelé à chaque geste de la personne. */
export function touch(): void {
  write(UNTIL_KEY, String(Date.now() + INACTIVITY_MS));
}

/**
 * Faut-il demander le code maintenant ? Oui si le verrou existe et que le délai
 * d'inactivité est passé — ce qui est toujours le cas à la première ouverture,
 * puisque rien n'a encore été noté.
 */
export function shouldAskCode(): boolean {
  if (!lockEnabled()) return false;
  const until = Number(read(UNTIL_KEY) || 0);
  return !until || Date.now() > until;
}

/** Verrouille tout de suite, sans attendre l'inactivité. */
export function lockNow(): void {
  clear(UNTIL_KEY);
}
