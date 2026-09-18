/**
 * Capture de « L'autre moitié, sur ordinateur » : le même espace, vu sur un
 * écran large — là où vivent le journal, le grand livre, la balance et les
 * états que réclame un comptable.
 *
 * Même procédé que la version téléphone : un vrai screencast horodaté, rendu
 * à l'échelle 2 (1440×810 → 2880×1620) pour la netteté.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

const SC = process.env.SC || '/tmp/video/bureau';
const BASE = 'http://localhost:4173';
// On n'efface QUE les images : le dossier contient aussi les cartes, et les
// effacer obligerait à les redessiner après chaque capture.
rmSync(`${SC}/trames`, { recursive: true, force: true });
mkdirSync(`${SC}/trames`, { recursive: true });

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await br.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 2,
  locale: 'fr-FR',
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
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* fin */ }
});

const chapitres = [];
const marque = (nom) => {
  const t = trames.length ? trames[trames.length - 1].t : 0;
  chapitres.push({ nom, t });
  console.log(`  ${nom.padEnd(12)} ${t.toFixed(1)} s`);
};

/** L'écran doit bouger : sans mouvement, aucune image n'arrive et la durée du
 *  chapitre se perd au montage. */
async function parcourir(dy, ms = 2400) {
  const pas = 26, t = Math.max(1, Math.round(ms / pas));
  for (let i = 0; i < pas; i++) {
    await p.mouse.wheel(0, dy / pas);
    // Un léger déplacement du pointeur force une image même quand la page ne
    // défile plus : sans ça, l'écran se fige et la durée du chapitre se perd.
    await p.mouse.move(700 + (i % 7) * 3, 400 + (i % 5) * 3);
    await p.waitForTimeout(t);
  }
}

await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 2880, maxHeight: 1620, everyNthFrame: 1 });
await p.waitForTimeout(900);

marque('accueil');
await parcourir(700, 4200);
await parcourir(-700, 3600);

marque('journal');
await p.goto(`${BASE}/#/journal`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 5000);
await parcourir(-500, 3000);

marque('grandlivre');
await p.goto(`${BASE}/#/grand-livre`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
// Le grand livre n'affiche rien tant qu'aucun compte n'est choisi : on en
// choisit un, sinon le chapitre montre un écran vide.
const compte = p.locator('select').first();
const vCompte = await compte.evaluate((el) => {
  const o = Array.from(el.options).find((x) => /vente|client|caisse/i.test(x.textContent));
  return o ? o.value : (el.options[1] ? el.options[1].value : '');
});
if (vCompte) { await compte.selectOption(vCompte); await p.waitForTimeout(1600); }
await parcourir(800, 5000);
await parcourir(-400, 2800);

marque('balance');
await p.goto(`${BASE}/#/balance`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(800, 5000);
await parcourir(-400, 2800);

marque('etats');
await p.goto(`${BASE}/#/etats`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(900, 5400);
await parcourir(-500, 3000);

marque('rapports');
await p.goto(`${BASE}/#/rapports`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await parcourir(800, 5000);
await parcourir(-400, 2600);

// L'écran « Équipe » ne défile pas : sans défilement, aucune image n'arrive
// et le chapitre durerait un dixième de seconde. Le screencast ne capte que
// ce qui change à l'écran — le pointeur n'en fait pas partie.
marque('fin');
await cdp.send('Page.stopScreencast');
await p.waitForTimeout(400);

writeFileSync(`${SC}/trames.json`, JSON.stringify(trames));
writeFileSync(`${SC}/chapitres.json`, JSON.stringify(chapitres));
console.log(`${trames.length} images, ${chapitres[chapitres.length - 1].t.toFixed(1)} s`);
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await br.close();
