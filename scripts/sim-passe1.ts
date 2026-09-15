/**
 * Passe 1 — docs/PROMPT-SIMULATION-METIERS.md.
 *
 *   npx vite-node scripts/sim-passe1.ts            # les 21 entreprises, 10 ans
 *   npx vite-node scripts/sim-passe1.ts boutique   # une seule
 *   SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts
 *   SIM_FAST=0 … rejoue avec la vraie copie d'état (lent, pour mesurer)
 *
 * Tout se joue en mémoire à travers le vrai moteur. Aucune base n'est touchée.
 * Écrit docs/SIMULATION-PASSE1.md (faits seulement) sauf SIM_NO_DOC=1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { runEntreprise } from './sim/harness';
import type { Finding, RunResult } from './sim/harness';
import { PROFILES } from './sim/profiles';

const years = Number(process.env.SIM_YEARS ?? 10);
const only = process.argv[2] === '--aggregate' ? undefined : process.argv[2];
const jsonDir = process.env.SIM_JSON; // un fichier JSON par entreprise, pour lancer en parallèle puis agréger
const list = only ? PROFILES.filter((p) => p.key === only) : PROFILES;
if (!list.length) {
  console.error(`Profil inconnu : ${only}. Clés : ${PROFILES.map((p) => p.key).join(', ')}`);
  process.exit(2);
}

const fmt = (n: number) => n.toLocaleString('fr-FR');
type Stored = Omit<RunResult, 'db' | 'profile'> & { profile: { key: string; name: string; forme: string; company: RunResult['profile']['company'] } };
const results: Stored[] = [];

if (process.argv[2] === '--aggregate' && jsonDir) {
  for (const p of PROFILES) {
    try {
      results.push(JSON.parse(readFileSync(`${jsonDir}/${p.key}.json`, 'utf8')));
    } catch {
      console.error(`manque ${p.key}.json`);
    }
  }
}

for (const profile of process.argv[2] === '--aggregate' ? [] : list) {
  process.stdout.write(`▶ ${profile.name} … `);
  const r = runEntreprise(profile, years);
  const stored: Stored = { profile: { key: profile.key, name: profile.name, forme: profile.forme, company: profile.company }, horizons: r.horizons, findings: r.findings, traps: r.traps, totalMs: r.totalMs, events: r.events, entries: r.entries, stateBytes: r.stateBytes };
  results.push(stored);
  if (jsonDir) writeFileSync(`${jsonDir}/${profile.key}.json`, JSON.stringify(stored));
  const bad = r.findings.filter((f) => f.gravite !== 'INFO');
  console.log(`${(r.totalMs / 1000).toFixed(1)} s · ${fmt(r.events)} événements · ${fmt(r.entries)} écritures · état ${(r.stateBytes / 1e6).toFixed(1)} Mo · ${bad.length} anomalie(s)`);
  for (const f of dedupe(r.findings)) console.log(`   [${f.gravite}] ${f.horizon} — ${f.quoi}`);
  for (const t of r.traps) console.log(`   piège an ${t.year} : ${t.report.label} → faux bénéfice ${fmt(t.report.falseRevenue)}`);
}

/** Même anomalie répétée à chaque horizon : on garde la première, on compte les autres. */
function dedupe(findings: Finding[]): (Finding & { fois: number })[] {
  const out: (Finding & { fois: number })[] = [];
  for (const raw of findings) {
    // Dérive du compte de stock : majeure seulement si elle pèse (plus de 2 % et plus de 100 000 unités mineures).
    const f = { ...raw };
    const m = /^Valeur du stock \(([\d\s  ]+)\) ≠ compte de stock \(([-\d\s  ]+)\)/.exec(f.quoi);
    if (m) {
      const a = Number(m[1].replace(/[\s  ]/g, ''));
      const b = Number(m[2].replace(/[\s  ]/g, ''));
      const gap = Math.abs(a - b);
      f.gravite = gap > Math.abs(b) * 0.02 && gap > 100_000 ? 'MAJEUR' : 'MINEUR';
    }
    const key = f.quoi.replace(/[\d\s  ,.:−-]+/g, '#');
    const seen = out.find((o) => o.gravite === f.gravite && o.quoi.replace(/[\d\s  ,.:−-]+/g, '#') === key);
    if (seen) seen.fois += 1;
    else out.push({ ...f, fois: 1 });
  }
  return out;
}

