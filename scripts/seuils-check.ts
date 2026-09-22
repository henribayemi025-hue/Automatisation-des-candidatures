/**
 * Les seuils fiscaux camerounais : avertir au bon moment, et se taire ailleurs.
 *
 * Tous les montants viennent du projet de loi de finances 2026 lu le 22/09
 * (articles C 39 et C 44). Ce contrôle vérifie qu'on ne se trompe ni de seuil,
 * ni de pays, ni de moment.
 *
 *   npx vite-node scripts/seuils-check.ts
 */
import { applyEvent, emptyDB, saleTotals } from '../src/lib/reducer';
import { alerteSeuil, caExercice, seuilReclassement, SEUIL_COMPTABILITE, SEUIL_IGS_COMMERCE, SEUIL_IGS_LIBERAL } from '../src/lib/seuils';
import type { DB, Sale, WorkspaceEvent } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

const AUJOURD_HUI = '2026-09-22';
let seq = 0;
const ev = (type: string, payload: Record<string, unknown>): WorkspaceEvent =>
  ({ id: `e${++seq}`, at: `${AUJOURD_HUI}T08:00:00.000Z`, actorId: 'u', actorName: 'Awa', type, payload });

const money = (v: number) => `${v} FCFA`;
const t = (s: string, vars?: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? ''));

function boutique(pays: string, secteur: string, ca: number): DB {
  let db: DB = emptyDB();
  db = applyEvent(db, ev('company.update', {
    patch: { name: 'Chez Awa', currency: 'XAF', chart: 'SYSCOHADA', country: pays, sector: secteur, onboarded: true, fiscalYearStart: '01-01' },
  }));
  if (ca > 0) {
    const lines = [{ productId: '', name: 'Vente', qty: 1, unitPrice: ca, unitCost: 0 }];
    const tot = saleTotals(db.company, lines, 0);
    const sale: Sale = {
      id: 'v1', number: 'FA-00001', date: '2026-03-10', customerId: null, customerName: 'Vente au comptoir',
      lines, discount: 0, vat: tot.vat, total: tot.total, paid: tot.total, method: 'CASH',
      status: 'CONFIRMED', cashier: 'Awa', createdAt: `${AUJOURD_HUI}T08:00:00.000Z`,
    };
    db = applyEvent(db, ev('sale.record', { sale, ids: { movements: ['m'], saleEntry: 'se', cogsEntry: 'ce', debt: 'de' } }));
  }
  return db;
}
const alerte = (db: DB) => alerteSeuil(db, AUJOURD_HUI, money, t);

// ── Les seuils sont ceux du texte ────────────────────────────────────────
check(SEUIL_COMPTABILITE === 10_000_000, 'comptabilité et DSF : 10 000 000 (article C 44)');
check(SEUIL_IGS_COMMERCE === 50_000_000, 'reclassement commerce : 50 000 000 (article C 39-1-a)');
check(SEUIL_IGS_LIBERAL === 30_000_000, 'reclassement libéral : 30 000 000 (article C 39-1-b)');
check(seuilReclassement({ sector: 'retail' }) === SEUIL_IGS_COMMERCE, 'une boutique relève du seuil de 50 M');
check(seuilReclassement({ sector: 'health' }) === SEUIL_IGS_LIBERAL, 'une activité de santé relève du seuil de 30 M');
check(seuilReclassement({ sector: 'garage' }) === SEUIL_IGS_COMMERCE, 'un garage reste au seuil le plus élevé : dans le doute, on avertit plus tard');

// ── On se tait quand il n'y a rien à dire ────────────────────────────────
check(alerte(boutique('Cameroun', 'retail', 0)) === null, 'aucune vente : aucun avertissement');
check(alerte(boutique('Cameroun', 'retail', 9_000_000)) === null, 'sous 10 M : aucun avertissement');
check(alerte(boutique('France', 'retail', 40_000_000)) === null, 'en France : on se tait, ces seuils ne valent pas là-bas');
check(alerte(boutique('Sénégal', 'retail', 40_000_000)) === null, 'au Sénégal non plus : rien n’a été vérifié pour ce pays');

// ── Les trois moments ────────────────────────────────────────────────────
const a1 = alerte(boutique('Cameroun', 'retail', 12_000_000));
check(a1?.tone === 'warn' && /15 mai/.test(a1.text), 'au-delà de 10 M : comptabilité et déclaration du 15 mai');

const a2 = alerte(boutique('Cameroun', 'retail', 46_000_000));
check(a2?.tone === 'warn' && /encore temps/.test(a2.text), 'à neuf dixièmes du seuil : on prévient avant');

const a3 = alerte(boutique('Cameroun', 'retail', 52_000_000));
check(a3?.tone === 'bad' && /deux exercices/.test(a3.text), 'au-delà : un seul dépassement suffit, et le retour demande deux exercices');

const a4 = alerte(boutique('Cameroun', 'health', 31_000_000));
check(a4?.tone === 'bad', 'une activité libérale bascule à 30 M, pas à 50 M');
check(alerte(boutique('Cameroun', 'retail', 31_000_000))?.tone === 'warn', 'au même chiffre, une boutique n’est pas encore concernée');

// ── Un seul message à la fois ────────────────────────────────────────────
check(a3 !== null && typeof a3.text === 'string' && a3.text.length > 0, 'un seul avertissement est rendu, pas une liste');

// ── Le cumul suit l'exercice, pas le mois ────────────────────────────────
const db = boutique('Cameroun', 'retail', 12_000_000);
check(caExercice(db, AUJOURD_HUI) > 0, 'une vente de mars compte encore en septembre du même exercice');
check(caExercice(db, '2027-01-02') === 0, 'et plus du tout à l’exercice suivant');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
