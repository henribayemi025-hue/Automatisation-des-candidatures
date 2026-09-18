/**
 * Les cartes de « L'autre moitié, sur ordinateur » : format paysage
 * 1920 × 1080, même langage que la version téléphone — crème, Fraunces, un
 * filet laiton. L'écran est posé dans un cadre aux coins arrondis.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const SC = process.env.SC || '/tmp/video/bureau';
mkdirSync(SC, { recursive: true });
const W = 1920, H = 1080;
export const ECRAN = { x: 240, y: 232, w: 1440, h: 810, r: 26 };

const CHAPITRES = [
  { k: 'accueil',    n: '',        t: 'Le tableau du jour',        s: 'Ce qui rentre, ce qui sort, ce qui reste.' },
  { k: 'encaisser',  n: 'LA VENTE',   t: 'Encaisser',              s: 'Un montant, ou un article. Le ticket suit.' },
  { k: 'carte',      n: 'LA VENTE',   t: 'Les articles',           s: 'Prix, coût, stock — et la recette d’un plat.' },
  { k: 'stock',      n: 'LA VENTE',   t: 'Le stock',               s: 'Chaque entrée, chaque sortie, chaque alerte.' },
  { k: 'achats',     n: 'LES ACHATS', t: 'Les achats',             s: 'Fournisseurs, réceptions, coût de revient.' },
  { k: 'ventes',     n: 'LE SUIVI',   t: 'Les ventes',             s: 'Tous les tickets, retrouvables.' },
  { k: 'dettes',     n: 'LE SUIVI',   t: 'Qui doit quoi',          s: 'Crédits clients, acomptes, relances.' },
  { k: 'depenses',   n: 'LE SUIVI',   t: 'Les dépenses',           s: 'Loyer, énergie, transport, salaires.' },
  { k: 'analyse',    n: 'LE SUIVI',   t: 'Les résultats',          s: 'Ce qui rapporte, ce qui coûte, la tendance.' },
  { k: 'journal',    n: 'LA COMPTA',  t: 'Le journal',             s: 'Chaque opération, à sa date, avec sa pièce.' },
  { k: 'grandlivre', n: 'LA COMPTA',  t: 'Le grand livre',         s: 'Compte par compte, dans l’ordre.' },
  { k: 'balance',    n: 'LA COMPTA',  t: 'La balance',             s: 'Débit, crédit, solde — et elle tombe juste.' },
  { k: 'etats',      n: 'LA COMPTA',  t: 'Bilan et compte de résultat', s: 'Ce que le comptable demande, prêt.' },
  { k: 'rapports',   n: 'LA COMPTA',  t: 'Les documents',          s: 'À imprimer, à exporter, à transmettre.' },
];

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<canvas id="c" width="${W}" height="${H}"></canvas><style>body{margin:0}</style>`);
await pg.waitForTimeout(2500);
await pg.evaluate(() => document.fonts.ready);

const png = async (fn, arg) => Buffer.from(await pg.evaluate(fn, arg), 'base64');
const CST = { W, H, ECRAN };

for (const ch of CHAPITRES) {
  const b = await png(({ ch, C }) => {
    const { W, H, ECRAN } = C;
    const g = document.getElementById('c').getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
    g.save(); g.shadowColor = 'rgba(23,27,38,.28)'; g.shadowBlur = 64; g.shadowOffsetY = 24;
    g.fillStyle = '#FAF6F0'; g.beginPath(); g.roundRect(ECRAN.x, ECRAN.y, ECRAN.w, ECRAN.h, ECRAN.r); g.fill(); g.restore();
    const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = '#9A7A3E';
    esp(ch.n || 'FINJARO ACCOUNTING', '600 20px Inter, sans-serif', 7, W / 2, 84);
    g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 60px Fraunces, Georgia, serif';
    g.fillText(ch.t, W / 2, 152);
    g.fillStyle = '#8A7D6B'; g.font = '400 28px Fraunces, Georgia, serif';
    g.fillText(ch.s, W / 2, 198);
    g.fillStyle = '#9A7A3E'; g.textAlign = 'left';
    esp('ACCOUNTING.FINJARO.NET', '600 18px Inter, sans-serif', 6, W / 2, H - 38);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, { ch, C: CST });
  writeFileSync(`${SC}/fond-${ch.k}.png`, b);
}

writeFileSync(`${SC}/masque-ecran.png`, await png(({ C }) => {
  const { ECRAN } = C; const cv = document.getElementById('c'); cv.width = ECRAN.w; cv.height = ECRAN.h;
  const g = cv.getContext('2d'); g.clearRect(0, 0, ECRAN.w, ECRAN.h);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, ECRAN.w, ECRAN.h, ECRAN.r); g.fill();
  const out = cv.toDataURL('image/png').split(',')[1]; cv.width = C.W; cv.height = C.H; return out;
}, { C: CST }));

const carte = async (nom, dessin) => writeFileSync(`${SC}/${nom}.png`, await png(dessin, CST));

await carte('carte-intro', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO ACCOUNTING', '600 24px Inter, sans-serif', 9, W / 2, 400);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 448); g.lineTo(W / 2 + 60, 448); g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 104px Fraunces, Georgia, serif';
  g.fillText('Toute la boutique,', W / 2, 560);
  g.fillText('sur un écran', W / 2, 664);
  g.fillStyle = '#8A7D6B'; g.font = '400 40px Fraunces, Georgia, serif';
  g.fillText('La caisse, le stock, les achats, les ventes — et la comptabilité au bout.', W / 2, 744);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

await carte('carte-fin', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO ACCOUNTING', '600 24px Inter, sans-serif', 9, W / 2, 360);
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 78px Fraunces, Georgia, serif';
  g.fillText('Elle tient sa boutique.', W / 2, 500);
  g.fillStyle = '#C25E38'; g.font = '500 78px Fraunces, Georgia, serif';
  g.fillText('Son comptable ouvre le reste.', W / 2, 600);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 668); g.lineTo(W / 2 + 60, 668); g.stroke();
  g.fillStyle = '#171B26'; g.font = '500 46px Fraunces, Georgia, serif'; g.fillText('accounting.finjaro.net', W / 2, 756);
  g.fillStyle = '#8A7D6B'; g.font = '400 34px Fraunces, Georgia, serif'; g.fillText('Gratuit jusqu’en novembre.', W / 2, 812);
  // On dit d'où viennent les chiffres : ce sont les données d'exemple livrées
  // avec l'application, pas ceux d'un commerce réel.
  g.fillStyle = '#9A7A3E'; g.font = '500 20px Inter, sans-serif';
  g.fillText('Écrans réels, sur les données d’exemple fournies avec l’application.', W / 2, 1000);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

console.log('cartes paysage dessinées dans', SC);
await br.close();