if (process.env.SIM_NO_DOC !== '1' && !only && results.length) {
  const lines: string[] = [];
  lines.push('# Simulation métiers — passe 1 (faits)');
  lines.push('');
  lines.push(`Générée le ${new Date().toISOString().slice(0, 10)} par \`npx vite-node scripts/sim-passe1.ts\` sur ${years} ans par entreprise, à travers le moteur réel (\`applyEvent\`), en mémoire. Aucune base touchée. Rejouable à l'identique (générateur pseudo-aléatoire fixé par entreprise).`);
  lines.push('');
  lines.push('Ce document ne contient que des faits : ce qui casse, à quel horizon, comment le reproduire. Les recommandations viennent des passes suivantes.');
  lines.push('');
  lines.push('## Faits sur le moteur, indépendants du métier');
  lines.push('');
  lines.push('Mesurés par `npx vite-node scripts/sim/_bench.ts` (ventes d’une ligne, machine de test 4 cœurs) et par lecture du code.');
  lines.push('');
  lines.push('| Ventes déjà passées | Coût d’un événement de plus | Temps cumulé | Écritures | Taille de l’état |');
  lines.push('|---:|---:|---:|---:|---:|');
  lines.push('| 100 | 0,83 ms | 0,1 s | 202 | 0,1 Mo |');
  lines.push('| 500 | 4,5 ms | 1,6 s | 1 002 | 0,7 Mo |');
  lines.push('| 1 000 | 10,1 ms | 6,7 s | 2 002 | 1,3 Mo |');
  lines.push('| 2 000 | 22,3 ms | 28,9 s | 4 002 | 2,7 Mo |');
  lines.push('| 5 000 | 57,2 ms | 200,6 s | 10 002 | 6,4 Mo |');
  lines.push('');
  lines.push('- **Chaque événement copie tout l’état** (`structuredClone(prev)` en tête de `applyEvent`, src/lib/reducer.ts). Le coût d’un ticket croît donc avec tout ce qui a déjà été saisi : 0,8 ms au début, 57 ms après 5 000 ventes, et ça continue en ligne droite. Une supérette à 120 tickets par jour atteint 5 000 ventes en six semaines. Rejouer un journal de 50 000 événements à l’ouverture (ce que fait `replay()` sans instantané) coûte la somme de ces coûts : plusieurs dizaines de minutes.');
  lines.push('  Reproduire : `npx vite-node scripts/sim/_bench.ts`.');
  lines.push('- **Même sans la copie, le moteur reste en O(n) par vente** : `sale.record` appelle `uniqueNumber(db.sales.map(…))` qui relit tous les numéros de vente, et `db.sales.unshift`, `db.movements.unshift`, `db.debts.unshift` décalent tout le tableau. Mesuré avec la copie désactivée (`SIM_FAST=1`, défaut du simulateur) : la 2e année d’une boutique de quartier coûte 3,3 fois la 1re pour le même nombre de tickets.');
  lines.push('  Reproduire : `SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts boutique` et lire la colonne « Cumul ».');
  lines.push('- **Le cache local ne tient pas un exercice.** `saveCache` (src/lib/store.tsx) écrit tout l’état JSON dans `localStorage` et avale l’erreur de quota sans rien dire. Les navigateurs accordent en général 5 Mo par origine. Tailles mesurées ci-dessous, colonne « État JSON » : une boutique de quartier dépasse 5 Mo avant la fin du premier trimestre, une supérette en quelques semaines. Passé ce point, l’appareil ne garde plus rien hors ligne et le rejoue depuis le cloud à chaque ouverture, sans message.');
  lines.push('  Reproduire : ouvrir la démo, saisir jusqu’à ~5 Mo d’état, couper le réseau, recharger.');
  lines.push('- **L’instantané cloud repart entier tous les 300 événements** (`COMPACT_AFTER = 300`, src/lib/collab.tsx) : l’état complet est renvoyé dans `finia_workspaces.data`. À un an, une boutique renvoie ~15 Mo tous les trois ou quatre jours de vente, une supérette ~80 Mo. Non mesuré en réseau ici (pas d’accès sortant) : c’est une lecture du code.');
  lines.push('- **Le journal d’audit s’arrête à 3 000 lignes** (`slice(0, 3000)` dans `audit()`, src/lib/reducer.ts) : pour une supérette, un mois d’historique visible, le reste disparaît de l’écran Audit (le journal d’événements, lui, reste complet).');
  lines.push('- **Une écriture datée dans un exercice clôturé passe sans avertissement** : `post()` ne regarde pas `db.closings`. Vérifié sur la boutique (année 2, facture d’électricité de décembre saisie en juillet).');
  lines.push('- **Tout achat réceptionné se règle depuis la caisse** : `purchase.receive` crédite le compte espèces en dur (src/lib/reducer.ts, écriture « Règlement achat »), le type `Purchase` n’a pas de « payé par » (seuls les frais d’approche ont `landedPaidWith`). Un achat réglé par virement met la caisse sous zéro et laisse la banque intacte.');
  lines.push('- **Une vente à zéro produit une écriture vide** : `post()` retire les lignes à zéro et enregistre l’écriture même s’il n’en reste aucune ; le FEC lui attribue un numéro sans ligne. Vérifié sur le cabinet dentaire (consultation gratuite).');
  lines.push('- **La ligne de vente porte son propre coût** (`unitCost` dans la charge utile) : le moteur ne relit pas le coût de l’article au moment de la vente. Un appareil dont la fiche article est ancienne sort le stock à un coût périmé, et le compte de stock dérive sans que rien ne le signale.');
  lines.push('- **La supérette n’a pas tenu dix ans sur la machine de test** : à 120 tickets par jour, la simulation (copie d’état déjà désactivée) a été coupée après 1 h 50 de calcul et 1,8 Go de mémoire, avant la 10e année ; la pharmacie (60 tickets par jour) a mis 64 minutes et 485 Mo d’état JSON pour ses dix ans. La supérette a été rejouée sur cinq ans. À titre de comparaison, le moteur réel copie l’état à chaque événement : il aurait fallu des jours.');
  lines.push('- **Le stock n’a pas de plancher** : `product.stock -= line.qty` sans contrôle. Deux appareils hors ligne qui vendent le dernier exemplaire le passent à −1 à la synchronisation, et le coût des marchandises sort deux fois. Vérifié sur la supérette.');
  lines.push('');
  lines.push('## Vue d’ensemble');
  lines.push('');
  lines.push('Durée : temps de calcul de la simulation avec la copie d’état désactivée (SIM_FAST) ; avec la copie réelle, multiplier par cent et plus. Faits comptés une fois chacun, même répétés à plusieurs horizons.');
  lines.push('');
  lines.push('| Entreprise | Forme | Années simulées | Événements | Écritures | État JSON à la fin | Durée | Bloquant | Majeur | Mineur |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of results) {
    const distinct = dedupe(r.findings);
    const n = (g: Finding['gravite']) => distinct.filter((f) => f.gravite === g).length;
    const closed = r.horizons.filter((h) => h.horizon.startsWith('année')).length;
    lines.push(`| ${r.profile.name} | ${r.profile.forme} | ${closed} | ${fmt(r.events)} | ${fmt(r.entries)} | ${(r.stateBytes / 1e6).toFixed(1)} Mo | ${(r.totalMs / 1000).toFixed(0)} s | ${n('BLOQUANT')} | ${n('MAJEUR')} | ${n('MINEUR')} |`);
  }
  lines.push('');
  for (const r of results) {
    lines.push(`## ${r.profile.name}`);
    lines.push('');
    lines.push(`*${r.profile.forme}* — ${r.profile.company.currency}, plan ${r.profile.company.chart}, exercice à partir du ${r.profile.company.fiscalYearStart}, ${r.profile.company.tracksStock === false ? 'sans stock' : 'avec stock'}.`);
    lines.push('');
    lines.push('Horizons :');
    lines.push('');
    lines.push('| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |');
    lines.push('|---|---|---:|---:|---:|---:|---|');
    for (const h of r.horizons) lines.push(`| ${h.horizon} | ${h.date} | ${fmt(h.events)} | ${fmt(h.entries)} | ${h.stateBytes ? `${(h.stateBytes / 1e6).toFixed(1)} Mo` : '—'} | ${(h.ms / 1000).toFixed(1)} s | ${h.ok ? 'passent' : '**cassent**'} |`);
    lines.push('');
    const fs = dedupe(r.findings);
    if (fs.length) {
      lines.push('Faits :');
      lines.push('');
      for (const f of fs) {
        lines.push(`- **${f.gravite}** (${f.horizon}${f.fois > 1 ? `, puis ${f.fois - 1} fois encore` : ''}) — ${f.quoi}`);
        if (f.reproduire) lines.push(`  Reproduire : ${f.reproduire}`);
      }
      lines.push('');
    }
    if (r.traps.length) {
      lines.push('Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :');
      lines.push('');
      lines.push('| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |');
      lines.push('|---|---|---:|---|');
      for (const t of r.traps) lines.push(`| ${t.year} | ${t.report.label} | ${fmt(t.report.falseRevenue)} | ${t.report.howRecorded} |`);
      lines.push('');
    }
  }
  writeFileSync('docs/SIMULATION-PASSE1.md', lines.join('\n') + '\n');
  console.log('\n→ docs/SIMULATION-PASSE1.md écrit.');
}
