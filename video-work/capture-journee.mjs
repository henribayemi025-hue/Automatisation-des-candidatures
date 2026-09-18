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
rmSync(SC, { recursive: true, force: true });
mkdirSync(`${SC}/trames`, { recursive: true });

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await br.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: 'fr-FR',
  storageState: '/tmp/video/etat.json',
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

await p.goto(`${BASE}/#/caisse`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
await p.waitForTimeout(900);

/** Un petit défilement : l'écran doit bouger, sinon l'image se fige et la
 *  durée du chapitre se perd (les images n'arrivent qu'au changement). */
async function respirer(ms = 1400, dy = 0) {
  if (dy) { await p.mouse.wheel(0, dy); await p.waitForTimeout(500); }
  const pas = 6, t = Math.max(1, Math.round(ms / pas));
  for (let i = 0; i < pas; i++) { await p.mouse.move(10 + i, 10 + i); await p.waitForTimeout(t); }
}

// ── 1. Ouvrir la caisse, le matin
marque('ouvrir');
await respirer(1200);
const fond = p.locator('input.field.num').first();
await fond.click({ force: true });
for (const c of '10000') { await p.keyboard.type(c); await p.waitForTimeout(240); }
await respirer(1400);
await p.getByRole('button', { name: /Ouvrir la caisse/i }).click({ force: true });
await p.waitForTimeout(2600);
await respirer(1800, 260);

// ── 2. Encaisser en tapant un montant
marque('encaisser');
await p.goto(`${BASE}/#/pos`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await p.locator('#pos-quick-amount').click({ force: true });
for (const c of '500') { await p.keyboard.type(c); await p.waitForTimeout(260); }
await p.waitForTimeout(700);
await p.locator('#pos-quick-label').click({ force: true });
for (const c of 'Beignets') { await p.keyboard.type(c); await p.waitForTimeout(90); }
await p.waitForTimeout(900);
await p.getByRole('button', { name: /^Ajouter$/ }).click({ force: true });
await p.waitForTimeout(1800);
await respirer(2000, 240);

// ── 2. Un plat, et ses ingrédients
marque('plat');
await p.getByText('Poulet DG').first().scrollIntoViewIfNeeded();
await p.waitForTimeout(800);
await p.getByText('Poulet DG').first().click({ force: true });
await p.waitForTimeout(1100);
await p.getByText('Poulet DG').first().click({ force: true });
await p.waitForTimeout(1600);
await respirer(2400, 300);

// ── 3. Le ticket
marque('ticket');
await p.getByRole('button', { name: /Valider|Encaisser/i }).first().click({ force: true });
await p.waitForTimeout(2400);
await respirer(3000, 220);
await respirer(1800, -220);

// ── 4. Le stock a suivi
marque('stock');
await p.goto(`${BASE}/#/stock`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await respirer(2600, 260);
await respirer(2200, 240);

// ── 5. La comptabilité écrite toute seule
marque('journal');
await p.goto(`${BASE}/#/journal`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await respirer(2600, 280);
await respirer(2400, 280);

// ── 6. Fermer la caisse le soir
marque('fermer');
await p.goto(`${BASE}/#/caisse`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
const compte = p.locator('input.field.num').first();
await compte.click({ force: true });
for (const c of '15500') { await p.keyboard.type(c); await p.waitForTimeout(230); }
await respirer(2200);
await p.getByRole('button', { name: /Clôturer la caisse/i }).click({ force: true });
await p.waitForTimeout(2600);
await respirer(2000, 240);

// ── 7. Les chiffres du jour
marque('accueil');
await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await respirer(2600, 260);
await respirer(2400, 260);

marque('fin');
await cdp.send('Page.stopScreencast');
await p.waitForTimeout(400);

writeFileSync(`${SC}/trames.json`, JSON.stringify(trames));
writeFileSync(`${SC}/chapitres.json`, JSON.stringify(chapitres));
console.log(`${trames.length} images, ${chapitres[chapitres.length - 1].t.toFixed(1)} s`);
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await br.close();
