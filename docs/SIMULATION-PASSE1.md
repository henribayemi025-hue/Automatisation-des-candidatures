# Simulation métiers — passe 1 (faits)

Générée le 2026-09-15 par `npx vite-node scripts/sim-passe1.ts` sur 10 ans par entreprise, à travers le moteur réel (`applyEvent`), en mémoire. Aucune base touchée. Rejouable à l'identique (générateur pseudo-aléatoire fixé par entreprise).

Résultats bruts par entreprise : `docs/simulation/<clé>.json` (agrégation : `SIM_JSON=docs/simulation npx vite-node scripts/sim-passe1.ts --aggregate`).

Ce document ne contient que des faits : ce qui casse, à quel horizon, comment le reproduire. Les recommandations viennent des passes suivantes.

## Faits sur le moteur, indépendants du métier

Mesurés par `npx vite-node scripts/sim/_bench.ts` (ventes d’une ligne, machine de test 4 cœurs) et par lecture du code.

| Ventes déjà passées | Coût d’un événement de plus | Temps cumulé | Écritures | Taille de l’état |
|---:|---:|---:|---:|---:|
| 100 | 0,83 ms | 0,1 s | 202 | 0,1 Mo |
| 500 | 4,5 ms | 1,6 s | 1 002 | 0,7 Mo |
| 1 000 | 10,1 ms | 6,7 s | 2 002 | 1,3 Mo |
| 2 000 | 22,3 ms | 28,9 s | 4 002 | 2,7 Mo |
| 5 000 | 57,2 ms | 200,6 s | 10 002 | 6,4 Mo |

- **Chaque événement copie tout l’état** (`structuredClone(prev)` en tête de `applyEvent`, src/lib/reducer.ts). Le coût d’un ticket croît donc avec tout ce qui a déjà été saisi : 0,8 ms au début, 57 ms après 5 000 ventes, et ça continue en ligne droite. Une supérette à 120 tickets par jour atteint 5 000 ventes en six semaines. Rejouer un journal de 50 000 événements à l’ouverture (ce que fait `replay()` sans instantané) coûte la somme de ces coûts : plusieurs dizaines de minutes.
  Reproduire : `npx vite-node scripts/sim/_bench.ts`.
- **Même sans la copie, le moteur reste en O(n) par vente** : `sale.record` appelle `uniqueNumber(db.sales.map(…))` qui relit tous les numéros de vente, et `db.sales.unshift`, `db.movements.unshift`, `db.debts.unshift` décalent tout le tableau. Mesuré avec la copie désactivée (`SIM_FAST=1`, défaut du simulateur) : la 2e année d’une boutique de quartier coûte 3,3 fois la 1re pour le même nombre de tickets.
  Reproduire : `SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts boutique` et lire la colonne « Cumul ».
- **Le cache local ne tient pas un exercice.** `saveCache` (src/lib/store.tsx) écrit tout l’état JSON dans `localStorage` et avale l’erreur de quota sans rien dire. Les navigateurs accordent en général 5 Mo par origine. Tailles mesurées ci-dessous, colonne « État JSON » : une boutique de quartier dépasse 5 Mo avant la fin du premier trimestre, une supérette en quelques semaines. Passé ce point, l’appareil ne garde plus rien hors ligne et le rejoue depuis le cloud à chaque ouverture, sans message.
  Reproduire : ouvrir la démo, saisir jusqu’à ~5 Mo d’état, couper le réseau, recharger.
- **L’instantané cloud repart entier tous les 300 événements** (`COMPACT_AFTER = 300`, src/lib/collab.tsx) : l’état complet est renvoyé dans `finia_workspaces.data`. À un an, une boutique renvoie ~15 Mo tous les trois ou quatre jours de vente, une supérette ~80 Mo. Non mesuré en réseau ici (pas d’accès sortant) : c’est une lecture du code.
- **Le journal d’audit s’arrête à 3 000 lignes** (`slice(0, 3000)` dans `audit()`, src/lib/reducer.ts) : pour une supérette, un mois d’historique visible, le reste disparaît de l’écran Audit (le journal d’événements, lui, reste complet).
- **Une écriture datée dans un exercice clôturé passe sans avertissement** : `post()` ne regarde pas `db.closings`. Vérifié sur la boutique (année 2, facture d’électricité de décembre saisie en juillet).
- **Tout achat réceptionné se règle depuis la caisse** : `purchase.receive` crédite le compte espèces en dur (src/lib/reducer.ts, écriture « Règlement achat »), le type `Purchase` n’a pas de « payé par » (seuls les frais d’approche ont `landedPaidWith`). Un achat réglé par virement met la caisse sous zéro et laisse la banque intacte.
- **Une vente à zéro produit une écriture vide** : `post()` retire les lignes à zéro et enregistre l’écriture même s’il n’en reste aucune ; le FEC lui attribue un numéro sans ligne. Vérifié sur le cabinet dentaire (consultation gratuite).
- **La ligne de vente porte son propre coût** (`unitCost` dans la charge utile) : le moteur ne relit pas le coût de l’article au moment de la vente. Un appareil dont la fiche article est ancienne sort le stock à un coût périmé, et le compte de stock dérive sans que rien ne le signale.
- **La supérette n’a pas tenu dix ans sur la machine de test** : à 120 tickets par jour, la simulation (copie d’état déjà désactivée) a été coupée après 1 h 50 de calcul et 1,8 Go de mémoire, avant la 10e année ; la pharmacie (60 tickets par jour) a mis 64 minutes et 485 Mo d’état JSON pour ses dix ans. La supérette a été rejouée sur cinq ans. À titre de comparaison, le moteur réel copie l’état à chaque événement : il aurait fallu des jours.
- **Le stock n’a pas de plancher** : `product.stock -= line.qty` sans contrôle. Deux appareils hors ligne qui vendent le dernier exemplaire le passent à −1 à la synchronisation, et le coût des marchandises sort deux fois. Vérifié sur la supérette.

## Vue d’ensemble

Durée : temps de calcul de la simulation avec la copie d’état désactivée (SIM_FAST) ; avec la copie réelle, multiplier par cent et plus. Faits comptés une fois chacun, même répétés à plusieurs horizons.

