/**
 * Capture de « Une journée, sans comptabilité » : un vrai screencast de
 * l'application, pas un diaporama de captures.
 *
 * Beau a rejeté une vidéo de la place de marché en disant « ça n'a pas fait
 * défiler les vidéos, c'est juste des images statiques ». On enregistre donc
 * le flux d'images du navigateur (CDP `Page.startScreencast`), chaque image
 * horodatée, et le montage rend le temps réel de l'enregistrement.
 *
 * L'écran est rendu à l'échelle 2 d'un téléphone (390×844 → 780×1688) : c'est
 * ce qui fait la netteté, agrandir après coup ne la rendrait pas.
 *
 * Rien n'est jamais écrit en base : l'application tourne en local, en mode
 * sans compte, sur des données préparées d'avance.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

const SC = process.env.SC || '/tmp/video/travail';
const BASE = 'http://localhost:4173';
// On n'efface QUE les images : le dossier contient aussi les cartes, et les
// effacer obligerait à les redessiner après chaque capture.
rmSync(`${SC}/trames`, { recursive: true, force: true });
mkdirSync(`${SC}/trames`, { recursive: true });

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await br.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: 'fr-FR',
  storageState: '/tmp/video/etat-demo.json',
});
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 120)));

const cdp = await ctx.newCDPSession(p);
const trames = [];
let t0 = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  const t = metadata.timestamp;
  if (!t0) t0 = t;
  const f = `${SC}/trames/${String(trames.length).padStart(5, '0')}.jpg`;
  writeFileSync(f, Buffer.from(data, 'base64'));
  trames.push({ f, t: t - t0 });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* fin de capture */ }
});

const chapitres = [];
const marque = (nom) => {
  const t = trames.length ? trames[trames.length - 1].t : 0;
  chapitres.push({ nom, t });
  console.log(`  ${nom.padEnd(14)} ${t.toFixed(1)} s`);
};

await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
await p.waitForTimeout(900);

/** L'écran doit bouger : le screencast ne capte que ce qui change, et le
 *  pointeur n'en fait pas partie. Sans défilement, le chapitre se réduit à
 *  rien au montage. */
async function parcourir(dy, ms = 2600) {
  const pas = 22, t = Math.max(1, Math.round(ms / pas));
  for (let i = 0; i < pas; i++) { await p.mouse.wheel(0, dy / pas); await p.waitForTimeout(t); }
}

marque('accueil');
await parcourir(800, 4400);
await parcourir(-800, 3200);

marque('encaisser');
await p.goto(`${BASE}/#/pos`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await p.locator('#pos-quick-amount').click({ force: true });
for (const c of '2500') { await p.keyboard.type(c); await p.waitForTimeout(240); }
await p.locator('#pos-quick-label').click({ force: true });
for (const c of 'Menu du jour') { await p.keyboard.type(c); await p.waitForTimeout(85); }
await p.waitForTimeout(800);
await p.getByRole('button', { name: /^Ajouter$/ }).click({ force: true });
await p.waitForTimeout(1600);
await parcourir(700, 3400);

marque('ticket');
await p.getByRole('button', { name: /Valider|Encaisser/i }).first().click({ force: true });
await p.waitForTimeout(2600);
await parcourir(600, 3600);
await parcourir(-600, 2600);

marque('carte');
await p.goto(`${BASE}/#/produits`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 4600);
await parcourir(-600, 2600);

marque('stock');
await p.goto(`${BASE}/#/stock`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 4600);
await parcourir(-500, 2600);

marque('ventes');
await p.goto(`${BASE}/#/ventes`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 4400);
await parcourir(-500, 2400);

marque('dettes');
await p.goto(`${BASE}/#/dettes`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(800, 4200);
await parcourir(-400, 2200);

marque('abonnements');
await p.goto(`${BASE}/#/abonnements`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(700, 4000);
await parcourir(-400, 2200);

marque('depenses');
await p.goto(`${BASE}/#/depenses`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(800, 4200);
await parcourir(-400, 2200);

marque('analyse');
await p.goto(`${BASE}/#/analyse`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await parcourir(900, 4800);
await parcourir(-500, 2600);

marque('journal');
await p.goto(`${BASE}/#/journal`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 4800);
await parcourir(-500, 2600);

marque('etats');
await p.goto(`${BASE}/#/etats`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await parcourir(900, 5000);
await parcourir(-500, 2600);

marque('fin');
await cdp.send('Page.stopScreencast');
await p.waitForTimeout(400);

writeFileSync(`${SC}/trames.json`, JSON.stringify(trames));
writeFileSync(`${SC}/chapitres.json`, JSON.stringify(chapitres));
console.log(`${trames.length} images, ${chapitres[chapitres.length - 1].t.toFixed(1)} s`);
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await br.close();
