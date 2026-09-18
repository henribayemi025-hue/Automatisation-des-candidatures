/**
 * Assemblage de « Une journée au comptoir » : carte d'intro, puis pour chaque
 * chapitre le fond titré avec la capture posée dedans (coins arrondis), puis
 * la carte de fin. 1080×1920, 30 i/s, mêmes réglages d'encodage partout pour
 * que la concaténation passe sans réencoder.
 *
 * Procédé repris de la place de marché (`video-work/monter-boutique.mjs` du
 * dépôt Finjaro), pour que les deux applications aient la même signature.
 */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const FF = '/home/user/automatisation-des-candidatures/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';
const SC = process.env.SC || '/tmp/video/travail';
const SORTIE = '/tmp/video/finjaro-une-journee-au-comptoir.mp4';
const ff = (args) => execFileSync(FF, ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-vsync', 'cfr', '-an'];
const TEL = { x: 180, y: 250, w: 720, h: 1558, r: 54 };

const chap = JSON.parse(readFileSync(`${SC}/chapitres.json`, 'utf8'));
const trames = JSON.parse(readFileSync(`${SC}/trames.json`, 'utf8'));

// La capture est une suite d'images horodatées : on la remonte à cadence fixe
// avec le démultiplexeur « concat », chaque image tenue jusqu'à la suivante.
// Le temps de la vidéo est donc celui de l'enregistrement, et les marques de
// chapitres tombent juste.
const finT = chap[chap.length - 1].t;
const lignes = [];
for (let i = 0; i < trames.length; i++) {
  const d = (i + 1 < trames.length ? trames[i + 1].t : finT) - trames[i].t;
  lignes.push(`file '${trames[i].f}'`, `duration ${Math.max(d, 0.001).toFixed(4)}`);
}
lignes.push(`file '${trames[trames.length - 1].f}'`);
writeFileSync(`${SC}/trames.txt`, lignes.join('\n'));
const REC = `${SC}/rec-journee.mp4`;
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/trames.txt`, '-vf', `scale=${TEL.w}:${TEL.h}:flags=lanczos`, ...ENC, REC]);
console.log('capture remontée');

const morceaux = [];
for (let i = 0; i < chap.length - 1; i++) morceaux.push({ k: chap[i].nom, ss: chap[i].t, d: chap[i + 1].t - chap[i].t });

const liste = [];
ff(['-loop', '1', '-i', `${SC}/carte-intro.png`, '-t', '3.4', '-vf', 'fade=t=in:st=0:d=0.5:color=0xFAF6F0,fade=t=out:st=3.0:d=0.4:color=0xFAF6F0', ...ENC, `${SC}/b-intro.mp4`]);
liste.push(`${SC}/b-intro.mp4`);

for (const m of morceaux) {
  const out = `${SC}/b-${m.k}.mp4`;
  const fin = Math.max(m.d - 0.35, 0.1);
  ff([
    '-loop', '1', '-i', `${SC}/fond-${m.k}.png`,
    '-ss', String(m.ss), '-t', String(m.d), '-i', REC,
    '-loop', '1', '-i', `${SC}/masque-tel.png`,
    '-filter_complex',
    `[1:v]scale=${TEL.w}:${TEL.h}:flags=lanczos,format=rgba[t];[t][2:v]alphamerge[tm];` +
    `[0:v][tm]overlay=${TEL.x}:${TEL.y}:shortest=1,fade=t=in:st=0:d=0.3:color=0xFAF6F0,fade=t=out:st=${fin.toFixed(2)}:d=0.3:color=0xFAF6F0[v]`,
    '-map', '[v]', '-t', String(m.d), ...ENC, out,
  ]);
  liste.push(out);
  console.log(`chapitre ${m.k.padEnd(11)} ${m.ss.toFixed(1)} s → ${m.d.toFixed(1)} s`);
}

ff(['-loop', '1', '-i', `${SC}/carte-fin.png`, '-t', '5.2', '-vf', 'fade=t=in:st=0:d=0.5:color=0xFAF6F0', ...ENC, `${SC}/b-fin.mp4`]);
liste.push(`${SC}/b-fin.mp4`);

writeFileSync(`${SC}/liste.txt`, liste.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/liste.txt`, '-c', 'copy', SORTIE]);
console.log('MONTÉ :', SORTIE);