| Entreprise | Forme | Années simulées | Événements | Écritures | État JSON à la fin | Durée | Bloquant | Majeur | Mineur |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Boutique de quartier — Awa | 1. Boutique de détail (FCFA, IGS) | 10 | 98 460 | 178 444 | 162.0 Mo | 314 s | 1 | 2 | 0 |
| Supérette deux caisses — Douala | 2. Supérette, plusieurs caisses, codes-barres (FCFA, réel) | 5 | 234 331 | 449 697 | 475.8 Mo | 1266 s | 1 | 1 | 1 |
| Restaurant — Chez Tantine | 3. Restaurant (recettes, matières, pertes) | 10 | 200 370 | 369 412 | 330.9 Mo | 1943 s | 0 | 1 | 1 |
| Production de jus — Fruits du Nord | 4. Production (transformation, péremption) | 10 | 61 128 | 90 574 | 82.4 Mo | 57 s | 0 | 2 | 1 |
| Pharmacie — Bonanjo | 5. Pharmacie (lots, marge réglementée) | 10 | 285 835 | 518 127 | 484.7 Mo | 3840 s | 0 | 3 | 1 |
| Boutique de téléphones — Akwa | 6. Électronique (numéros de série, garanties, SAV) | 10 | 44 810 | 70 831 | 62.9 Mo | 54 s | 0 | 2 | 0 |
| Salon de coiffure mixte — Yaoundé | 7. Salon : prestations + revente de produits | 10 | 54 142 | 68 018 | 65.8 Mo | 82 s | 2 | 1 | 0 |
| Vendeur ambulant — Mokolo | 8. Ambulant, sans stock suivi | 10 | 238 182 | 238 188 | 205.2 Mo | 2486 s | 0 | 0 | 0 |
| Import-export — Kribi Trading | 9. Import-export (achats en devise, frais d’approche) | 10 | 12 291 | 14 759 | 13.9 Mo | 3 s | 0 | 1 | 1 |
| Épicerie fine — Lyon (PCG, TVA 20 %) | 10. PME France (PCG, TVA, exercice civil) | 10 | 139 795 | 259 082 | 254.4 Mo | 840 s | 0 | 1 | 1 |
| Reprise d’une quincaillerie — Bafoussam | 11. Reprise d’entreprise (bilan d’ouverture) | 10 | 53 665 | 97 026 | 89.6 Mo | 78 s | 0 | 1 | 1 |
| Coach sportif à domicile — Cape Town | S1. Prestation à la personne (exercice mars→février, ZAR) | 10 | 12 790 | 12 792 | 12.2 Mo | 4 s | 0 | 0 | 0 |
| Plombier-chauffagiste — Manchester (avril→mars, GBP) | S2. Intervention avec pièces, devis et acompte | 10 | 10 787 | 16 969 | 17.0 Mo | 3 s | 2 | 2 | 1 |
| Cabinet de conseil — Abidjan | S3. Mission longue (jalons, facturation d’avancement) | 10 | 2 845 | 2 846 | 3.1 Mo | 1 s | 0 | 0 | 0 |
| Sonorisation d’événements — Dakar | S4. Projet avec matériel (immobilisations, amortissement) | 10 | 8 068 | 4 417 | 5.5 Mo | 1 s | 0 | 0 | 0 |
| École de langues — Addis-Abeba (juillet→juin, ETB) | S5. Cours et abonnements (produits constatés d’avance) | 10 | 8 400 | 8 400 | 8.3 Mo | 2 s | 0 | 0 | 0 |
| Location de matériel de chantier — Bamako | S6. Location (dépôt de garantie) | 10 | 10 490 | 10 490 | 10.0 Mo | 3 s | 0 | 1 | 0 |
| Agence de voyages — Casablanca | S7. Transport / voyage (encaissement pour le compte de tiers) | 10 | 18 492 | 18 494 | 18.5 Mo | 8 s | 0 | 1 | 0 |
| Garage mécanique — Lomé | S8. Atelier sur bien confié (véhicule du client, pièces en dépôt) | 10 | 22 967 | 28 607 | 28.8 Mo | 8 s | 2 | 1 | 0 |
| Cabinet dentaire — Kigali | S9. Santé réglementée (tiers payant, actes multi-séances) | 10 | 35 429 | 35 429 | 39.5 Mo | 24 s | 1 | 3 | 0 |
| Ferme avicole — Bouaké | S10. Personnel posté / élevage (stock vivant, cycle de 45 jours) | 10 | 14 420 | 5 444 | 7.0 Mo | 1 s | 0 | 1 | 0 |

## Boutique de quartier — Awa

*1. Boutique de détail (FCFA, IGS)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 33 | 42 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 166 | 288 | 0.3 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 743 | 1 347 | 1.3 Mo | 0.1 s | passent |
| trimestre | 2026-04-05 | 2 323 | 4 195 | 4.2 Mo | 0.3 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 9 501 | 17 167 | 16.1 Mo | 2.5 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 19 325 | 34 961 | 32.2 Mo | 9.4 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 28 964 | 52 443 | 48.0 Mo | 23.5 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 38 961 | 70 607 | 64.4 Mo | 45.2 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 48 840 | 88 536 | 80.6 Mo | 70.3 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 58 663 | 106 320 | 96.7 Mo | 102.0 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 68 675 | 124 464 | 113.1 Mo | 140.2 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 78 470 | 142 210 | 129.2 Mo | 184.0 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 88 289 | 160 016 | 145.3 Mo | 233.9 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 98 329 | 178 206 | 161.8 Mo | 312.3 s | passent |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **MAJEUR** (année 1) — Retour d’un article vendu : aucun événement de retour ou d’avoir ; la seule voie est d’extourner l’écriture de vente, ce qui ne remet pas l’article en stock ni ne ressort le coût des marchandises.
  Reproduire : Vendre un savon, puis vouloir le reprendre : chercher « retour » ou « avoir » dans le point de vente.
- **BLOQUANT** (année 2) — Dépense datée du 2026-12-28, exercice déjà clôturé : le moteur l’accepte sans avertir (ok=true). Les comptes de gestion de l’exercice clos ne sont plus soldés et le résultat clôturé ne correspond plus au compte de résultat.
  Reproduire : Clôturer l’exercice, puis saisir une dépense datée dans cet exercice.

## Supérette deux caisses — Douala

*2. Supérette, plusieurs caisses, codes-barres (FCFA, réel)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 111 | 190 | 0.2 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 735 | 1 399 | 1.5 Mo | 0.1 s | passent |
| mois | 2026-02-04 | 3 525 | 6 832 | 7.5 Mo | 0.4 s | passent |
| trimestre | 2026-04-05 | 11 430 | 22 029 | 23.6 Mo | 2.6 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 46 078 | 88 498 | 93.9 Mo | 44.5 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 93 287 | 179 141 | 189.8 Mo | 184.9 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 140 301 | 269 310 | 285.0 Mo | 433.5 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 187 009 | 358 902 | 379.8 Mo | 793.6 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 233 805 | 448 693 | 474.7 Mo | 1260.3 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **BLOQUANT** (année 1, puis 4 fois encore) — Deux caisses vendent le même dernier lot de Couches T3 : stock après = -2. Le moteur ne refuse pas et ne signale rien ; le coût des marchandises est sorti deux fois.
  Reproduire : Deux appareils hors ligne, même article, dernier exemplaire ; se resynchroniser. Ou : npx vite-node scripts/sim-passe1.ts superette
- **MINEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 4 fois encore) — Valeur du stock (18 276) ≠ compte de stock (25 358) : écart -7 082
  Reproduire : npx vite-node scripts/sim-passe1.ts superette — horizon année 1 (clôture 2026-01-01→2026-12-31)

## Restaurant — Chez Tantine

*3. Restaurant (recettes, matières, pertes)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 60 | 96 | — | 0.0 s | passent |
| semaine | 2026-01-12 | 405 | 735 | — | 0.0 s | passent |
| mois | 2026-02-04 | 1 637 | 3 001 | — | 0.2 s | passent |
| trimestre | 2026-04-05 | 4 946 | 9 103 | — | 0.7 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 19 759 | 36 406 | — | 9.6 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 39 678 | 73 119 | — | 49.6 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 59 510 | 109 641 | — | 106.8 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 79 545 | 146 581 | — | 192.6 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 99 474 | 183 307 | — | 329.9 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 119 546 | 220 318 | — | 515.8 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 139 700 | 257 498 | — | 743.4 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 159 673 | 294 317 | — | 1028.5 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 179 829 | 331 499 | — | 1425.7 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 200 106 | 368 928 | — | 1935.9 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **INFO** (année 1) — Un plat est un article stocké avec un coût matière fixe : la fiche technique (recette → ingrédients) n’existe pas, la matière achetée n’est pas décomposée.
  Reproduire : Articles → « Poulet DG » : pas de composition.
