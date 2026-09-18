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
  { k: 'accueil',     n: '',           t: 'Le tableau du jour',  s: 'Ce qui rentre, ce qui sort, ce qui reste.' },
  { k: 'encaisser',   n: 'LA VENTE',   t: 'Encaisser',           s: 'Un montant, ou un article. Rien à créer.' },
  { k: 'ticket',      n: 'LA VENTE',   t: 'Le ticket',           s: 'Imprimé, ou envoyé sur WhatsApp.' },
  { k: 'carte',       n: 'LA BOUTIQUE', t: 'Les articles',       s: 'Prix, coût, stock — et la recette d’un plat.' },
  { k: 'stock',       n: 'LA BOUTIQUE', t: 'Le stock',           s: 'Chaque entrée, chaque sortie, chaque alerte.' },
  { k: 'ventes',      n: 'LE SUIVI',   t: 'Les ventes',          s: 'Tous les tickets, retrouvables.' },
  { k: 'dettes',      n: 'LE SUIVI',   t: 'Qui doit quoi',       s: 'Crédits clients, acomptes, relances.' },
  { k: 'abonnements', n: 'LE SUIVI',   t: 'Les abonnements',     s: 'Qui arrive au bout, et quand.' },
  { k: 'depenses',    n: 'LE SUIVI',   t: 'Les dépenses',        s: 'Loyer, énergie, transport, salaires.' },
  { k: 'analyse',     n: 'LE SUIVI',   t: 'Les résultats',       s: 'Ce qui rapporte, ce qui coûte, la tendance.' },
  { k: 'journal',     n: 'LA COMPTA',  t: 'Les écritures',       s: 'Elles se sont faites pendant la vente.' },
  { k: 'etats',       n: 'LA COMPTA',  t: 'Bilan et résultat',   s: 'Ce que le comptable demande, prêt.' },
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
  g.fillText('Toute la boutique,', W / 2, 950);
  g.fillText('dans la poche', W / 2, 1062);
  g.fillStyle = '#8A7D6B'; g.font = '400 40px Fraunces, Georgia, serif';
  g.fillText('La caisse, le stock, les ventes — et la comptabilité au bout.', W / 2, 1156);
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
  g.fillText('Écrans réels, sur les données d’exemple fournies avec l’application.', W / 2, 1720);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

console.log('cartes dessinées dans', SC);
await br.close();
