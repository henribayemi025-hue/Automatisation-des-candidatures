# Manuel d'utilisation — Finjaro Accounting

Ce manuel explique, écran par écran, comment tenir sa caisse, son stock, son personnel et sa comptabilité avec Finjaro Accounting. Il est écrit pour la personne qui tient le commerce, pas pour un informaticien. Chaque section dit à quoi sert l'écran, comment faire pas à pas, et ce que l'application écrit en comptabilité à votre place.

## 1. Premiers pas

### 1.1 Ouvrir l'application

- Sur ordinateur ou téléphone, ouvrez l'adresse de l'application dans le navigateur.
- Pour la voir sans rien créer : cliquez **Voir une démonstration**, choisissez votre pays puis votre métier. Les chiffres sont des exemples gardés sur votre appareil, vous pouvez tout modifier.
- Pour travailler pour de vrai : **Créer mon compte** avec votre nom, votre numéro de téléphone ou votre e-mail, et un mot de passe. Vous pouvez aussi vous connecter avec Google.

### 1.2 Le premier réglage

À la création du compte, l'application demande :

1. **Le nom de l'entreprise.**
2. **Le pays.** Il fixe la devise, la taxe (TVA ou autre) et le plan comptable proposés. Tout se change ensuite dans Paramètres.
3. **L'activité** : boutique, restaurant, salon, garage, services, pharmacie, téléphonie, import-export, autre. L'application adapte ses mots : « Carte » pour un restaurant, « Prestations » pour un salon, « Marchandises » pour un import-export.
4. **Le mode** : *Simple* montre seulement les écrans du quotidien ; *Expert* ajoute la comptabilité (journal, balance, bilan, TVA, clôture). Le mode se change à tout moment dans Paramètres.

### 1.3 Se repérer

- **À gauche** (ou en bas sur téléphone) : le menu. Quatre groupes : *Ma boutique* (ou *Mon activité*), *Mon argent*, *Comptabilité* (mode expert), *Plus*.
- **En haut** : la recherche (touche Ctrl K), le nom de votre espace, votre compte. Depuis votre compte : thème clair ou sombre, visite guidée, ce manuel, paramètres, équipe, déconnexion.
- **En bas à droite** : l'Assistant. Il répond à vos questions avec vos chiffres.
- **En tête de chaque écran** : un bandeau « À quoi ça sert » avec un exemple. Fermez-le quand vous n'en avez plus besoin.

### 1.4 La visite guidée

Elle se lance toute seule la première fois, et depuis le menu du compte ensuite. Huit écrans, deux phrases chacun : accueil, vente, articles, achats, personnel, TVA, états financiers, paramètres.

## 2. L'accueil

### À quoi ça sert

Savoir où on en est, en un coup d'œil : six chiffres comparés à la période d'avant.

| Carte | Ce qu'elle dit |
| --- | --- |
| Chiffre d'affaires | Ce que vous avez vendu sur la période, nombre de ventes et panier moyen |
| Marge brute | Ce qui reste après le coût des marchandises vendues |
| Résultat | Marge moins toutes les charges : ce que vous avez vraiment gagné |
| Trésorerie | L'argent disponible : caisse, mobile money, banque |
| Créances clients | Ce qu'on vous doit, et depuis combien de temps |
| Dettes fournisseurs | Ce que vous devez, et la valeur du stock |

### Comment faire

- **Changer la période** : les boutons en haut à droite (mois en cours, année en cours, 30 jours, etc.).
- **Voir le détail** : cliquez une carte. Chiffre d'affaires ouvre les ventes, Trésorerie ouvre le livre de caisse, Créances ouvre les dettes et crédits.
- **Sous les cartes**, trois onglets : *Courbe* (recettes, dépenses et trésorerie jour par jour), *Meilleures ventes*, *À traiter* (ruptures, créances anciennes, caisse à clôturer).
- **Les quatre boutons** en bas : Vendre, Dépense, Achat, Rattrapage.

## 3. Vendre (Point de vente / Encaisser / Facturer)