- **MINEUR** (année 2 (clôture 2027-01-01→2027-12-31), puis 3 fois encore) — Valeur du stock (211 693) ≠ compte de stock (209 130) : écart 2 563
  Reproduire : npx vite-node scripts/sim-passe1.ts restaurant — horizon année 2 (clôture 2027-01-01→2027-12-31)

## Production de jus — Fruits du Nord

*4. Production (transformation, péremption)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 30 | 34 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 98 | 142 | 0.2 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 385 | 610 | 0.7 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 1 340 | 2 057 | 2.2 Mo | 0.1 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 5 915 | 8 837 | 8.7 Mo | 1.0 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 12 040 | 17 937 | 16.9 Mo | 2.6 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 18 218 | 27 088 | 25.1 Mo | 5.2 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 24 160 | 35 871 | 33.0 Mo | 8.2 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 30 090 | 44 610 | 40.9 Mo | 13.0 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 36 224 | 53 693 | 49.1 Mo | 19.2 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 42 319 | 62 647 | 57.2 Mo | 27.0 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 48 651 | 72 067 | 65.7 Mo | 36.2 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 54 817 | 81 204 | 74.0 Mo | 45.9 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 61 056 | 90 470 | 82.3 Mo | 57.0 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **MAJEUR** (année 1) — Aucune date de péremption ni numéro de lot sur un article : la casse se saisit à la main après coup, rien ne prévient avant.
  Reproduire : Articles → fiche « Jus gingembre » : aucun champ date limite / lot.
- **MINEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 8 fois encore) — Valeur du stock (1 169 908) ≠ compte de stock (1 155 690) : écart 14 218
  Reproduire : npx vite-node scripts/sim-passe1.ts jus — horizon année 1 (clôture 2026-01-01→2026-12-31)

## Pharmacie — Bonanjo

*5. Pharmacie (lots, marge réglementée)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 98 | 169 | — | 0.0 s | passent |
| semaine | 2026-01-12 | 479 | 904 | — | 0.1 s | passent |
| mois | 2026-02-04 | 2 145 | 4 132 | — | 0.3 s | passent |
| trimestre | 2026-04-05 | 6 607 | 12 463 | — | 1.4 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 27 701 | 50 682 | — | 22.0 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 56 381 | 102 660 | — | 82.1 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 85 440 | 155 361 | — | 187.9 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 114 205 | 207 484 | — | 366.2 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 142 669 | 258 946 | — | 614.1 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 171 084 | 310 294 | — | 970.0 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 199 990 | 362 648 | — | 1499.9 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 228 792 | 414 827 | — | 2170.6 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 256 843 | 465 637 | — | 2936.8 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 285 424 | 517 386 | — | 3825.3 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **MAJEUR** (année 1) — Ni lot ni péremption ni traçabilité : impossible de retrouver à qui un lot rappelé a été vendu.
  Reproduire : Articles → « Amoxicilline » : aucun champ lot ; Ventes → recherche par lot impossible.
- **MINEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 1 fois encore) — Valeur du stock (17 310) ≠ compte de stock (6 889) : écart 10 421
  Reproduire : npx vite-node scripts/sim-passe1.ts pharmacie — horizon année 1 (clôture 2026-01-01→2026-12-31)
- **MAJEUR** (année 3 (clôture 2028-01-01→2028-12-31), puis 7 fois encore) — Valeur du stock (13 473) ≠ compte de stock (-140 495) : écart 153 968
  Reproduire : npx vite-node scripts/sim-passe1.ts pharmacie — horizon année 3 (clôture 2028-01-01→2028-12-31)

## Boutique de téléphones — Akwa

*6. Électronique (numéros de série, garanties, SAV)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 28 | 32 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 89 | 129 | 0.1 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 364 | 581 | 0.6 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 1 125 | 1 787 | 1.8 Mo | 0.1 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 4 344 | 6 862 | 6.7 Mo | 0.9 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 8 820 | 13 912 | 12.9 Mo | 2.2 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 13 342 | 21 073 | 19.2 Mo | 4.2 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 17 836 | 28 192 | 25.5 Mo | 6.4 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 22 407 | 35 438 | 31.9 Mo | 9.5 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 26 907 | 42 533 | 38.1 Mo | 17.4 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 31 382 | 49 587 | 44.3 Mo | 24.6 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 35 861 | 56 687 | 50.5 Mo | 32.7 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 40 327 | 63 739 | 56.7 Mo | 41.7 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 44 757 | 70 749 | 62.9 Mo | 54.0 s | passent |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **MAJEUR** (année 1) — Pas de numéro de série par unité vendue : une garantie ne se rattache à rien ; un retour SAV sous garantie n’a pas d’événement (ni avoir, ni remplacement, ni provision).
  Reproduire : Vendre « Smartphone A » : le ticket ne demande ni ne garde d’IMEI.

## Salon de coiffure mixte — Yaoundé

*7. Salon : prestations + revente de produits* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 31 | 31 | 0.0 Mo | 0.0 s | **cassent** |
| semaine | 2026-01-12 | 114 | 140 | 0.2 Mo | 0.0 s | **cassent** |
| mois | 2026-02-04 | 447 | 537 | 0.6 Mo | 0.1 s | **cassent** |
| trimestre | 2026-04-05 | 1 353 | 1 684 | 1.9 Mo | 0.2 s | **cassent** |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 5 336 | 6 679 | 7.0 Mo | 1.0 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 10 694 | 13 417 | 13.5 Mo | 2.7 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 16 234 | 20 409 | 20.2 Mo | 5.6 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 21 557 | 27 107 | 26.6 Mo | 9.9 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 26 923 | 33 832 | 33.0 Mo | 17.4 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 32 316 | 40 586 | 39.5 Mo | 25.8 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 37 781 | 47 509 | 46.1 Mo | 36.2 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 43 221 | 54 342 | 52.7 Mo | 48.3 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 48 731 | 61 277 | 59.3 Mo | 63.2 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 54 050 | 67 909 | 65.7 Mo | 81.2 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **BLOQUANT** (jour 1, puis 13 fois encore) — Stock négatif sur 3 article(s) : Coupe homme -5, Tresses -1, Brushing -4
  Reproduire : npx vite-node scripts/sim-passe1.ts salon — horizon jour 1
- **BLOQUANT** (année 1) — Salon mixte (stock activé pour les crèmes) : la prestation « Coupe homme » a un stock de -678 après ventes. Une prestation ne devrait pas décrémenter de stock.
  Reproduire : Salon avec « suivre le stock » activé ; vendre une coupe ; ouvrir la fiche article.

## Vendeur ambulant — Mokolo

*8. Ambulant, sans stock suivi* — XAF, plan SYSCOHADA, exercice à partir du 01-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 79 | 75 | — | 0.0 s | passent |
| semaine | 2026-01-12 | 510 | 506 | — | 0.0 s | passent |
| mois | 2026-02-04 | 2 022 | 2 018 | — | 0.2 s | passent |
| trimestre | 2026-04-05 | 5 946 | 5 942 | — | 0.9 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 23 681 | 23 678 | — | 14.7 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 47 101 | 47 099 | — | 61.7 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 70 825 | 70 824 | — | 136.8 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 94 733 | 94 733 | — | 248.7 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 118 727 | 118 728 | — | 405.6 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 142 500 | 142 502 | — | 606.7 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 166 453 | 166 456 | — | 887.3 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 190 190 | 190 194 | — | 1326.4 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 214 020 | 214 025 | — | 1875.9 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 237 860 | 237 866 | — | 2477.1 s | passent |

