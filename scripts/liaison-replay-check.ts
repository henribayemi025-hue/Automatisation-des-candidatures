/**
 * Rejeu de l'événement réel écrit par le déclencheur d'Alpha sur le projet de
 * test (commande FJ-8SP3T, espace de la gérante en USD), tel qu'il est en base
 * (docs/simulation/liaison-FJ-8SP3T.json), à travers le moteur de l'application.
 *   npx vite-node scripts/liaison-replay-check.ts
 */
import { readFileSync } from 'node:fs';
import { accountCode } from '../src/lib/chart';
import { applyEvent, emptyDB, replay } from '../src/lib/reducer';
import { balanceOf, balanceSheet, incomeStatement, runAuditChecks } from '../src/lib/ledger';
import { formatMoney } from '../src/lib/money';
import type { DB, WorkspaceEvent } from '../src/lib/types';
let failures = 0;
const check = (ok: boolean, label: string) => { console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`); if (!ok) failures += 1; };
const real = JSON.parse(readFileSync('docs/simulation/liaison-FJ-8SP3T.json', 'utf8')) as WorkspaceEvent;
let db: DB = emptyDB();
// L'espace de la gérante : company.update {currency: USD} (seq 3 sur le projet de test), plan GENERIC par défaut.
db = applyEvent(db, { id: 'cu', at: '2026-09-15T20:19:20.651Z', actorId: 'g', actorName: 'Gérante', type: 'company.update', payload: { patch: { currency: 'USD', name: 'Boutique de la gérante (test)', onboarded: true } } });
const before = db.entries.length;
db = replay(db, [real]);
const sale = db.sales[0];
check(!!sale && sale.number === 'FJ-8SP3T' && sale.source === 'finjaro', 'la vente FJ-8SP3T est rejouée par le moteur, source finjaro');
check(db.entries.length === before + 1, `une seule écriture ajoutée (vente), pas de coût des marchandises (${db.entries.length - before})`);
const cash = balanceOf(accountCode(db.company.chart, 'CASH'), db.entries, 'DEBIT');
check(cash === 4373, `caisse ${formatMoney(cash, 'USD')} (26 500 FCFA × 0,165)`);
const is = incomeStatement(db.accounts, db.entries, '2026-09-01', '2026-09-30');
check(is.totalRevenue === 4373 && is.netIncome === 4373, `produits ${formatMoney(is.totalRevenue, 'USD')}, résultat ${formatMoney(is.netIncome, 'USD')} : sans coût, tout le prix est bénéfice (point soulevé par Alpha)`);
check(balanceSheet(db.accounts, db.entries).difference === 0, 'bilan équilibré');
check(runAuditChecks(db.accounts, db.entries).filter((c) => c.severity === 'ERROR').length === 0, 'aucune erreur d’audit');
check(db.movements.length === 0 && db.products.length === 0, 'aucun mouvement de stock');
db = replay(db, [{ ...real, id: 'rejeu-2' }]);
check(db.sales.length === 1, 'rejeu du même événement : toujours une seule vente');
console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles passent.');
process.exit(failures ? 1 : 0);
