/**
 * Les cartes de « Une journée au comptoir » : intro, fin, un fond par
 * chapitre, et le masque aux coins arrondis du téléphone.
 *
 * Même langage que les vidéos de la place de marché : crème, Fraunces, un
 * filet laiton, de l'air. Tout est dessiné ici.
 *
 * Deux règles qui viennent de Beau, par Alpha :
 * — aucun emoji (« le design pour cette partie-là est à revoir », 11/09) ;
 * — on écrit « gratuit jusqu'en novembre », jamais « gratuit » tout court :
 *   un service gratuit sans limite se lit comme un service sans valeur.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const SC = process.env.SC || '/tmp/video/travail';
mkdirSync(SC, { recursive: true });
const W = 1080, H = 1920;
export const TEL = { x: 180, y: 250, w: 720, h: 1558, r: 54 };

const CHAPITRES = [
  { k: 'ouvrir',    n: '',        t: 'Le matin, la caisse',   s: 'On déclare ce qu’il y a dans le tiroir.' },
  { k: 'encaisser', n: 'ÉTAPE 1', t: 'Encaisser',             s: 'Un montant, un mot. Aucune fiche à créer.' },
  { k: 'plat',      n: 'ÉTAPE 2', t: 'Vendre un plat',        s: 'Ce sont les ingrédients qui sortent du stock.' },
  { k: 'ticket',    n: 'ÉTAPE 3', t: 'Le ticket',             s: 'Imprimé, ou envoyé sur WhatsApp.' },
  { k: 'stock',     n: 'ÉTAPE 4', t: 'Le stock a suivi',      s: 'Sans une seule saisie de plus.' },
  { k: 'journal',   n: 'ÉTAPE 5', t: 'Les écritures',         s: 'Elles se sont écrites pendant la vente.' },
  { k: 'fermer',    n: 'ÉTAPE 6', t: 'Le soir, on compte',    s: 'Le tiroir, puis l’écart s’affiche seul.' },
  { k: 'accueil',   n: '',        t: 'La journée, en un écran', s: 'Ce qui est entré, ce qui reste.' },
];

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<canvas id="c" width="${W}" height="${H}"></canvas><style>body{margin:0}</style>`);
await pg.waitForTimeout(2500);
await pg.evaluate(() => document.fonts.ready);

const png = async (fn, arg) => Buffer.from(await pg.evaluate(fn, arg), 'base64');
const CST = { W, H, TEL };

for (const ch of CHAPITRES) {
  const b = await png(({ ch, C }) => {
    const { W, H, TEL } = C;
    const g = document.getElementById('c').getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
    g.save(); g.shadowColor = 'rgba(23,27,38,.26)'; g.shadowBlur = 70; g.shadowOffsetY = 30;
    g.fillStyle = '#FAF6F0'; g.beginPath(); g.roundRect(TEL.x, TEL.y, TEL.w, TEL.h, TEL.r); g.fill(); g.restore();
    const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = '#9A7A3E';
    esp(ch.n || 'FINJARO ACCOUNTING', '600 22px Inter, sans-serif', 7, W / 2, 96);
    g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 66px Fraunces, Georgia, serif';
    g.fillText(ch.t, W / 2, 168);
    g.fillStyle = '#8A7D6B'; g.font = '400 30px Fraunces, Georgia, serif';
    g.fillText(ch.s, W / 2, 216);
    g.fillStyle = '#9A7A3E'; g.textAlign = 'left';
    esp('ACCOUNTING.FINJARO.NET', '600 20px Inter, sans-serif', 6, W / 2, H - 62);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, { ch, C: CST });
  writeFileSync(`${SC}/fond-${ch.k}.png`, b);
}

writeFileSync(`${SC}/masque-tel.png`, await png(({ C }) => {
  const { TEL } = C; const cv = document.getElementById('c'); cv.width = TEL.w; cv.height = TEL.h;
  const g = cv.getContext('2d'); g.clearRect(0, 0, TEL.w, TEL.h);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, TEL.w, TEL.h, TEL.r); g.fill();
  const out = cv.toDataURL('image/png').split(',')[1]; cv.width = C.W; cv.height = C.H; return out;
}, { C: CST }));

const carte = async (nom, dessin) => writeFileSync(`${SC}/${nom}.png`, await png(dessin, CST));

await carte('carte-intro', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO ACCOUNTING', '600 28px Inter, sans-serif', 9, W / 2, 740);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 800); g.lineTo(W / 2 + 60, 800); g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 112px Fraunces, Georgia, serif';
  g.fillText('Une journée', W / 2, 970);
  g.fillText('au comptoir', W / 2, 1082);
  g.fillStyle = '#8A7D6B'; g.font = '400 40px Fraunces, Georgia, serif';
  g.fillText('Tenir sa caisse sans tenir de comptabilité.', W / 2, 1176);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

await carte('carte-fin', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO ACCOUNTING', '600 28px Inter, sans-serif', 9, W / 2, 740);
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 88px Fraunces, Georgia, serif';
  g.fillText('Elle n’a jamais fait', W / 2, 910);
  g.fillText('de comptabilité.', W / 2, 1010);
  g.fillStyle = '#C25E38'; g.font = '500 76px Fraunces, Georgia, serif';
  g.fillText('Elle en a une.', W / 2, 1136);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 1210); g.lineTo(W / 2 + 60, 1210); g.stroke();
  g.fillStyle = '#171B26'; g.font = '500 50px Fraunces, Georgia, serif'; g.fillText('accounting.finjaro.net', W / 2, 1310);
  g.fillStyle = '#8A7D6B'; g.font = '400 38px Fraunces, Georgia, serif'; g.fillText('Sur le téléphone, même sans réseau.', W / 2, 1382);
  g.fillText('Gratuit jusqu’en novembre.', W / 2, 1446);
  g.fillStyle = '#9A7A3E'; g.font = '500 22px Inter, sans-serif';
  g.fillText('Tous les chiffres montrés sont calculés par l’application.', W / 2, 1720);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

console.log('cartes dessinées dans', SC);
await br.close();