## Import-export — Kribi Trading

*9. Import-export (achats en devise, frais d’approche)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 20 | 18 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 38 | 42 | 0.1 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 64 | 45 | 0.1 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 159 | 101 | 0.1 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 745 | 623 | 0.7 Mo | 0.1 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 1 764 | 1 732 | 1.8 Mo | 0.2 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 2 829 | 2 915 | 3.1 Mo | 0.3 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 4 020 | 4 327 | 4.5 Mo | 0.5 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 5 292 | 5 881 | 6.0 Mo | 0.8 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 6 586 | 7 486 | 7.4 Mo | 1.2 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 7 947 | 9 205 | 9.0 Mo | 1.4 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 9 378 | 11 029 | 10.6 Mo | 1.8 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 10 763 | 12 785 | 12.1 Mo | 2.2 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 12 259 | 14 710 | 13.8 Mo | 2.6 s | passent |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **INFO** (année 1, puis 9 fois encore) — Conteneur : marchandise 7 200 000 + frais d’approche 4 360 000 → coût unitaire attendu ≈ 9633 avant pondération ; coût moyen pondéré appliqué = 9633. Le moteur intègre les frais d’approche au stock.
  Reproduire : Achats → nouvelle commande avec frais (douane, fret) → réceptionner ; lire le coût de l’article.
- **MINEUR** (année 8 (clôture 2033-01-01→2033-12-31), puis 1 fois encore) — Valeur du stock (0) ≠ compte de stock (4 118) : écart -4 118
  Reproduire : npx vite-node scripts/sim-passe1.ts import — horizon année 8 (clôture 2033-01-01→2033-12-31)

## Épicerie fine — Lyon (PCG, TVA 20 %)

*10. PME France (PCG, TVA, exercice civil)* — EUR, plan PCG, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 36 | 50 | 0.1 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 282 | 521 | 0.6 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 1 166 | 2 198 | 2.4 Mo | 0.1 s | passent |
| trimestre | 2026-04-05 | 3 567 | 6 647 | 7.2 Mo | 0.6 s | **cassent** |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 14 017 | 26 025 | 26.2 Mo | 5.1 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 28 157 | 52 241 | 51.9 Mo | 23.3 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 41 855 | 77 585 | 76.7 Mo | 53.6 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 55 544 | 102 904 | 101.5 Mo | 96.8 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 69 681 | 129 112 | 127.2 Mo | 157.8 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 83 756 | 155 194 | 152.7 Mo | 231.9 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 97 971 | 181 548 | 178.5 Mo | 332.6 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 111 524 | 206 642 | 203.0 Mo | 437.9 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 125 337 | 232 260 | 228.1 Mo | 589.5 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 139 609 | 258 734 | 254.1 Mo | 836.9 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **MINEUR** (trimestre, puis 9 fois encore) — Valeur du stock (420 039) ≠ compte de stock (417 601) : écart 2 438
  Reproduire : npx vite-node scripts/sim-passe1.ts france — horizon trimestre

## Reprise d’une quincaillerie — Bafoussam

*11. Reprise d’entreprise (bilan d’ouverture)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 20 | 23 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 45 | 73 | 0.1 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 187 | 350 | 0.4 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 873 | 1 618 | 1.7 Mo | 0.1 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 4 765 | 8 641 | 8.5 Mo | 1.0 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 10 203 | 18 487 | 17.5 Mo | 2.7 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 15 614 | 28 253 | 26.5 Mo | 5.9 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 20 889 | 37 794 | 35.3 Mo | 9.6 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 26 275 | 47 537 | 44.2 Mo | 16.5 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 31 713 | 57 385 | 53.2 Mo | 25.1 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 37 425 | 67 739 | 62.8 Mo | 35.4 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 42 719 | 77 282 | 71.5 Mo | 50.7 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 48 189 | 87 147 | 80.6 Mo | 63.6 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 53 588 | 96 895 | 89.5 Mo | 78.0 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **INFO** (année 1) — Les créances reprises en écriture manuelle (411) n’existent pas comme dettes clients dans l’application : pas de relance, pas d’encaissement possible via « régler ». Le bilan les porte, la liste des impayés non.
  Reproduire : Rattrapage → à-nouveaux avec 411 ; ouvrir Clients → impayés.
- **INFO** (année 1) — La camionnette reprise en écriture manuelle n’est pas dans la liste des immobilisations : aucune dotation calculée pour elle.
  Reproduire : Rattrapage → à-nouveaux avec 245 ; ouvrir Immobilisations.
- **MINEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 9 fois encore) — Valeur du stock (89 178) ≠ compte de stock (93 540) : écart -4 362
  Reproduire : npx vite-node scripts/sim-passe1.ts reprise — horizon année 1 (clôture 2026-01-01→2026-12-31)

## Coach sportif à domicile — Cape Town

*S1. Prestation à la personne (exercice mars→février, ZAR)* — ZAR, plan GENERIC, exercice à partir du 03-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 14 | 6 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 35 | 27 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 114 | 106 | 0.1 Mo | 0.0 s | passent |
| année 1 (clôture 2025-03-01→2026-02-28) | 2026-03-01 | 205 | 198 | 0.2 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 328 | 321 | 0.4 Mo | 0.1 s | passent |
| année 2 (clôture 2026-03-01→2027-02-28) | 2027-03-01 | 1 486 | 1 480 | 1.6 Mo | 0.2 s | passent |
| année 3 (clôture 2027-03-01→2028-02-29) | 2028-03-01 | 2 791 | 2 786 | 3.1 Mo | 0.4 s | passent |
| année 4 (clôture 2028-03-01→2029-02-28) | 2029-03-01 | 4 059 | 4 055 | 4.3 Mo | 0.6 s | passent |
| année 5 (clôture 2029-03-01→2030-02-28) | 2030-03-01 | 5 333 | 5 330 | 5.5 Mo | 0.9 s | passent |
| année 6 (clôture 2030-03-01→2031-02-28) | 2031-03-01 | 6 631 | 6 629 | 6.6 Mo | 1.3 s | passent |
| année 7 (clôture 2031-03-01→2032-02-29) | 2032-03-01 | 7 912 | 7 911 | 7.8 Mo | 1.7 s | passent |
| année 8 (clôture 2032-03-01→2033-02-28) | 2033-03-01 | 9 199 | 9 199 | 9.0 Mo | 2.1 s | passent |
| année 9 (clôture 2033-03-01→2034-02-28) | 2034-03-01 | 10 453 | 10 454 | 10.1 Mo | 2.6 s | passent |
| année 10 (clôture 2034-03-01→2035-02-28) | 2035-03-01 | 11 751 | 11 753 | 11.3 Mo | 3.3 s | passent |

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Carnets prépayés non consommés | 7 234 781 | Produit à la vente (compte ventes), 180869.52 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 2 | Carnets prépayés non consommés | 14 052 170 | Produit à la vente (compte ventes), 1353043.14 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 3 | Carnets prépayés non consommés | 16 834 778 | Produit à la vente (compte ventes), 1554782.22 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 4 | Carnets prépayés non consommés | 14 747 822 | Produit à la vente (compte ventes), 1439999.64 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 5 | Carnets prépayés non consommés | 13 495 649 | Produit à la vente (compte ventes), 1363477.92 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 6 | Carnets prépayés non consommés | 15 721 735 | Produit à la vente (compte ventes), 1506086.58 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 7 | Carnets prépayés non consommés | 13 495 649 | Produit à la vente (compte ventes), 1523477.88 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 8 | Carnets prépayés non consommés | 15 026 083 | Produit à la vente (compte ventes), 1513043.1 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 9 | Carnets prépayés non consommés | 15 443 474 | Produit à la vente (compte ventes), 1419130.08 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |
| 10 | Carnets prépayés non consommés | 15 026 083 | Produit à la vente (compte ventes), 1481738.76 ZAR de carnets dans l’exercice ; aucun compte « produits constatés d’avance ». |