### À quoi ça sert

Enregistrer une vente au comptoir. Une seule action met à jour la caisse, le stock et la comptabilité.

### Pas à pas

1. Ouvrez **Vendre**.
2. Ajoutez les articles : cliquez une tuile, ou scannez un code-barres (un lecteur USB ou Bluetooth marche sans réglage), ou tapez un nom dans la recherche.
3. Dans le **panier**, ajustez les quantités avec − et +.
4. Facultatif : choisissez un **client** (bouton *Identifier*), un **projet**, une **remise**.
5. Choisissez le **paiement** : espèces, mobile money, carte, virement, ou crédit (à terme).
6. Pour un crédit, choisissez le client et indiquez l'acompte reçu. Le reste devient une créance.
7. Cliquez **Valider**. Le **ticket** s'affiche : lignes, total, montant payé. Vous pouvez l'**imprimer** (format ticket 80 mm) ou l'**envoyer sur WhatsApp**.
8. **Vente suivante** referme le ticket et vide le panier.

### Devis

Le bouton **Devis** à côté de Valider enregistre le panier comme un devis : rien n'est encaissé, rien ne sort du stock. Le devis attend dans l'écran *Devis*, où on le convertit en vente quand le client confirme.

### Mettre un ticket en attente

Si un client part chercher de l'argent, cliquez **Mettre en attente**. Le panier est gardé (jusqu'à 20 tickets) et se reprend d'un clic.

### Ce que ça écrit en comptabilité

- Débit caisse (ou mobile money, banque, clients pour un crédit) ; crédit ventes ; crédit TVA collectée si la taxe est activée.
- Pour les métiers avec stock : débit coût des marchandises vendues, crédit stock, au coût moyen pondéré de l'article.

## 4. Caisse (session de caisse)

### À quoi ça sert

Savoir, chaque soir, s'il manque de l'argent dans le tiroir.

### Pas à pas

1. Le matin : **Ouvrir la caisse** en déclarant le fond de caisse (les espèces de départ).
2. Vendez normalement.
3. Le soir : **Clôturer la caisse**. Comptez les espèces et saisissez le montant. L'application calcule ce qu'il devrait y avoir (fond + ventes en espèces − dépenses en espèces) et affiche l'écart.
4. Un manquant ou un excédent passe automatiquement en écriture (charge ou produit divers).

L'**historique des sessions** garde chaque journée.

## 5. Rattrapage

### À quoi ça sert

Enregistrer plusieurs jours d'un coup, pour qui ne saisit pas tous les jours.

### Trois façons

- **À la main** : un tableau, une ligne par opération (vente, dépense), la date de chaque ligne, le paiement. Validez le tout d'un coup.
- **Depuis un relevé** : collez le texte d'un relevé mobile money ou bancaire. L'application reconnaît les lignes, vous cochez celles à garder, vous choisissez pour chacune vente ou dépense.
- **Photo d'une facture** : photographiez une facture ou un reçu, l'assistant pré-remplit la dépense (compte connecté nécessaire).

### Reprise d'un bilan existant

Si vous aviez déjà une comptabilité, saisissez vos soldes de départ (matériel, stock, créances, caisse, banque, dettes) : l'application passe l'écriture d'à-nouveaux et le bilan repart de là. Vous pouvez aussi glisser le PDF de votre ancien bilan et laisser l'assistant proposer les soldes.

## 6. Produits, Carte, Prestations, Marchandises

### À quoi ça sert

La liste de ce que vous vendez, avec prix, coût, marge et stock.

### Pas à pas

1. **Nouvel article** : nom, référence, code-barres (facultatif), catégorie, prix de vente, coût d'achat, seuil de réapprovisionnement.
2. **Import** : un fichier Excel ou CSV importe toute la liste d'un coup.
3. Pour un métier sans stock (salon, artisan), les prestations n'ont pas de quantité.
4. Le **coût** suit les réceptions d'achats : c'est un prix moyen pondéré, recalculé à chaque entrée.
5. Un article qui ne se vend plus s'**archive** : il disparaît des écrans, son historique reste.

