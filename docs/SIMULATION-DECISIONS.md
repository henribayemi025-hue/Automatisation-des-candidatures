# Simulation métiers — tableau de décision

Le seul livrable final du prompt `docs/PROMPT-SIMULATION-METIERS.md` : une
ligne par problème, du pire au moins grave. Le détail est dans
`docs/SIMULATION-PASSE1.md` (faits par entreprise), `docs/SIMULATION-VOLUME.md`
(volume et hors ligne) et `docs/SIMULATION-PASSE2.md` (revue d'experts). Les
contrôles rejouables sont dans `scripts/sim/`, `scripts/sim-passe1.ts`,
`scripts/sim-volume.ts`.

Effort : estimation en jours de travail d'une personne qui connaît le code,
tests compris. « ☐ » : à cocher par Beau quand c'est traité.

| # | Problème (une phrase) | Métier(s) | Domaine | Gravité | Effort | Décision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Une vente en caisse met 3,7 s à 214 000 écritures et l'ouverture 13 minutes : le moteur copie tout l'état à chaque événement | tous | Moteur | Bloquant | 5 j | ☐ |
| 2 | Un caissier peut envoyer n'importe quel événement au serveur, y compris vider l'espace, clôturer, changer la devise ou un salaire : les rôles n'existent que dans les menus | tous | Sécurité | Bloquant | 2 j | ☐ |
| 3 | Deux appareils hors ligne qui vendent le dernier article le passent sous zéro et sortent le coût deux fois, sans aucun signal | commerce | Hors ligne | Bloquant | 2 j | ☐ |
| 4 | Le même ticket peut être compté deux fois sur l'appareil qui l'a saisi quand le temps réel devance la réponse du serveur | tous | Hors ligne | Bloquant | 1 j | ☐ |
| 5 | Une écriture datée dans un exercice clôturé est acceptée sans avertir ; le résultat clôturé ne correspond plus au compte de résultat | tous | Comptabilité | Bloquant | 1 j | ☐ |
| 6 | Le cache local dépasse le quota du navigateur en un trimestre de boutique et l'application cesse de fonctionner hors ligne sans le dire | tous | Hors ligne | Bloquant | 3 j | ☐ |
| 7 | Se déconnecter avec des ventes non envoyées les efface | tous | Hors ligne | Bloquant | 0,5 j | ☐ |
| 8 | Un ticket renvoyé après une réponse réseau perdue reste bloqué « en attente » pour toujours | tous | Hors ligne | Majeur | 0,5 j | ☐ |
| 9 | Les encaissements d'avance (abonnements, carnets, inscriptions, traitements en plusieurs séances) entrent en résultat le jour de la vente : 20 à 127 millions de faux bénéfice par an mesurés | coach, école, dentiste, conseil | Comptabilité | Majeur | 3 j | ☐ |
| 10 | Les dépôts de garantie entrent en chiffre d'affaires et leur restitution en charge : aucune dette envers les clients au bilan | location | Comptabilité | Majeur | 2 j | ☐ |
| 11 | Un billet vendu pour une compagnie entre en chiffre d'affaires pour son prix total et la TVA est calculée dessus | agence de voyages, transport | Comptabilité, fiscalité | Majeur | 2 j | ☐ |
| 12 | Aucun retour ni avoir : reprendre un article vendu est impossible sans passer par une extourne qui ne remet pas le stock | commerce | Point de vente | Majeur | 2 j | ☐ |
| 13 | Tout achat réceptionné est payé depuis la caisse : un achat réglé par virement met la caisse sous zéro | tous avec stock | Comptabilité | Majeur | 1 j | ☐ |
| 14 | Un seul taux de taxe par entreprise : impossible d'avoir 5,5 % sur l'alimentaire et 20 % sur le reste, ni deux taxes cumulées (Canada, États-Unis, Inde) | France, Royaume-Uni, Canada, États-Unis, Inde | International, fiscalité | Majeur | 3 j | ☐ |
| 15 | Acompte sur devis impossible ; à la conversion, le total est encaissé et l'acompte compté deux fois | plombier, artisans, événementiel | Point de vente | Majeur | 1,5 j | ☐ |
| 16 | Les prestations ont un stock qui descend sous zéro dès qu'un salon ou un garage suit ses produits | salon, garage, plombier, dentiste | Point de vente | Majeur | 1 j | ☐ |
| 17 | Le propriétaire renvoie l'état complet (16 Mo à un an, 80 Mo pour une supérette) tous les 300 événements ; sans lui, aucun instantané n'est jamais pris | tous | Hors ligne | Majeur | 2 j | ☐ |
| 18 | Deux appareils hors ligne donnent le même numéro à deux tickets ; l'un change de numéro après synchronisation | commerce multi-caisses | Hors ligne, fiscalité | Majeur | 1 j | ☐ |
| 19 | L'IA peut affirmer un montant qui n'est pas dans le résumé qu'elle reçoit (40 articles, 5 ventes, 10 dettes) | tous | Assistant | Majeur | 1 j | ☐ |
| 20 | L'accueil et l'IA disent « résultat » alors que c'est « encaissé » : en mode Simple, la commerçante lit un bénéfice qui n'en est pas un | services | Design | Majeur | 1 j | ☐ |
| 21 | Ni lot, ni péremption, ni traçabilité : rappel de lot et casse impossibles à anticiper | pharmacie, jus, alimentaire | Métier | Majeur | 3 j | ☐ |
| 22 | Pas de numéro de série par unité : garantie et SAV sans rattachement | électronique | Métier | Majeur | 2 j | ☐ |
| 23 | Travaux en cours et factures à établir n'existent pas : une réparation à cheval sur la clôture fausse l'exercice | garage, artisans, conseil | Comptabilité | Majeur | 2 j | ☐ |
| 24 | Stock vivant : l'aliment part en charge, la bande en cours vaut son prix de poussin au bilan, la ponte entre en produit par ajustement | élevage | Comptabilité | Majeur | 2 j | ☐ |
| 25 | Aucun seuil fiscal (SMT / Système Normal, franchise de TVA, IGS → réel) et pas de DSF : l'application ne prévient jamais d'un changement de régime | tous, OHADA | Fiscalité | Majeur | 3 j | ☐ |
| 26 | La dotation aux amortissements n'est pas proposée à la clôture : oubliée, le résultat est surestimé de 1,2 million par sono et par an | événementiel, tous avec matériel | Comptabilité | Majeur | 0,5 j | ☐ |
| 27 | Le propriétaire peut supprimer l'espace et tout son journal d'un coup (suppression en cascade) | tous | Sécurité | Majeur | 0,5 j | ☐ |
| 28 | Le caissier lit toutes les données de l'espace (salaires, marges, dettes), le menu ne cache que les écrans | tous | Sécurité | Majeur | dire 0,5 j ; corriger 10 j | ☐ |
| 29 | Consommables à prix zéro jamais sortis du stock : le stock au bilan gonfle d'un achat à l'autre | dentiste, santé, restaurant | Comptabilité | Majeur | 1 j | ☐ |
| 30 | Une vente à zéro produit une écriture vide et un trou de numérotation dans le FEC | tous | Comptabilité | Mineur | 0,5 j | ☐ |
| 31 | Créances et immobilisations reprises en à-nouveaux ne sont ni des dettes clients ni des immobilisations dans l'application | reprise d'entreprise | Comptabilité | Mineur | 1,5 j | ☐ |
| 32 | La ligne de vente porte son propre coût : un appareil à fiche article ancienne sort le stock à un coût périmé | tous avec stock | Moteur | Mineur | 0,5 j | ☐ |
| 33 | Tiers payant : la vente à crédit au nom de l'assureur ne relie pas l'acte au patient, pas de bordereau par assureur | pharmacie, dentiste, santé | Métier | Mineur | 2 j | ☐ |
| 34 | Pas de fiche technique ni de nomenclature : marge réelle par plat ou par bouteille inconnue | restaurant, jus, production | Métier | Mineur | 3 j | ☐ |
| 35 | Le moteur local compte « cette année » depuis le 1er janvier même pour un exercice avril→mars | Royaume-Uni, Afrique du Sud, Éthiopie | Assistant | Mineur | 0,5 j | ☐ |
| 36 | Format des dates et des nombres lié à la langue (fr-FR / en-GB), pas au pays | Canada, États-Unis, anglophones | International | Mineur | 0,5 j | ☐ |
| 37 | Les noms des clients débiteurs partent vers le service d'IA sans que l'écran le dise | tous | Assistant, sécurité | Mineur | 0,5 j | ☐ |
| 38 | Codes de compte SYSCOHADA à trois chiffres : le comptable veut « 0000 » derrière pour son logiciel | OHADA | Export | Mineur | 0,5 j | ☐ |
| 39 | Pas d'écart de change au règlement d'une facture en devise | import-export | Comptabilité | Mineur | 1 j | ☐ |
| 40 | Le journal d'audit s'arrête à 3 000 lignes (un mois de supérette) | commerce à volume | Moteur | Mineur | 0,5 j | ☐ |
| 41 | Journal et grand livre trient 200 000 lignes à chaque affichage pour en montrer 20 | tous, à long terme | Design | Mineur | 1 j | ☐ |
| 42 | Le manuel ne dit pas quoi faire d'un acompte, d'une caution, d'un abonnement | services | Documentation | Mineur | 1 j | ☐ |

## Ce qui a tenu

Pour que la liste ne cache pas l'essentiel : sur 21 entreprises et dix ans (cinq pour la supérette), balance, bilan, clôture, report à nouveau, taxe déclarée et FEC sont restés justes à chaque horizon ; les exercices décalés (Royaume-Uni, Afrique du Sud, Éthiopie) se clôturent bien ; le précompte IGS, les frais d'approche, les immobilisations et la paie font ce qu'ils doivent ; aucune devise n'est jamais supposée. Les casses sont dans le volume, la synchronisation, les droits, et dans ce que le produit ne sait pas encore représenter (encaissements d'avance, dépôts, tiers, retours, lots).