## Plombier-chauffagiste — Manchester (avril→mars, GBP)

*S2. Intervention avec pièces, devis et acompte* — GBP, plan GENERIC, exercice à partir du 04-06, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 13 | 7 | 0.0 Mo | 0.0 s | **cassent** |
| semaine | 2026-01-12 | 26 | 29 | 0.0 Mo | 0.0 s | **cassent** |
| mois | 2026-02-04 | 85 | 126 | 0.2 Mo | 0.0 s | **cassent** |
| trimestre | 2026-04-05 | 259 | 393 | 0.4 Mo | 0.1 s | **cassent** |
| année 1 (clôture 2025-04-06→2026-04-05) | 2026-04-06 | 261 | 397 | 0.4 Mo | 0.1 s | **cassent** |
| année 2 (clôture 2026-04-06→2027-04-05) | 2027-04-06 | 1 309 | 2 047 | 2.3 Mo | 0.3 s | **cassent** |
| année 3 (clôture 2027-04-06→2028-04-05) | 2028-04-06 | 2 420 | 3 785 | 4.2 Mo | 0.5 s | **cassent** |
| année 4 (clôture 2028-04-06→2029-04-05) | 2029-04-06 | 3 511 | 5 499 | 5.9 Mo | 0.8 s | **cassent** |
| année 5 (clôture 2029-04-06→2030-04-05) | 2030-04-06 | 4 611 | 7 242 | 7.6 Mo | 1.1 s | **cassent** |
| année 6 (clôture 2030-04-06→2031-04-05) | 2031-04-06 | 5 707 | 8 948 | 9.3 Mo | 1.4 s | **cassent** |
| année 7 (clôture 2031-04-06→2032-04-05) | 2032-04-06 | 6 779 | 10 641 | 10.9 Mo | 1.7 s | **cassent** |
| année 8 (clôture 2032-04-06→2033-04-05) | 2033-04-06 | 7 843 | 12 357 | 12.5 Mo | 2.1 s | **cassent** |
| année 9 (clôture 2033-04-06→2034-04-05) | 2034-04-06 | 8 935 | 14 078 | 14.2 Mo | 2.5 s | **cassent** |
| année 10 (clôture 2034-04-06→2035-04-05) | 2035-04-06 | 10 006 | 15 742 | 15.8 Mo | 3.1 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **BLOQUANT** (jour 1) — Stock négatif sur 1 article(s) : Main-d’œuvre (h) -2
  Reproduire : npx vite-node scripts/sim-passe1.ts plombier — horizon jour 1
- **BLOQUANT** (semaine, puis 12 fois encore) — Stock négatif sur 2 article(s) : Main-d’œuvre (h) -13, Déplacement -4
  Reproduire : npx vite-node scripts/sim-passe1.ts plombier — horizon semaine
- **MAJEUR** (année 1, puis 9 fois encore) — Acompte de 644.4 sur devis : aucun écran ne le prend. Passé en écriture manuelle (banque 175023.72 → +644.4, compte clients créditeur). À la conversion du devis, l’application encaisse le total 2148 : l’acompte est encaissé deux fois si la commerçante ne corrige pas à la main, et le compte clients reste créditeur de 644.4.
  Reproduire : Devis → acompte (impossible) → convertir le devis : le montant encaissé proposé est le total.
- **MINEUR** (année 2 (clôture 2026-04-06→2027-04-05), puis 8 fois encore) — Valeur du stock (2 059 335) ≠ compte de stock (1 961 146) : écart 98 189
  Reproduire : npx vite-node scripts/sim-passe1.ts plombier — horizon année 2 (clôture 2026-04-06→2027-04-05)

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 2 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 2713.32 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |
| 4 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 5093.88 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |
| 5 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 2334.48 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |
| 7 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 2056.44 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |
| 8 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 2662.08 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |
| 10 | Acomptes clients (compte clients créditeur) | 0 | Compte clients créditeur de 1948.92 à la clôture : des acomptes passés en 411 au lieu de 419 ; le bilan affiche une créance négative. |

## Cabinet de conseil — Abidjan