## 7. Stock

- **Mouvements** : chaque entrée (réception, ajustement) et sortie (vente, casse), avec la date et l'origine.
- **Alertes** : ruptures et articles sous le seuil.
- **Valorisation** : la valeur du stock au coût moyen, article par article.
- **Ajuster** : après un inventaire, saisissez la quantité comptée et le motif (écart d'inventaire, casse, vol). L'écart passe en écriture.

## 8. Achats

### À quoi ça sert

Commander à un fournisseur, puis réceptionner : le stock et la dette fournisseur se mettent à jour à la réception, pas avant.

### Pas à pas

1. **Nouveau bon de commande** : fournisseur, lignes (article, quantité, prix unitaire), paiement (comptant ou à crédit).
2. Quand la marchandise arrive : **Réceptionner**. Le stock entre, le coût moyen se recalcule, la dette fournisseur (ou la sortie de trésorerie) s'écrit.
3. Un achat payé plus tard se règle dans *Dettes & crédits*.

### Achat à l'étranger

Cochez **Achat à l'étranger** : saisissez la facture dans sa devise et le taux de change. Ajoutez les **frais d'approche** (transport, douane, transit, assurance) et la **TVA payée à la douane**. Les frais entrent dans le coût du stock ; la TVA de douane est déductible. Aucune TVA locale n'est calculée sur une facture étrangère.

## 9. Clients & fournisseurs

- Une fiche par tiers : nom, téléphone, e-mail, adresse.
- Le **solde** en cours (ce qu'il vous doit ou ce que vous lui devez) s'affiche sur la fiche.
- Une fiche utilisée ne se supprime pas : elle s'archive, pour garder l'historique.
- Au comptoir, un client sans fiche est un **client passager** ; on n'a pas à en créer une.

## 10. Ventes et Devis

- **Ventes** : l'historique de toutes les ventes, avec filtre par période, statut et paiement. Cliquez une ligne pour le détail et le ticket.
- **Devis** : les devis en attente. **Convertir en vente** encaisse et déstocke à ce moment-là.
- Une vente enregistrée par erreur ne s'efface pas : dans *Journal des écritures*, **Extourner** son écriture la contre-passe. L'historique reste complet.

## 11. Dettes & crédits

### À quoi ça sert

Suivre ce que les clients vous doivent et ce que vous devez aux fournisseurs.

### Pas à pas

1. Onglet **Clients** ou **Fournisseurs**.
2. Pour chaque dette : montant initial, déjà réglé, reste, âge.
3. **Enregistrer un règlement** : montant et moyen de paiement. Un règlement partiel est possible.
4. **Relancer sur WhatsApp** ouvre un message prêt avec le montant dû.

## 12. Projets

Pour suivre à part un chantier, une ouverture, un événement : budget, opérations rattachées (ventes, dépenses, achats), marge du projet. On rattache une opération à un projet dans le champ *Projet* de chaque formulaire.

## 13. Dépenses

### Pas à pas

1. **Nouvelle dépense** : date, poste (loyer, électricité, transport, salaires, etc.), description, montant, moyen de paiement, projet facultatif.
2. **Enregistrer la dépense** : l'écriture est passée immédiatement.

### Une caisse n'est jamais négative

Si le compte choisi (caisse, mobile, banque) n'a pas assez d'argent à cette date, l'application le dit avant d'enregistrer. Enregistrez d'abord l'argent entré (vente, apport, retrait de la banque vers la caisse), ou choisissez un autre moyen de paiement. Vous pouvez forcer, mais l'audit signalera le solde négatif.

## 14. Résultats et Documents

- **Résultats** : chiffre d'affaires, marge, charges et résultat par période ; meilleures ventes ; dépenses par poste.
- **Documents** : rapports imprimables ou enregistrables en PDF depuis le navigateur — ventes, dépenses, stock, bilan, compte de résultat, balance, journal, grand livre. Le **FEC** (fichier des écritures comptables) s'exporte ici, au format demandé en cas de contrôle.

## 15. Livre de caisse

Tous les flux de trésorerie, compte par compte (caisse, mobile money, banque) : entrées, sorties, solde jour par jour. C'est l'écran à montrer quand on demande « où est passé l'argent ».

## 16. Personnel

### Pas à pas

1. **Les personnes** : ajoutez chaque employé avec son poste et son mode de paie (au mois, à la journée, à l'heure) et le montant.
2. **Pointer une journée** : pour ceux payés à la journée ou à l'heure, cochez les présents.
3. **Avance** : une avance sur salaire est une créance sur l'employé, pas une charge.
4. **Paie** : à la fin du mois, l'application calcule le brut (fixe ou présences × taux), déduit les avances, et propose le net. **Enregistrer la paie** passe l'écriture : charge de personnel au brut, avance soldée, net sorti de la caisse.

## 17. Immobilisations

### À quoi ça sert

Un bien qui sert plusieurs années (congélateur, ordinateur, véhicule, agencement) n'est pas une dépense du mois : on passe un morceau en charge chaque mois.

### Pas à pas

1. **Nouveau bien** : nom, catégorie, date d'acquisition, coût, durée (en mois), valeur résiduelle. La catégorie choisit le compte : matériel et outillage (241), informatique (2442), mobilier (2444), transport (245), bâtiments (231) en SYSCOHADA.
2. **Passer la dotation du mois** : l'application calcule la dotation de chaque bien et propose l'écriture (dotations aux amortissements / amortissements cumulés du compte correspondant).
3. **Sortir un bien** (vente ou mise au rebut) : l'écriture reprend le coût et les amortissements ; l'écart passe en perte ou en gain.

## 18. Comptabilité (mode expert)

### 18.1 Journal des écritures

Toutes les écritures en partie double, générées par l'application ou saisies à la main. Filtre par journal (ventes, achats, caisse, opérations diverses) et par période. **Écriture manuelle** : date, journal, libellé, lignes débit/crédit ; l'écriture doit être équilibrée pour être enregistrée. **Extourner** contre-passe une écriture fausse. **Excel** exporte pour le cabinet.

### 18.2 Grand livre

Le détail d'un compte : chaque mouvement, avec le solde après chaque ligne. Choisissez le compte, la période.

### 18.3 Balance générale

Deux présentations :

- **Six colonnes** : solde d'ouverture (débit, crédit), mouvements de la période (débit, crédit), solde de clôture (débit, crédit). Le solde d'ouverture est tout ce qui précède la date « Du ».
- **Débit, crédit, solde** : les totaux et le solde de chaque compte.

Les totaux débit et crédit doivent être égaux ; le contrôle est affiché en permanence.

### 18.4 Bilan et compte de résultat

Calculés depuis les écritures. Le compte de résultat sur la période ; le bilan à une date. L'équilibre actif = passif + capitaux + résultat est vérifié.

### 18.5 Plan comptable

Le référentiel (SYSCOHADA, PCG français ou générique) se choisit dans Paramètres ; les numéros suivent. Les comptes système ne se suppriment pas ; vous pouvez ajouter des comptes.

### 18.6 Déclaration de TVA

Par période : TVA collectée sur les ventes, TVA déductible sur les achats et la douane, net à reverser ou crédit à reporter. Chaque ligne renvoie à une écriture du journal.

### 18.7 Rapprochement bancaire

Saisissez le solde du relevé à la date « Au », pointez les lignes qui figurent sur le relevé. L'écart restant est ce qui n'est pas encore passé en banque.

### 18.8 Clôture de l'exercice

À la fin de l'année comptable : l'application solde les charges et produits, dégage le résultat, et passe le report à nouveau (créditeur en cas de bénéfice, débiteur en cas de perte) au premier jour de l'exercice suivant. Un exercice clos est verrouillé : plus aucune écriture ne peut s'y ajouter. **Rouvrir** annule la clôture si nécessaire.

### 18.9 Audit

Sept contrôles : équilibre des écritures, équation du bilan, comptes de trésorerie négatifs, stock négatif, écritures sans pièce, écritures hors exercice, etc. Une anomalie renvoie à l'écran qui permet de la corriger.

## 19. Historique, Équipe, Discussion

- **Historique** : qui a fait quoi et quand, chaque action de chaque membre.
- **Équipe** : invitez des membres (propriétaire, gérant, caissier, comptable). Chaque rôle voit et fait ce qui lui revient. Nécessite un compte connecté.
- **Discussion** : le fil de l'équipe, général ou par projet, avec photos. Mentionnez @assistant pour lui poser une question au milieu de la conversation.

## 20. Assistant

Posez vos questions en langage courant : « Quel est mon chiffre d'affaires ce mois ? », « Qui me doit de l'argent ? », « Combien j'ai dépensé en transport ? ». Il répond avec vos chiffres. Avec un compte connecté, il lit aussi les photos de factures et les PDF de bilan.

## 21. Paramètres

- **Langue** : français ou anglais.
- **Entreprise** : nom, pays, ville, devise, taxe (activée ou non, taux, nom), plan comptable, début de l'exercice.
- **Activité** : change les mots de l'application ; **Gérer un stock** se coche ou se décoche.
- **Mode** : simple ou expert.
- **Apparence** : clair, sombre, système.
- **Mon compte** : se déconnecter.
- **Données** : charger la démonstration, tout réinitialiser (irréversible).

## 21 bis. Régime d'imposition et précompte sur achat

Au Cameroun comme dans plusieurs pays, toutes les entreprises ne facturent pas la TVA. L'application le sait : le **régime d'imposition** se choisit à l'inscription et se change dans Paramètres.

| Régime | Ce que fait l'application |
| --- | --- |
| Régime du réel | La TVA est facturée sur les ventes, déduite sur les achats et la douane, déclarée dans *Déclaration de TVA* |
| Impôt général synthétique (IGS) | Aucune TVA : ni sur les tickets, ni sur les achats. L'écran de déclaration disparaît du menu |
| Non assujetti / autre | Aucune taxe |

### Le précompte sur achat (IGS)

Quand un fournisseur, souvent un grossiste, retient un précompte sur sa facture :

1. Dans Paramètres, régime IGS, saisissez le **taux** habituel (demandez-le à votre fiscaliste : il dépend de votre régime et de celui du fournisseur).
2. Dans chaque bon de commande, le précompte est proposé à ce taux, modifiable facture par facture ; le montant s'affiche.
3. À la réception, l'écriture est : stock au coût des marchandises (sans le précompte), **État — acomptes et précomptes d'impôt (4492)** au débit pour le précompte, fournisseur au crédit pour le total dû.

Le précompte n'est ni une charge ni un coût du stock : c'est de l'argent déjà versé à l'État, qui viendra en moins de votre impôt. Son cumul s'affiche dans l'écran *Déclaration de TVA* (qui explique alors qu'il n'y a pas de TVA à déclarer).

## 22. Questions fréquentes

**J'ai validé une vente et rien ne s'est passé.** Le ticket s'affiche par-dessus l'écran ; sur téléphone, il apparaît en bas. Si vous ne le voyez pas, la vente est quand même dans *Ventes*.

**La caisse affiche un solde négatif.** Une dépense a été enregistrée avant l'argent qui l'a payée. Enregistrez l'entrée manquante (apport, vente, retrait de la banque) à la bonne date, ou corrigez le moyen de paiement de la dépense.

**Je veux corriger une vente.** On n'efface pas : on extourne l'écriture dans le journal (mode expert), puis on enregistre la bonne vente. L'historique reste complet.

**Mon comptable veut mes écritures.** *Journal* → Excel, ou *Documents* → FEC. La balance à six colonnes s'exporte aussi en Excel.

**Je change de plan comptable.** Paramètres → plan comptable. Les numéros de compte changent, les écritures existantes gardent les leurs.

**Je travaille sans compte.** Les données restent sur l'appareil. Créez un compte pour les sauvegarder en ligne et travailler à plusieurs.
