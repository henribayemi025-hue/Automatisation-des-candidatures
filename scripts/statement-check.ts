import { parseStatement } from '../src/lib/statement';

const samples = `Vous avez recu 25000 FCFA de MARIE NGO le 12/09/2026. Solde: 145000 FCFA. ID: TX8842AB
Vous avez envoye 7500 FCFA a GROSSISTE CENTRAL le 12/09/2026 08:30. Frais: 125 FCFA. Solde: 137375 FCFA
Retrait de 50 000 FCFA au point marchand KRIBI le 11/09/2026
Paiement facture ENEO 18 500 FCFA le 06/09/2026
2026-09-05;Vente boutique;+12500
2026-09-04;Achat carton savon;-36000
05/09/26 Depot especes 100000
You received 40,000 XAF from ECOLE LES ETOILES on 03/09/2026
Date;Libelle;Montant
02/09/2026;Loyer du local;-75000
bonjour ca va`;

for (const r of parseStatement(samples, 'XAF', '2026-09-12')) {
  console.log(`${r.date} | ${r.direction.padEnd(7)} | ${String(r.amount).padStart(7)} | ${r.label}`);
}
console.log('--- euros ---');
for (const r of parseStatement(`12/09/2026;Facture EDF;-124,50\n11/09/2026;Virement client Dupont;+1 250,00`, 'EUR', '2026-09-12')) {
  console.log(`${r.date} | ${r.direction.padEnd(7)} | ${String(r.amount).padStart(7)} | ${r.label}`);
}
