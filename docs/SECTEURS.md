# Comment chaque métier se gère — et ce que Finjaro Accounting en fait

Beau a demandé de partir de la réalité de chaque métier avant de construire.
Ce document dit, pour chaque profil : comment ça se passe sur le terrain,
ce que l'application fait déjà pour lui, et ce qu'il reste à faire.
Les points « à faire » sont repris dans FEUILLE-DE-ROUTE.md.

## 1. La boutique de quartier (Cameroun, Sénégal, Côte d'Ivoire…)

**Terrain.** Une ou deux personnes, ventes au comptant en espèces et mobile
money, quelques clients fidèles servis à crédit (« je paie fin du mois »),
approvisionnement chez un grossiste réglé souvent en plusieurs fois, stock
compté à l'œil, cahier de dettes. Le fisc attend au minimum le Système
Minimal de Trésorerie (SMT) tant que le chiffre d'affaires reste sous le
seuil ; au-delà, le Système Normal avec DSF. TVA 19,25 % au Cameroun
(17,5 % + centimes additionnels communaux), 18 % dans l'UEMOA.

**Fait.** Point de vente client passager sans fiche ; vente à crédit avec
client identifié et relance WhatsApp ; achats reçus et réglés en plusieurs
fois (dette fournisseur) ; stock et seuils de réappro ; caisse ouverte /
fermée avec écart ; rattrapage par relevé mobile money ; profil pays
SYSCOHADA + taux ; mode simple qui cache la comptabilité.

**À faire.** Paiement mobile money déclenché depuis la caisse (USSD push +
confirmation) ; ventilation automatique 17,5 % / centimes ; états SMT et
préparation de la DSF ; tickets de caisse imprimés (ESC/POS).

## 2. Le supermarché ou la supérette (Cameroun et ailleurs)

**Terrain.** Plusieurs caisses, scanner à chaque poste, milliers de
références avec codes EAN, rotation rapide, plusieurs caissiers avec fond de
caisse et clôture par caissier, retours et casse, promotions, inventaires
tournants. Paiements mixtes (une partie espèces, une partie mobile money).

**Fait.** Scanner clavier reconnu partout dans l'écran de vente, ajout
instantané au panier, code inconnu signalé ; recherche par référence ;
tickets en attente ; historique des tickets par numéro, montant, article ;
casse et écart d'inventaire ; import du catalogue en Excel.

**À faire.** Plusieurs caisses simultanées avec une session par caissier ;
paiement mixte sur un même ticket ; mode « retour » avec avoir ; règles de
remise et code superviseur ; étiquettes et codes internes pour le vrac ;
articles au poids ; vente hors ligne avec resynchronisation.

## 3. Le restaurant, le snack, le traiteur

**Terrain.** On ne vend pas ce qu'on achète : un plat est un assemblage
d'ingrédients (riz, huile, poulet…). La marge se joue sur la recette. Les
tables ouvrent une addition qu'on partage parfois, les pourboires passent
par le personnel, les événements (mariages) sont des projets avec acompte.

**Fait.** Vente de « plats » comme produits, dépenses par poste, projets
(un événement = un projet avec budget, achats et recettes rattachés),
devis puis facture avec acompte.

**À faire.** Fiches recettes (nomenclature) qui décrémentent les ingrédients
à chaque plat vendu ; tables et additions ouvertes, partage d'addition ;
pourboires en dette envers le personnel ; envoi en cuisine (écran ou
imprimante).

## 4. Le garage, l'artisan, le prestataire

**Terrain.** Un devis par intervention, des pièces achetées pour le client
et de la main-d'œuvre, un acompte à la commande, le solde à la livraison.
Le chiffre d'affaires est surtout de la prestation (compte 706), pas de la
marchandise.

**Fait.** Devis → facture, acompte et reste dû, projets par chantier ou
intervention, achats rattachés au projet, marge par projet.

**À faire.** Ligne « main-d'œuvre » distincte des pièces (706 vs 701) sur
la facture ; suivi du temps passé ; véhicule ou matériel du client sur le
devis.

## 5. Le vendeur ambulant, la petite activité sans local

**Terrain.** Pas de stock formel, pas d'ordinateur, tout se passe sur le
téléphone et par messages vocaux ; les jours sans saisie sont la règle.

**Fait.** Application qui tient sur un téléphone ; ventes au montant libre
sans produit ; rattrapage jour par jour ; relevé mobile money collé ; rappel
après trois jours ; assistant qui lit une photo de reçu.

**À faire.** Dictée vocale (« j'ai vendu trois chemises à 5 000 ») ;
réception des messages WhatsApp dans l'application (API WhatsApp Business).

## 6. La PME en France

**Terrain.** Plan comptable général, TVA à plusieurs taux (20, 10, 5,5,
2,1), expert-comptable qui attend un export propre, obligations de
caisse (inaltérabilité, NF525), facturation électronique à venir
(Factur-X), Fichier des Écritures Comptables (FEC) pour l'administration.

**Fait.** Profil France (PCG, TVA 20 %), écritures inaltérables corrigées
uniquement par extourne, journal, grand livre, balance, bilan, exports
Excel, rôle comptable en lecture.

**À faire.** Taux de TVA par article ; export FEC ; Factur-X ; clôture
d'exercice avec à-nouveaux automatiques ; immobilisations et amortissements
planifiés ; rapprochement bancaire assisté.

## 7. L'entreprise qui existait déjà (tous pays)

**Terrain.** Elle a des années d'historique dans un cahier, un autre
logiciel ou chez son comptable. Elle ne ressaisira jamais tout.

**Fait.** Reprise d'un bilan existant : soldes d'ouverture à une date,
ou import de la balance de l'ancien logiciel, écriture d'à-nouveaux
équilibrée.

**À faire.** Lecture d'un bilan en PDF ou en photo par l'assistant, avec
contrôle actif = passif avant proposition.

## 8. La grande entreprise, le groupe

**Terrain.** Plusieurs sociétés ou magasins, consolidation, comptabilité
analytique par centre de coût, circuits de validation, accès par rôle
fin, API vers d'autres systèmes.

**Fait.** Rôles (propriétaire, gérant, caissier, comptable), projets comme
premier niveau d'analytique, historique complet, exports.

**À faire.** Plusieurs espaces par compte et sélecteur de société ;
consolidation multi-sociétés et multi-devises ; validation à deux niveaux ;
API ouverte ; double authentification pour les rôles sensibles.

## Ce qui est commun à tous

- Sur ordinateur : densité, chiffres alignés, comparaisons MTD / YTD,
  clic vers le détail. Sur téléphone : mêmes chiffres, disposés en colonne.
- Aucun chiffre inventé. Aucune monnaie supposée d'après le pays.
- Rien ne s'efface : on extourne, on garde la trace.
- L'assistant parle la langue de la personne et ne dit jamais qu'une chose
  est faite quand elle ne l'est pas.
