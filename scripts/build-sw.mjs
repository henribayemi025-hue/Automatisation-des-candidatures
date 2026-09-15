/**
 * Écrit dist/sw.js après la compilation.
 *
 * Pourquoi un script plutôt qu'un fichier figé dans public/ : Vite donne aux
 * fichiers compilés un nom qui contient leur empreinte (index-a1b2c3.js). Pour
 * que l'application s'ouvre sans réseau, le service worker doit connaître ces
 * noms — il ne peut donc être écrit qu'une fois la compilation faite.
 *
 * Effet de bord utile : le contenu du service worker change à chaque version,
 * ce qui est exactement ce que le navigateur surveille pour proposer la mise
 * à jour.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

/** Tout ce qui se sert depuis dist, sauf le service worker lui-même. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(DIST)
  .map((f) => relative(DIST, f).split(sep).join('/'))
  .filter((f) => f !== 'sw.js' && !f.endsWith('.map'));

// L'empreinte d'une version : le contenu de tous les fichiers servis.
const hash = createHash('sha256');
for (const f of files.slice().sort()) hash.update(f).update(readFileSync(join(DIST, f)));
const version = hash.digest('hex').slice(0, 12);

// Le strict nécessaire pour ouvrir l'application hors réseau. Le reste
// (images, feuilles de style secondaires) entre au cache au premier passage.
const precache = ['./', './index.html', './manifest.webmanifest', ...files.filter((f) => /\.(js|css)$/.test(f) || f.startsWith('icons/'))];

const sw = `/* Finjaro Accounting — service worker, version ${version}. Fichier produit par scripts/build-sw.mjs, ne pas modifier à la main. */
const VERSION = '${version}';
const SHELL = 'finia-shell-' + VERSION;
const RUNTIME = 'finia-runtime-' + VERSION;
const PRECACHE = ${JSON.stringify(precache, null, 2)};

/** Ces hôtes ne sont jamais servis depuis le cache : la réponse doit être fraîche ou échouer. */
const NEVER_CACHE = /supabase\\.co|googleapis\\.com\\/(?!css)|generativelanguage|\\/auth\\/|\\/rest\\/v1\\//;
/** Polices : servies depuis le cache dès qu'on les a, sinon l'application perd sa typographie hors réseau. */
const FONTS = /^https:\\/\\/fonts\\.(googleapis|gstatic)\\.com\\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then(async (cache) => {
      // addAll échoue en bloc si un seul fichier manque : on ajoute un par un
      // pour qu'une ressource absente ne prive pas l'utilisateur du reste.
      await Promise.all(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)),
      );
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// L'application demande le remplacement quand la personne clique « Mettre à jour ».
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION') event.source && event.source.postMessage({ type: 'VERSION', version: VERSION });
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Supabase, l'assistant, l'authentification : jamais de cache.
  if (NEVER_CACHE.test(request.url)) return;

  // Le document : on tente le réseau, et à défaut la coquille gardée au cache.
  // C'est ce qui permet d'ouvrir l'application sans réseau.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(SHELL);
          return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
        }
      })(),
    );
    return;
  }

  // Polices Google : cache d'abord, elles ne changent jamais.
  if (FONTS.test(request.url)) {
    event.respondWith(cacheFirst(request, RUNTIME).catch(() => Response.error()));
    return;
  }

  // Fichiers de l'application : leur nom contient leur empreinte, le cache
  // d'abord est donc sûr, et instantané.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, RUNTIME).catch(async () => (await caches.match(request)) || Response.error()));
  }
});
`;

writeFileSync(join(DIST, 'sw.js'), sw);
console.log(`sw.js écrit — version ${version}, ${precache.length} fichiers pré-chargés.`);