*S3. Mission longue (jalons, facturation d’avancement)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 10 | 1 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 13 | 4 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 26 | 17 | 0.0 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 70 | 61 | 0.1 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 261 | 253 | 0.3 Mo | 0.0 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 518 | 511 | 0.6 Mo | 0.1 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 801 | 795 | 0.9 Mo | 0.1 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 1 097 | 1 092 | 1.2 Mo | 0.2 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 1 371 | 1 367 | 1.5 Mo | 0.2 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 1 668 | 1 665 | 1.8 Mo | 0.3 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 1 967 | 1 965 | 2.2 Mo | 0.4 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 2 233 | 2 232 | 2.5 Mo | 0.4 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 2 528 | 2 528 | 2.8 Mo | 0.5 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 2 840 | 2 841 | 3.1 Mo | 0.6 s | passent |

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Forfait 3 mois facturé le 20 décembre | 6 289 308 | Produit intégral au jour de la facture (7 547 170 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 2 | Forfait 3 mois facturé le 20 décembre | 25 157 233 | Produit intégral au jour de la facture (30 188 680 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 3 | Forfait 3 mois facturé le 20 décembre | 6 289 308 | Produit intégral au jour de la facture (7 547 170 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 4 | Forfait 3 mois facturé le 20 décembre | 31 446 542 | Produit intégral au jour de la facture (37 735 850 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 5 | Forfait 3 mois facturé le 20 décembre | 69 182 391 | Produit intégral au jour de la facture (83 018 869 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 6 | Forfait 3 mois facturé le 20 décembre | 37 735 849 | Produit intégral au jour de la facture (45 283 019 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 7 | Forfait 3 mois facturé le 20 décembre | 12 578 617 | Produit intégral au jour de la facture (15 094 340 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 8 | Forfait 3 mois facturé le 20 décembre | 50 314 465 | Produit intégral au jour de la facture (60 377 358 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 9 | Forfait 3 mois facturé le 20 décembre | 44 025 158 | Produit intégral au jour de la facture (52 830 189 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |
| 10 | Forfait 3 mois facturé le 20 décembre | 44 025 158 | Produit intégral au jour de la facture (52 830 189 HT) ; aucun avancement, aucun produit constaté d’avance ; le résultat de l’exercice absorbe 2,5 mois d’un travail à faire l’an prochain. |

## Sonorisation d’événements — Dakar

*S4. Projet avec matériel (immobilisations, amortissement)* — XAF, plan SYSCOHADA, exercice à partir du 01-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 11 | 2 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 25 | 10 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 77 | 39 | 0.1 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 206 | 108 | 0.1 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 820 | 452 | 0.6 Mo | 0.1 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 1 619 | 887 | 1.2 Mo | 0.1 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 2 425 | 1 328 | 1.7 Mo | 0.2 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 3 216 | 1 755 | 2.3 Mo | 0.3 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 3 982 | 2 157 | 2.8 Mo | 0.4 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 4 814 | 2 625 | 3.4 Mo | 0.5 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 5 615 | 3 061 | 4.0 Mo | 0.6 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 6 431 | 3 513 | 4.5 Mo | 0.7 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 7 225 | 3 943 | 5.0 Mo | 0.9 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 8 058 | 4 412 | 5.5 Mo | 1.0 s | passent |

Faits :

- **INFO** (année 1) — La dotation aux amortissements n’est pas automatique à la clôture : si la gérante ne lance pas « dotation », l’exercice se clôt sans amortissement et le résultat est surestimé de 1 200 000 par sono et par an.
  Reproduire : Immobilisations → ajouter une sono → clôturer sans passer par « dotation ».

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Amortissement de l’exercice | 0 | Dotation due 600 000, passée 600 000 (saisie à la main dans la simulation). |
| 2 | Amortissement de l’exercice | 0 | Dotation due 1 200 000, passée 1 200 000 (saisie à la main dans la simulation). |
| 3 | Amortissement de l’exercice | 0 | Dotation due 1 200 000, passée 1 200 000 (saisie à la main dans la simulation). |
| 4 | Amortissement de l’exercice | 0 | Dotation due 1 800 000, passée 1 800 000 (saisie à la main dans la simulation). |
| 5 | Amortissement de l’exercice | 0 | Dotation due 2 400 000, passée 2 400 000 (saisie à la main dans la simulation). |
| 6 | Amortissement de l’exercice | 0 | Dotation due 2 400 000, passée 2 400 000 (saisie à la main dans la simulation). |
| 7 | Amortissement de l’exercice | 0 | Dotation due 3 000 000, passée 3 000 000 (saisie à la main dans la simulation). |
| 8 | Amortissement de l’exercice | 0 | Dotation due 3 600 000, passée 3 600 000 (saisie à la main dans la simulation). |
| 9 | Amortissement de l’exercice | 0 | Dotation due 3 600 000, passée 3 600 000 (saisie à la main dans la simulation). |
| 10 | Amortissement de l’exercice | 0 | Dotation due 3 600 000, passée 3 600 000 (saisie à la main dans la simulation). |

## École de langues — Addis-Abeba (juillet→juin, ETB)

*S5. Cours et abonnements (produits constatés d’avance)* — ETB, plan GENERIC, exercice à partir du 07-08, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 13 | 3 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 27 | 17 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 72 | 62 | 0.1 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 218 | 208 | 0.2 Mo | 0.0 s | passent |
| année 1 (clôture 2025-07-08→2026-07-07) | 2026-07-08 | 445 | 436 | 0.5 Mo | 0.1 s | passent |
| année 2 (clôture 2026-07-08→2027-07-07) | 2027-07-08 | 1 276 | 1 268 | 1.4 Mo | 0.2 s | passent |
| année 3 (clôture 2027-07-08→2028-07-07) | 2028-07-08 | 2 135 | 2 128 | 2.4 Mo | 0.3 s | passent |
| année 4 (clôture 2028-07-08→2029-07-07) | 2029-07-08 | 2 981 | 2 975 | 3.3 Mo | 0.5 s | passent |
| année 5 (clôture 2029-07-08→2030-07-07) | 2030-07-08 | 3 807 | 3 802 | 4.1 Mo | 0.6 s | passent |
| année 6 (clôture 2030-07-08→2031-07-07) | 2031-07-08 | 4 601 | 4 597 | 4.8 Mo | 0.8 s | passent |
| année 7 (clôture 2031-07-08→2032-07-07) | 2032-07-08 | 5 457 | 5 454 | 5.6 Mo | 1.0 s | passent |
| année 8 (clôture 2032-07-08→2033-07-07) | 2033-07-08 | 6 307 | 6 305 | 6.4 Mo | 1.3 s | passent |
| année 9 (clôture 2033-07-08→2034-07-07) | 2034-07-08 | 7 169 | 7 168 | 7.2 Mo | 1.5 s | passent |
| année 10 (clôture 2034-07-08→2035-07-07) | 2035-07-08 | 8 002 | 8 002 | 8.0 Mo | 1.8 s | passent |

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Inscriptions annuelles encaissées en juin | 64 347 824 | 643 478,24 ETB HT en produit de l’exercice clos le 2026-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 2 | Inscriptions annuelles encaissées en juin | 102 608 678 | 1 026 086,78 ETB HT en produit de l’exercice clos le 2027-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 3 | Inscriptions annuelles encaissées en juin | 111 304 334 | 1 113 043,34 ETB HT en produit de l’exercice clos le 2028-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 4 | Inscriptions annuelles encaissées en juin | 126 956 504 | 1 269 565,04 ETB HT en produit de l’exercice clos le 2029-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 5 | Inscriptions annuelles encaissées en juin | 93 913 029 | 939 130,29 ETB HT en produit de l’exercice clos le 2030-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 6 | Inscriptions annuelles encaissées en juin | 92 173 897 | 921 738,97 ETB HT en produit de l’exercice clos le 2031-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 7 | Inscriptions annuelles encaissées en juin | 114 782 593 | 1 147 825,93 ETB HT en produit de l’exercice clos le 2032-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 8 | Inscriptions annuelles encaissées en juin | 88 695 635 | 886 956,35 ETB HT en produit de l’exercice clos le 2033-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 9 | Inscriptions annuelles encaissées en juin | 121 739 114 | 1 217 391,14 ETB HT en produit de l’exercice clos le 2034-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |
| 10 | Inscriptions annuelles encaissées en juin | 119 999 984 | 1 199 999,84 ETB HT en produit de l’exercice clos le 2035-07-07 alors que les cours n’ont pas commencé : aucun compte de produits constatés d’avance. |

## Location de matériel de chantier — Bamako

*S6. Location (dépôt de garantie)* — XOF, plan SYSCOHADA, exercice à partir du 01-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 12 | 2 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 22 | 12 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 77 | 67 | 0.1 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 229 | 219 | 0.3 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 998 | 989 | 1.1 Mo | 0.1 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 2 043 | 2 035 | 2.2 Mo | 0.3 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 3 135 | 3 128 | 3.4 Mo | 0.4 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 4 181 | 4 175 | 4.4 Mo | 0.6 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 5 226 | 5 221 | 5.3 Mo | 0.8 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 6 278 | 6 274 | 6.2 Mo | 1.2 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 7 332 | 7 329 | 7.2 Mo | 1.5 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 8 370 | 8 368 | 8.1 Mo | 1.8 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 9 412 | 9 411 | 9.0 Mo | 2.2 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 10 476 | 10 476 | 10.0 Mo | 2.6 s | passent |

Faits :

- **MAJEUR** (année 1) — Aucun écran pour un dépôt de garantie : encaissé comme une vente (produit), restitué comme une dépense (charge). Le bilan ne montre aucune dette envers les clients pour les dépôts détenus.
  Reproduire : Louer une bétonnière avec caution : chercher « caution » ou « dépôt » dans la caisse.

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Dépôts de garantie encaissés | 130 500 000 | 130 500 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 2 | Dépôts de garantie encaissés | 139 900 000 | 139 900 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 3 | Dépôts de garantie encaissés | 157 200 000 | 157 200 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 4 | Dépôts de garantie encaissés | 131 900 000 | 131 900 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 5 | Dépôts de garantie encaissés | 129 500 000 | 129 500 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 6 | Dépôts de garantie encaissés | 138 800 000 | 138 800 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 7 | Dépôts de garantie encaissés | 136 900 000 | 136 900 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 8 | Dépôts de garantie encaissés | 126 900 000 | 126 900 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 9 | Dépôts de garantie encaissés | 140 100 000 | 140 100 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |
| 10 | Dépôts de garantie encaissés | 141 700 000 | 141 700 000 en produit (ventes) et les restitutions en charges diverses ; ni dette (compte 4xx) ni suivi de qui doit être remboursé. |

## Agence de voyages — Casablanca

*S7. Transport / voyage (encaissement pour le compte de tiers)* — MAD, plan GENERIC, exercice à partir du 01-01, sans stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 14 | 6 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 45 | 37 | 0.1 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 156 | 148 | 0.2 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 450 | 442 | 0.5 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 1 826 | 1 819 | 2.1 Mo | 0.2 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 3 692 | 3 686 | 4.2 Mo | 0.6 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 5 477 | 5 472 | 5.9 Mo | 1.0 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 7 322 | 7 318 | 7.7 Mo | 1.6 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 9 195 | 9 192 | 9.5 Mo | 2.3 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 11 102 | 11 100 | 11.3 Mo | 3.2 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 12 928 | 12 927 | 13.1 Mo | 4.2 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 14 808 | 14 808 | 14.9 Mo | 5.2 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 16 621 | 16 622 | 16.7 Mo | 6.4 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 18 468 | 18 470 | 18.5 Mo | 8.2 s | passent |

Faits :

- **MAJEUR** (année 1) — Un billet vendu pour une compagnie entre en chiffre d’affaires pour son prix total ; le reversement à la compagnie part en charge. Le CA affiché est celui d’un grossiste, pas d’une agence : la TVA collectée est calculée sur le prix du billet.
  Reproduire : Vendre un billet 4 500 : lire Ventes du mois et TVA collectée.

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Billets encaissés pour le compte des compagnies | 460 575 000 | 5 006 250 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 2 | Billets encaissés pour le compte des compagnies | 470 580 000 | 5 115 000 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 3 | Billets encaissés pour le compte des compagnies | 437 115 000 | 4 751 250 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 4 | Billets encaissés pour le compte des compagnies | 476 790 000 | 5 182 500 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 5 | Billets encaissés pour le compte des compagnies | 454 020 000 | 4 935 000 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 6 | Billets encaissés pour le compte des compagnies | 470 580 000 | 5 115 000 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 7 | Billets encaissés pour le compte des compagnies | 467 475 000 | 5 081 250 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 8 | Billets encaissés pour le compte des compagnies | 496 110 000 | 5 392 500 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 9 | Billets encaissés pour le compte des compagnies | 468 510 000 | 5 092 500 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |
| 10 | Billets encaissés pour le compte des compagnies | 465 060 000 | 5 055 000 MAD HT en CA, dont 92 % appartiennent aux compagnies ; TVA collectée sur le total ; aucun compte de tiers. |

## Garage mécanique — Lomé

*S8. Atelier sur bien confié (véhicule du client, pièces en dépôt)* — XOF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 23 | 15 | 0.0 Mo | 0.0 s | **cassent** |
| semaine | 2026-01-12 | 61 | 65 | 0.1 Mo | 0.0 s | **cassent** |
| mois | 2026-02-04 | 196 | 236 | 0.3 Mo | 0.0 s | **cassent** |
| trimestre | 2026-04-05 | 543 | 656 | 0.7 Mo | 0.0 s | **cassent** |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 2 247 | 2 751 | 3.1 Mo | 0.2 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 4 558 | 5 623 | 6.2 Mo | 0.7 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 6 926 | 8 602 | 9.1 Mo | 1.2 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 9 241 | 11 479 | 11.9 Mo | 1.8 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 11 512 | 14 303 | 14.7 Mo | 2.5 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 13 787 | 17 144 | 17.5 Mo | 3.3 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 16 054 | 19 948 | 20.3 Mo | 4.3 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 18 317 | 22 787 | 23.1 Mo | 5.4 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 20 601 | 25 611 | 25.9 Mo | 6.8 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 22 937 | 28 569 | 28.8 Mo | 8.4 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **BLOQUANT** (jour 1) — Stock négatif sur 1 article(s) : Main-d’œuvre (h) -2
  Reproduire : npx vite-node scripts/sim-passe1.ts garage — horizon jour 1
- **BLOQUANT** (semaine, puis 12 fois encore) — Stock négatif sur 2 article(s) : Main-d’œuvre (h) -11, Vidange -15
  Reproduire : npx vite-node scripts/sim-passe1.ts garage — horizon semaine
- **INFO** (année 1) — Les prestations ont un stock qui descend sous zéro dans un garage (stock activé pour les pièces).
  Reproduire : Garage → vendre « Vidange » → fiche article.

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Travaux en cours à la clôture | 85 000 | Facture de 170 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 2 | Travaux en cours à la clôture | 75 000 | Facture de 150 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 3 | Travaux en cours à la clôture | 65 000 | Facture de 130 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 4 | Travaux en cours à la clôture | 82 500 | Facture de 165 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 5 | Travaux en cours à la clôture | 62 500 | Facture de 125 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 6 | Travaux en cours à la clôture | 80 000 | Facture de 160 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 7 | Travaux en cours à la clôture | 92 500 | Facture de 185 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 8 | Travaux en cours à la clôture | 90 000 | Facture de 180 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 9 | Travaux en cours à la clôture | 72 500 | Facture de 145 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |
| 10 | Travaux en cours à la clôture | 120 000 | Facture de 240 000 HT passée en produit alors que la moitié du travail reste à faire ; aucun « travaux en cours » ni facture à établir pour les 5 h faites et non facturées. |

## Cabinet dentaire — Kigali

*S9. Santé réglementée (tiers payant, actes multi-séances)* — RWF, plan GENERIC, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 22 | 12 | 0.0 Mo | 0.0 s | **cassent** |
| semaine | 2026-01-12 | 63 | 53 | 0.1 Mo | 0.0 s | **cassent** |
| mois | 2026-02-04 | 222 | 212 | 0.3 Mo | 0.0 s | **cassent** |
| trimestre | 2026-04-05 | 698 | 688 | 1.0 Mo | 0.1 s | **cassent** |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 3 392 | 3 383 | 4.4 Mo | 0.6 s | **cassent** |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 6 982 | 6 974 | 8.4 Mo | 1.5 s | **cassent** |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 10 492 | 10 485 | 12.2 Mo | 2.7 s | **cassent** |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 13 997 | 13 991 | 16.1 Mo | 4.1 s | **cassent** |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 17 555 | 17 550 | 19.9 Mo | 5.7 s | **cassent** |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 21 121 | 21 117 | 23.9 Mo | 7.7 s | **cassent** |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 24 678 | 24 675 | 27.7 Mo | 10.4 s | **cassent** |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 28 141 | 28 139 | 31.5 Mo | 14.4 s | **cassent** |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 31 820 | 31 819 | 35.5 Mo | 19.0 s | **cassent** |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 35 385 | 35 385 | 39.5 Mo | 23.6 s | **cassent** |

Faits :

- **MAJEUR** (jour 1) — Tout achat réceptionné est réglé depuis la caisse (compte espèces) : l’écran d’achat n’a pas de « payé par ». Un achat réglé par virement ou mobile money fait passer la caisse sous zéro dans l’application, et la banque reste créditée.
  Reproduire : Achats → nouvelle commande, payer 100 % → réceptionner → lire le compte caisse et le compte banque.
- **BLOQUANT** (jour 1, puis 13 fois encore) — Stock négatif sur 3 article(s) : Consultation -2, Détartrage -1, Prothèse (3 séances) -2
  Reproduire : npx vite-node scripts/sim-passe1.ts clinique — horizon jour 1
- **INFO** (année 1) — Consommables (gants, composite) à prix de vente 0 : ils ne se vendent pas, ils se consomment. Ils ne sortent jamais du stock (stock gants = 50) car aucune vente ne les porte ; le stock au bilan gonfle d’un achat à l’autre.
  Reproduire : Acheter des gants ; faire des consultations ; lire Stock → gants.
- **INFO** (année 1) — Le tiers payant (assurance qui règle 75 jours plus tard) passe par « vente à crédit » au nom de l’assureur : rien ne relie l’acte au patient ET à l’assureur ; pas de bordereau de facturation par assureur.
  Reproduire : Ventes → vente à crédit « RSSB » → chercher le patient.
- **MAJEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 9 fois encore) — 1 écriture(s) sans aucune ligne, marquées « passées » (première : 2026-07-04 Vente Client passager). Le FEC leur attribue un numéro sans ligne : trou de numérotation.
  Reproduire : npx vite-node scripts/sim-passe1.ts clinique — horizon année 1 (clôture 2026-01-01→2026-12-31)
- **MAJEUR** (année 1 (clôture 2026-01-01→2026-12-31), puis 9 fois encore) — FEC 2026-01-01→2026-12-31 : 3373 écritures relues, 3374 en base
  Reproduire : npx vite-node scripts/sim-passe1.ts clinique — horizon année 1 (clôture 2026-01-01→2026-12-31)

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Traitements multi-séances encaissés en décembre | 22 372 885 | 33 559 328 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 2 | Traitements multi-séances encaissés en décembre | 22 118 648 | 33 177 972 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 3 | Traitements multi-séances encaissés en décembre | 17 796 613 | 26 694 920 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 4 | Traitements multi-séances encaissés en décembre | 23 644 072 | 35 466 108 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 5 | Traitements multi-séances encaissés en décembre | 18 305 088 | 27 457 632 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 6 | Traitements multi-séances encaissés en décembre | 20 847 461 | 31 271 192 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 7 | Traitements multi-séances encaissés en décembre | 18 305 088 | 27 457 632 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 8 | Traitements multi-séances encaissés en décembre | 19 322 037 | 28 983 056 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 9 | Traitements multi-séances encaissés en décembre | 19 067 800 | 28 601 700 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |
| 10 | Traitements multi-séances encaissés en décembre | 21 355 936 | 32 033 904 RWF HT en produit alors que deux séances sur trois restent à faire ; aucun avancement. |

## Ferme avicole — Bouaké

*S10. Personnel posté / élevage (stock vivant, cycle de 45 jours)* — XOF, plan SYSCOHADA, exercice à partir du 01-01, avec stock.

Horizons :

| Horizon | Date | Événements | Écritures | État JSON | Cumul | Vérifications |
|---|---|---:|---:|---:|---:|---|
| jour 1 | 2026-01-06 | 16 | 1 | 0.0 Mo | 0.0 s | passent |
| semaine | 2026-01-12 | 43 | 14 | 0.0 Mo | 0.0 s | passent |
| mois | 2026-02-04 | 148 | 76 | 0.1 Mo | 0.0 s | passent |
| trimestre | 2026-04-05 | 380 | 157 | 0.2 Mo | 0.0 s | passent |
| année 1 (clôture 2026-01-01→2026-12-31) | 2027-01-01 | 1 482 | 619 | 0.8 Mo | 0.1 s | passent |
| année 2 (clôture 2027-01-01→2027-12-31) | 2028-01-01 | 2 956 | 1 235 | 1.6 Mo | 0.2 s | passent |
| année 3 (clôture 2028-01-01→2028-12-31) | 2029-01-01 | 4 397 | 1 777 | 2.3 Mo | 0.3 s | passent |
| année 4 (clôture 2029-01-01→2029-12-31) | 2030-01-01 | 5 857 | 2 354 | 3.0 Mo | 0.4 s | passent |
| année 5 (clôture 2030-01-01→2030-12-31) | 2031-01-01 | 7 296 | 2 898 | 3.7 Mo | 0.6 s | passent |
| année 6 (clôture 2031-01-01→2031-12-31) | 2032-01-01 | 8 681 | 3 343 | 4.3 Mo | 0.7 s | passent |
| année 7 (clôture 2032-01-01→2032-12-31) | 2033-01-01 | 10 129 | 3 891 | 5.0 Mo | 0.9 s | passent |
| année 8 (clôture 2033-01-01→2033-12-31) | 2034-01-01 | 11 497 | 4 314 | 5.6 Mo | 1.0 s | passent |
| année 9 (clôture 2034-01-01→2034-12-31) | 2035-01-01 | 12 960 | 4 894 | 6.3 Mo | 1.2 s | passent |
| année 10 (clôture 2035-01-01→2035-12-31) | 2036-01-01 | 14 404 | 5 443 | 7.0 Mo | 1.4 s | passent |

Faits :

- **MAJEUR** (année 1) — Stock vivant : le poussin acheté 600 vaut 600 au bilan jusqu’à la vente à 45 jours ; l’aliment (2 000 000 par bande) part en charge le jour de l’achat. À la clôture, une bande en cours est au bilan pour ses 600 × 940 = 564 000 alors qu’elle a coûté 2 564 000. Les œufs entrent en stock par ajustement à leur coût unitaire de 1 200 saisi à la main : produit d’ajustement en résultat.
  Reproduire : Acheter 1 000 poussins, 2 000 000 d’aliment ; lire le bilan avant la vente.
- **INFO** (jour 661, puis 32 fois encore) — Paie 2027-10 non versée : trésorerie insuffisante (simulation)

Piège comptable — faux bénéfice (ce que l’application met en résultat et qui n’en est pas) :

| Exercice | Piège | Faux bénéfice | Comment l’application l’a enregistré |
|---|---|---:|---|
| 1 | Bande en cours + ponte en produit d’ajustement | 448 000 | Ponte entrée par ajustement = 2 448 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 2 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 3 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 4 | Bande en cours + ponte en produit d’ajustement | 544 000 | Ponte entrée par ajustement = 2 544 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 5 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 6 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 7 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 8 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 9 | Bande en cours + ponte en produit d’ajustement | 496 000 | Ponte entrée par ajustement = 2 496 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |
| 10 | Bande en cours + ponte en produit d’ajustement | 544 000 | Ponte entrée par ajustement = 2 544 000 en produit divers avant toute vente ; aliment d’une bande en cours 2 000 000 en charge sans stock en cours. Signe : positif = résultat gonflé, négatif = résultat minoré. |

