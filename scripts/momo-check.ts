/**
 * Lecture d'un message mobile money partagé.
 *
 * Les messages ci-dessous sont des FORMES PLAUSIBLES, écrites d'après ce que
 * les opérateurs envoient — ce ne sont pas des messages réels collectés. Le
 * but est la robustesse : chaque fois que Beau nous enverra un vrai message
 * qui passe mal, il s'ajoutera ici. On ne prétend pas avoir couvert le réel.
 *
 *   npx vite-node scripts/momo-check.ts
 */
import { dejaVu, libelleMomo, parseMomoSms } from '../src/lib/momo';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}`);
  if (!ok) failures += 1;
};

const T = '2026-09-22';
const lire = (s: string) => parseMomoSms(s, 'XAF', T);

// ── Un encaissement, le cas qui intéresse une boutique ───────────────────
const recu = lire('Vous avez recu 15000 FCFA de JEANNE MBALLA. Frais: 0 FCFA. Nouveau solde: 47350 FCFA. Ref: 1234567890. 22/09/2026 14:32')!;
check(recu.direction === 'IN', 'un encaissement est reconnu comme une entrée');
check(recu.amount === 15000, 'le montant est celui reçu, pas le solde');
check(recu.balance === 47350, 'le solde est lu à part, pour comparer');
check(recu.counterparty === 'JEANNE MBALLA', 'on retient le NOM, pas le numéro');
check(recu.reference === '1234567890', 'la référence de l’opérateur est gardée');
check(recu.date === '2026-09-22', 'la date du message est lue');
check(libelleMomo(recu) === 'Reçu de JEANNE MBALLA', 'le libellé est court et lisible');

// ── LES FRAIS : le point comptable ───────────────────────────────────────
const envoi = lire('Transfert de 5000 FCFA vers AWA NGUEMA effectue. Frais 100 FCFA. Solde: 42250 FCFA')!;
check(envoi.direction === 'OUT', 'un transfert est une sortie');
check(envoi.amount === 5000, 'le montant transféré est 5000');
check(envoi.fee === 100, 'et les frais sont lus SÉPARÉMENT');
check(envoi.amount !== 5100 && envoi.fee !== 0, 'les frais ne sont jamais fondus dans le montant : c’est une charge, pas un transfert plus gros');
check(libelleMomo(envoi) === 'Envoyé à AWA NGUEMA', 'libellé d’un envoi');

// ── Sans nom, on retombe sur le numéro ───────────────────────────────────
const numero = lire('Vous avez recu 7500 FCFA de 237655443322. Solde: 61050 FCFA')!;
check(numero.counterparty === '237655443322', 'sans nom, le numéro fait office de contrepartie');
check(numero.fee === 0, 'un message sans frais donne zéro, pas une valeur inventée');

// ── L'anglais ────────────────────────────────────────────────────────────
const en = lire('You have received 15,000 XAF from PAUL NKOMO. Fee 0 XAF. New balance 47,350 XAF. TxId 9988776655')!;
check(en.direction === 'IN', 'un message en anglais est lu aussi');
check(en.amount === 15000, 'les milliers séparés par une virgule sont compris');
check(en.balance === 47350, 'le solde en anglais aussi');
check(en.reference === '9988776655', 'la référence sous une autre étiquette');

// ── Les autres formes courantes ──────────────────────────────────────────
const retrait = lire('Retrait de 10000 FCFA au point marchand BOUTIQUE CENTRE. Frais 200 FCFA. Solde 7050 FCFA')!;
check(retrait.direction === 'OUT' && retrait.amount === 10000 && retrait.fee === 200, 'un retrait avec frais');
const facture = lire('Paiement de 3500 FCFA a ENEO effectue le 20/09/2026. Solde 3550 FCFA')!;
check(facture.direction === 'OUT' && facture.date === '2026-09-20', 'un paiement de facture, à sa date');
const depot = lire('Depot de 50000 FCFA effectue sur votre compte. Nouveau solde 53550 FCFA')!;
check(depot.direction === 'IN' && depot.amount === 50000, 'un dépôt est une entrée');

// ── Ne pas enregistrer deux fois ─────────────────────────────────────────
check(dejaVu(recu, ['1234567890']), 'un message déjà enregistré est reconnu à sa référence');
check(!dejaVu(recu, ['9999999999']), 'et une autre référence ne le confond pas');
check(!dejaVu(numero, []), 'sans référence, on ne devine pas : la personne décide');

// ── Ce qui n'est pas un message mobile money ─────────────────────────────
check(lire('Bonjour') === null, 'un texte trop court n’est pas lu');
check(lire('') === null, 'un texte vide non plus');
const pub = lire('Rechargez votre forfait internet et gagnez des bonus !');
check(pub === null || pub.amount === 0, 'une publicité sans montant ne produit pas d’écriture');

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
