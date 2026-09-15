/**
 * Passe intermédiaire — volume, simultanéité, hors ligne
 * (docs/PROMPT-SIMULATION-METIERS.md). Tout en mémoire, à travers le vrai
 * moteur ; aucune base touchée.
 *
 *   npx vite-node scripts/sim-volume.ts
 *   SIM_TARGET=200000 npx vite-node scripts/sim-volume.ts   # écritures visées
 *
 * 1. Une entreprise à ≈ 200 000 écritures : temps des écrans (journal, grand
 *    livre, balance, bilan, compte de résultat, accueil, audit, FEC), temps
 *    d'une vente en caisse avec la vraie copie d'état, rejeu de 300 événements
 *    (ce que fait l'ouverture après le dernier instantané), taille du cache,
 *    lecture du cache, empreinte de scellement.
 * 2. Un catalogue de 20 000 références : recherche en caisse, vente.
 * 3. Deux appareils hors ligne sur le même espace : convergence, doublons,
 *    numéros de tickets.
 * 4. Clôture pendant qu'une vente est en cours.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { runEntreprise, Ctx, addDays } from './sim/harness';
import { PROFILES } from './sim/profiles';
import { applyEvent, replay, saleTotals, normalizeDB } from '../src/lib/reducer';
import { accountLedger, balanceSheet, entriesInRange, incomeStatement, runAuditChecks, trialBalance } from '../src/lib/ledger';
import { dashboard } from '../src/lib/kpi';
import { productPerformance } from '../src/lib/metrics';
import { buildFec } from '../src/lib/fec';
import { hashState } from '../src/lib/seal';
import type { DB, Product, Sale, WorkspaceEvent } from '../src/lib/types';

const target = Number(process.env.SIM_TARGET ?? 200_000);
function mkSale(db: DB, n: number, date: string): WorkspaceEvent {
  const product = db.products[0];
  const sl = [{ productId: product.id, name: product.name, qty: 1, unitPrice: product.price, unitCost: product.cost }];
  const t = saleTotals(db.company, sl, 0);
  const sale: Sale = { id: `vol-s${n}`, number: `FA-VOL-${n}`, date, customerId: null, customerName: 'Client', lines: sl, discount: 0, vat: t.vat, total: t.total, paid: t.total, method: 'CASH', status: 'CONFIRMED', cashier: 'Sim', createdAt: `${date}T10:00:00.000Z` };
  return { id: `vol-e${n}`, at: `${date}T10:00:00.000Z`, actorId: 'sim', actorName: 'Sim', type: 'sale.record', payload: { sale, ids: { movements: [`vol-m${n}`], saleEntry: `vol-j${n}`, cogsEntry: `vol-c${n}`, debt: `vol-d${n}` } } };
}
const fmt = (n: number) => n.toLocaleString('fr-FR');
const ms = (t: number) => `${t.toFixed(0)} ms`;
const time = <T,>(f: () => T): [T, number] => {
  const t = performance.now();
  const r = f();
  return [r, performance.now() - t];
};
const lines: string[] = [];
const say = (s: string) => {
  console.log(s);
  lines.push(s);
};

// La vraie copie d'état, gardée de côté : le harnais la remplace pour aller vite.
const realClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fastClone = (globalThis as unknown as { structuredClone: <T>(x: T) => T }).structuredClone;
const g = globalThis as unknown as { structuredClone: <T>(x: T) => T };

// ---------------------------------------------------------------------------
// 1. Dix ans d'activité
// ---------------------------------------------------------------------------
const boutique = PROFILES.find((p) => p.key === 'boutique')!;
const CACHE1 = 'docs/simulation/volume-section1.json';
if (process.env.SIM_SKIP_VOLUME === '1' && existsSync(CACHE1)) {
  for (const l of JSON.parse(readFileSync(CACHE1, 'utf8')) as string[]) say(l);
} else {
say('## Volume : une boutique à dix ans');
say('');
let years = 10;
let run = runEntreprise(boutique, years);
while (run.entries < target && years < 14) {
  years += 1;
  run = runEntreprise(boutique, years);
}
const big: DB = run.db;
say(`État construit : ${years} ans, ${fmt(run.events)} événements, ${fmt(big.entries.length)} écritures, ${fmt(big.sales.length)} ventes, ${fmt(big.products.length)} articles (simulation ${(run.totalMs / 1000).toFixed(0)} s, copie désactivée).`);
say('');
say('| Écran ou opération | Ce que fait la page | Temps |');
say('|---|---|---:|');
const today = addDays('2026-01-05', Math.round(years * 365.25));
const from = `${today.slice(0, 4)}-01-01`;
const [, tJournalAll] = time(() => entriesInRange(big.entries).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
say(`| Journal, sans filtre | tri de toutes les écritures | ${ms(tJournalAll)} |`);
const [, tJournalYear] = time(() => entriesInRange(big.entries, from, today).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
say(`| Journal, exercice en cours | filtre + tri | ${ms(tJournalYear)} |`);
const [tb, tTb] = time(() => trialBalance(big.accounts, big.entries));
say(`| Balance générale | ${fmt(tb.length)} comptes mouvementés | ${ms(tTb)} |`);
const cash = big.accounts.find((a) => a.code === '571')!;
const [rows, tLedger] = time(() => accountLedger(cash.code, big.entries, cash.normal));
say(`| Grand livre, compte caisse, tout | ${fmt(rows.length)} lignes + balance des comptes utilisés | ${ms(tLedger + tTb)} |`);
const [, tSheet] = time(() => balanceSheet(big.accounts, big.entries));
say(`| Bilan | | ${ms(tSheet)} |`);
const [, tIs] = time(() => incomeStatement(big.accounts, big.entries, from, today));
say(`| Compte de résultat de l’exercice | | ${ms(tIs)} |`);
const [, tDash] = time(() => dashboard(big, 'month', today, 1));
const [, tTop] = time(() => productPerformance(big, from, today));
say(`| Accueil (indicateurs + meilleurs articles) | | ${ms(tDash + tTop)} |`);
const [, tAudit] = time(() => runAuditChecks(big.accounts, big.entries));
say(`| Contrôles d’audit | | ${ms(tAudit)} |`);
const [fec, tFec] = time(() => buildFec(big.accounts, big.entries, { from, to: today, decimals: 0 }));
say(`| FEC de l’exercice | ${(fec.length / 1e6).toFixed(1)} Mo de texte | ${ms(tFec)} |`);
const [json, tStr] = time(() => JSON.stringify(big));
say(`| Écriture du cache local (JSON) | ${(json.length / 1e6).toFixed(1)} Mo | ${ms(tStr)} |`);
const [, tParse] = time(() => normalizeDB(JSON.parse(json)));
say(`| Lecture du cache local (JSON + normalisation) | | ${ms(tParse)} |`);
const t0 = performance.now();
const hash = await hashState(big);
say(`| Empreinte de scellement (hashState) | ${hash.slice(0, 8)}… | ${ms(performance.now() - t0)} |`);

// Une vente en caisse avec la vraie copie d'état.
g.structuredClone = realClone;
const [afterOne, tSale] = time(() => applyEvent(big, mkSale(big, 1, today)));
say(`| **Une vente en caisse** (applyEvent avec copie réelle de l’état) | | **${ms(tSale)}** |`);
const evs = Array.from({ length: 300 }, (_, i) => mkSale(big, 100 + i, today));
const [, tReplay] = time(() => replay(afterOne, evs));
say(`| **Ouverture de l’espace : rejeu de 300 événements** après le dernier instantané | | **${(tReplay / 1000).toFixed(1)} s** |`);
g.structuredClone = fastClone;
say('');
say(`Mémoire du processus après construction : ${(process.memoryUsage().rss / 1e6).toFixed(0)} Mo.`);
say('');
writeFileSync(CACHE1, JSON.stringify(lines));
}

// ---------------------------------------------------------------------------
// 2. Catalogue de 20 000 références
// ---------------------------------------------------------------------------
say('## Catalogue : 20 000 références');
say('');
const cat = new Ctx({ ...boutique, key: 'catalogue', seed: 4242 });
cat.emit('company.update', { patch: { name: 'Catalogue', onboarded: true, sector: 'retail' } }, '2026-01-05', 6);
const tCat = performance.now();
for (let i = 0; i < 20_000; i += 1) cat.addProduct({ name: `Référence ${i} ${['riz', 'huile', 'savon', 'lait', 'sucre'][i % 5]}`, price: 1000 + (i % 50) * 100, cost: 700 + (i % 50) * 70, stock: 10 }, '2026-01-05');
say(`Création de 20 000 articles (20 000 événements product.save, copie désactivée) : ${((performance.now() - tCat) / 1000).toFixed(1)} s ; état ${(JSON.stringify(cat.db).length / 1e6).toFixed(1)} Mo ; ${fmt(cat.db.entries.length)} écritures d’entrée en stock.`);
const q = 'référence 1999';
const [found, tSearch] = time(() => cat.db.products.filter((p) => !p.archived).filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)).slice(0, 12));
say(`Recherche en caisse « ${q} » (même filtre que PointOfSale.tsx) : ${found.length} résultats en ${ms(tSearch)}.`);
g.structuredClone = realClone;
const p20 = cat.db.products[19_999];
const sl = [{ productId: p20.id, name: p20.name, qty: 1, unitPrice: p20.price, unitCost: p20.cost }];
const tt = saleTotals(cat.db.company, sl, 0);
const ev20: WorkspaceEvent = { id: 'cat-e1', at: '2026-01-06T10:00:00.000Z', actorId: 'sim', actorName: 'Sim', type: 'sale.record', payload: { sale: { id: 'cat-s1', number: 'FA-CAT-1', date: '2026-01-06', customerId: null, customerName: 'Client', lines: sl, discount: 0, vat: tt.vat, total: tt.total, paid: tt.total, method: 'CASH', status: 'CONFIRMED', cashier: 'Sim', createdAt: '2026-01-06T10:00:00.000Z' } as Sale, ids: { movements: ['cat-m1'], saleEntry: 'cat-j1', cogsEntry: 'cat-c1', debt: 'cat-d1' } } };
const [, tSale20] = time(() => applyEvent(cat.db, ev20));
say(`Une vente avec ce catalogue (copie réelle) : ${ms(tSale20)}. Le catalogue est copié entier à chaque ticket.`);
g.structuredClone = fastClone;
say('');

// ---------------------------------------------------------------------------
// 3. Deux appareils hors ligne
// ---------------------------------------------------------------------------
say('## Deux appareils sans réseau sur le même espace');
say('');
const baseCtx = new Ctx({ ...boutique, key: 'sync', seed: 77 });
baseCtx.emit('company.update', { patch: { name: 'Sync', onboarded: true, sector: 'retail' } }, '2026-01-05', 6);
baseCtx.manual('2026-01-05', 'AP-1', 'Apport', [{ key: 'CASH', debit: 100000 }, { key: 'CAPITAL', credit: 100000 }]);
const couches = baseCtx.addProduct({ name: 'Couches T3', price: 7500, cost: 6200, stock: 3 }, '2026-01-05');
const savon = baseCtx.addProduct({ name: 'Savon', price: 350, cost: 250, stock: 500 }, '2026-01-05');
const base = realClone(baseCtx.db);
g.structuredClone = realClone; // vraie copie : chaque appareil part du même état sans le partager

function deviceSales(device: string, count: number, prod: Product, seq0: number): WorkspaceEvent[] {
  // Chaque appareil numérote ses tickets d'après ce qu'il voit : FA-00001… (nextNumber du store).
  return Array.from({ length: count }, (_, i) => {
    const n = seq0 + i + 1;
    const l = [{ productId: prod.id, name: prod.name, qty: 1, unitPrice: prod.price, unitCost: prod.cost }];
    const t = saleTotals(base.company, l, 0);
    const sale: Sale = { id: `${device}-s${n}`, number: `FA-${String(n).padStart(5, '0')}`, date: '2026-01-06', customerId: null, customerName: 'Client', lines: l, discount: 0, vat: t.vat, total: t.total, paid: t.total, method: 'CASH', status: 'CONFIRMED', cashier: device, createdAt: `2026-01-06T1${i % 9}:00:00.000Z` };
    return { id: `${device}-e${n}`, at: sale.createdAt, actorId: device, actorName: device, type: 'sale.record', payload: { sale, ids: { movements: [`${device}-m${n}`], saleEntry: `${device}-j${n}`, cogsEntry: `${device}-c${n}`, debt: `${device}-d${n}` } } };
  });
}
const A = [...deviceSales('A', 2, couches, 0), ...deviceSales('A', 20, savon, 2)];
const B = [...deviceSales('B', 2, couches, 0), ...deviceSales('B', 20, savon, 2)];
// Serveur : A poussé d'abord, puis B (ordre des seq). Appareil A : ses événements, puis ceux de B en temps réel. Appareil B : l'inverse.
const server = replay(base, [...A, ...B]);
const devA = replay(base, [...A, ...B]);
const devB = replay(base, [...B, ...A]);
const hServer = await hashState(server);
const hA = await hashState(devA);
const hB = await hashState(devB);
say(`- Aucune opération perdue : serveur ${fmt(server.sales.length)} ventes, appareil A ${fmt(devA.sales.length)}, appareil B ${fmt(devB.sales.length)} (44 attendues). Écritures : ${server.entries.length} / ${devA.entries.length} / ${devB.entries.length}.`);
say(`- Aucune comptée deux fois : ${new Set(server.sales.map((s) => s.id)).size} identifiants distincts sur ${server.sales.length}.`);
say(`- Même état à la fin ? Empreinte serveur ${hServer.slice(0, 8)}, A ${hA.slice(0, 8)}, B ${hB.slice(0, 8)} → ${hServer === hA && hA === hB ? 'identiques' : '**différentes**'} (l’empreinte couvre les écritures, dont la référence, qui est le numéro de ticket : les deux appareils ont deux journaux différents jusqu’au prochain rechargement depuis le cloud).`);
const numA = devA.sales.find((s) => s.id === 'B-s1')!.number;
const numB = devB.sales.find((s) => s.id === 'B-s1')!.number;
const numS = server.sales.find((s) => s.id === 'B-s1')!.number;
say(`- Numéros de tickets : la vente B-s1 est imprimée « ${numB} » sur l’appareil B, s’appelle « ${numA} » sur l’appareil A et « ${numS} » après rechargement depuis le cloud. Les deux appareils numérotent depuis le même compteur local ; le moteur ajoute un suffixe au second arrivé (uniqueNumber).`);
const stockServer = server.products.find((p) => p.id === couches.id)!.stock;
say(`- Stock des couches (3 en rayon, 2 vendues sur chaque appareil) : ${stockServer} après synchronisation ; aucun refus, aucun signal.`);
const twice = replay(base, [A[0], A[0]]);
say(`- Le même événement appliqué deux fois (réponse HTTP perdue, puis message temps réel) : ${twice.sales.length} vente(s) pour 1 réelle, ${twice.entries.length - base.entries.length} écritures ajoutées. applyEvent n’est pas idempotent : la garde contre le doublon est uniquement dans collab.tsx (\`applied\`), remplie après la réponse du serveur.`);
say('- Renvoi d’un événement déjà écrit (réponse perdue puis nouvel essai) : `finia_events.id` est clé primaire (vérifié sur la production, lecture seule), l’insertion renvoie une erreur, `pushEvent` répond faux et l’événement reste dans la file locale à chaque tentative ; le voyant reste sur « en attente » sans fin.');
say('- Déconnexion avec une file en attente : `signOut` efface `finia.outbox.*` (collab.tsx) ; les ventes non encore envoyées sont perdues sans avertissement.');
say('');

// ---------------------------------------------------------------------------
// 4. Clôture pendant une vente
// ---------------------------------------------------------------------------
say('## Clôture lancée pendant une vente');
say('');
g.structuredClone = fastClone;
const r1 = runEntreprise({ ...boutique, key: 'close', seed: 5 }, 1.1);
g.structuredClone = realClone;
const dbc = r1.db;
const closed = dbc.closings[0];
const lateSale = mkSale(dbc, 9999, closed.to);
const before = incomeStatement(dbc.accounts, dbc.entries, closed.from, closed.to).netIncome;
const after = applyEvent(dbc, lateSale);
const afterIs = incomeStatement(after.accounts, after.entries, closed.from, closed.to).netIncome;
say(`Exercice ${closed.from}→${closed.to} clôturé (résultat ${fmt(closed.result)}). Une vente datée du ${closed.to}, validée après la clôture (caissier qui finit son ticket pendant que la gérante clôture) : acceptée. Compte de résultat de l’exercice clos avant ${fmt(before)}, après ${fmt(afterIs)} ; le résultat enregistré reste ${fmt(closed.result)}.`);
say('');


writeFileSync('docs/SIMULATION-VOLUME.md', `# Simulation — passe intermédiaire : volume, simultanéité, hors ligne (faits)\n\nGénérée le ${new Date().toISOString().slice(0, 10)} par \`npx vite-node scripts/sim-volume.ts\`, en mémoire, à travers le moteur réel. Aucune base touchée. Ce qui demande un réseau réel (5 puis 20 caissiers sur Supabase, réseau lent) n'est pas mesuré ici : voir la fin du document.\n\n${lines.join('\n')}\n## Non mesuré ici (demande le projet de test en réseau)\n\n- 5 puis 20 caissiers simultanés sur le même espace : chaque appareil reçoit chaque événement des autres par le canal temps réel et l’applique avec une copie complète de l’état (\`applyRemote\` → \`applyEvent\`). Le coût par événement reçu est celui mesuré plus haut pour une vente. À 20 caissiers et 120 tickets par jour chacun, un appareil applique 2 400 événements par jour reçus des autres.\n- Le propriétaire renvoie l’état complet dans \`finia_workspaces.data\` tous les 300 événements (\`COMPACT_AFTER\`), quel que soit l’appareil qui les a produits : avec 20 caissiers, toutes les dix minutes en pleine journée, pour la taille de cache mesurée plus haut.\n- Le schéma \`finia_\` n’existe pas sur le projet de test qiyvoaljqmbfldephobp ; y rejouer ces scénarios demande d’y créer les tables (migration sur le projet de test, aucune autre application n’y est).\n`);
console.log('\n→ docs/SIMULATION-VOLUME.md écrit.');
