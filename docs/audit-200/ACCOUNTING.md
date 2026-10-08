# Audit Accounting — part du grand audit du 07/10/2026

Demandé par Beau (« go, tout »), part Accounting confiée à Claudinette par Alpha.
Version auditée : celle en ligne le 07/10 (526d24a, puis 9e64f44), construite et servie à l'identique en local.

## Ce qui a été fait, et ce qui ne l'a pas été

- **Mesuré automatiquement : les 35 écrans**, à 390 px (téléphone) et 1 440 px (grand écran), dans la démonstration « Boutique, Cameroun » :
  - nombre de mots ;
  - mots visibles sans faire défiler ;
  - hauteur des champs et des boutons ;
  - débordements de page et de tableau ;
  - erreurs JavaScript.
- **Trois familles de parcours**, déroulées au clic dans un navigateur :
  1. la commerçante débutante, qui part de zéro sans compte ;
  2. la comptable, qui contrôle journal, balance, états et TVA ;
  3. le porteur de projet, sur l'écran Projets.
- **Pas fait.** La liste des 200 profils n'était pas encore sur la branche staging de la place de marché (`docs/audit-200/profils.md` introuvable à 14 h 40 UTC). Les trois familles ci-dessus sont donc les miennes, pas des profils de la liste.
- **Aucun vrai compte créé**, rien envoyé à personne. Tout s'est passé dans la démonstration et en mode « sans compte », sur l'appareil de test.
- **Finia et la lecture des photos n'ont pas été testées.** Google refuse (crédits épuisés), et le secours Groq attend l'essai de Beau avec un vrai compte.

Les captures sont dans `docs/audit-200/captures/`.

## Classement, du plus grave au moins grave

### 1. GRAVE — à trancher par Beau : le régime fiscal proposé à une débutante est « le réel », avec TVA

**Le lien de causalité :**
1. Une commerçante choisit « Cameroun » à l'installation.
2. Accounting choisit pour elle « Régime du réel », TVA 19,25 % : c'est la règle actuelle, dès que le pays a une TVA.
3. Chacune de ses ventes est alors coupée en deux. Exemple vu dans la démonstration : une vente de 24 400 FCFA devient 20 461 FCFA de chiffre d'affaires et 3 939 FCFA de « TVA collectée ».
4. Elle voit donc un chiffre d'affaires plus bas que ce qu'elle a encaissé, et une dette de TVA qu'elle ne doit sans doute pas : une petite boutique relève souvent d'un régime simplifié (l'IGS au Cameroun).

**Ce qu'il lui faudrait :** un régime proposé par défaut qui ne fabrique pas de TVA, ou une question simple avant de choisir. L'option IGS existe déjà dans la liste.

**Pourquoi je ne l'ai pas changé :** c'est un choix fiscal, pays par pays. Je ne mets pas de seuil de chiffre d'affaires sans source sûre.

**Proposition :** par défaut, « Je ne sais pas encore — sans TVA », avec la phrase « À confirmer avec votre comptable ». Le réel reste à un geste.

Capture : `p1-02-entreprise.png`.

### 2. GRAVE — corrigé : une promesse fausse sur la page de connexion

**Le lien de causalité :**
1. Une vendeuse arrive depuis la place de marché.
2. Elle lisait : « vos ventes livrées sur Finjaro peuvent arriver dans votre caisse ».
3. Or aucun code ne fait arriver une commande dans la caisse aujourd'hui : la liaison attend toujours l'accord de Beau.

**Corrigé :** on ne promet plus que ce qui marche. « Même compte, rien à recréer : vos articles Finjaro se reprennent en un geste depuis l'écran Produits. »

### 3. MOYEN — corrigé : la carte d'un projet était illisible sur téléphone et tablette

**Le lien de causalité :**
1. Le porteur de projet ouvre Projets.
2. Les trois montants (Dépensé, Recettes, Marge) se chevauchaient : « 125 000 FCFA » ne tient pas dans un tiers d'écran.
3. Il ne pouvait pas lire sa marge, qui est la raison d'être de l'écran.

**Corrigé :** une ligne par montant, et trois colonnes seulement sur grand écran. Mesuré sans débordement à 390, 768 et 1 440 px.

Captures : `boutique-390-projets.png` (avant), `boutique-390-projets-carte-corrigee.png` (après).

### 4. MOYEN — corrigé : deux tableaux défilaient sur le côté

- **TVA, grand écran :** les deux tableaux (TVA collectée et TVA déductible) défilaient de 98 px, alors qu'ils n'ont que quatre colonnes. Ils prennent maintenant la largeur de leur carte. Mesuré : 0 px de débordement.
- **Ventes, téléphone :** 33 px de trop. Sur téléphone, le numéro de facture laisse la place au client, au total et au statut ; il reste visible dans le détail de la vente. Mesuré : 0 px.

Reste la caisse, avec 4 px de trop : toléré, invisible à l'œil.

### 5. MOYEN — proposé : des listes sans fin sur les écrans de consultation

**Ce qui a été mesuré dans la démonstration** (trois mois d'activité) :
- Journal : 615 écritures sur une seule page, soit 21 014 mots et 617 boutons.
- Ventes : 276 lignes.
- Stock : 5 535 mots.
- Historique : 3 023 mots.

**Le lien de causalité :**
1. Une comptable ouvre le journal sur un téléphone moyen.
2. Elle doit tout charger, puis tout faire défiler pour retrouver le mois en cours.
3. Un an d'activité, c'est quatre fois plus.

**Proposition :** afficher le mois en cours par défaut, avec « Voir plus ». Pas encore fait : ça touche les filtres et l'export Excel de plusieurs écrans, à faire un écran à la fois.

### 6. MOYEN — corrigé le 08/10 : la démonstration s'ouvre en mode expert

**Fait le 08/10 :**
- La démonstration s'ouvre en mode simple, avec « Voir la comptabilité complète » dans le bandeau (un geste pour revenir).
- Un lien direct vers un écran comptable (`/demo/<pays>/<métier>/journal`) ouvre en mode expert.
- Vérifié au clic, à 390 et 1 440 px. La visite guidée affiche toujours le bilan.
- Captures : `demo-390-bandeau.png`, `demo-1440-mode-simple.png`.

**Le lien de causalité :**
1. Une débutante clique « Ouvrir une démonstration ».
2. Elle voit les numéros de compte (70, SIG, 13, 411) devant chaque chiffre de l'accueil, et tout le menu comptable : journal, grand livre, balance.
3. Ce n'est pas ce qu'elle aura chez elle, où le mode simple masque tout ça.

**Proposition :** démonstration en mode simple, avec le bouton pour passer en expert.

### 7. PETIT — à trancher par Beau (style) : la taille des champs

- **Ce qui a été mesuré :** champs de 45 à 47 px de haut, sur téléphone comme sur ordinateur. Boutons de 36 à 45 px.
- **Sur téléphone, c'est juste :** un doigt a besoin de 44 px au moins.
- **Sur ordinateur, c'est grand :** les logiciels de gestion professionnels sont autour de 36 à 40 px.
- **Proposition :** 40 px sur grand écran seulement. C'est une touche du style de Beau, donc je ne le fais pas sans lui.

### 8. PETIT — la quantité de texte

**Ce qui a été mesuré :** sur téléphone, de 33 à 143 mots visibles sans défiler selon l'écran.
- Les plus chargés : Discussion (143), Assistant (122), Paramètres (106), Rattrapage (104).
- La plupart des écrans sont entre 45 et 90 mots.

**Ce qui pèse le plus :** le cadre « À quoi ça sert », en tête de chaque écran, prend environ un quart du premier écran d'un téléphone. Il se ferme d'une croix et ne revient pas.

**Verdict :** acceptable. À revoir seulement si les retours des commerçantes disent « trop de texte ».

### 9. PETIT — détails vus en passant

- **Projets :** l'étiquette « En cours » passe sur deux lignes sur téléphone.
- **Vendre :** sur téléphone, le texte d'aide de la recherche est coupé (« …ou tapez un n »).

## Ce qui marche bien (vérifié)

- **Premier accueil sans compte :** 4 étapes, 11 gestes, puis on arrive directement sur Vendre. « Vente rapide » est visible tout de suite, sans fiche article à créer. La devise se propose d'après le pays (FCFA pour le Cameroun), et elle est à confirmer.
- **Aucune erreur JavaScript** sur les 70 affichages : 35 écrans, en largeur téléphone et grand écran.
- **Aucune page ne défile sur le côté.** Les grands tableaux comptables défilent dans leur cadre, comme prévu.
- **Bilan et compte de résultat :** équilibre vérifié et affiché (« Actif = Passif + Capitaux + Résultat »). Journal : contrôle « Équilibré » affiché.
- **Sans connexion :** après une première ouverture, l'application s'affiche et travaille hors ligne. Les opérations attendent le réseau.
- **Ponts avec le reste de Finjaro :**
  - même compte annoncé à la connexion ;
  - sélecteur d'applications dans l'en-tête ;
  - relais de connexion depuis les autres applications (`/relais`) ;
  - Finia présente Léo avec son lien.
  - Le passage de Léo vers Accounting se teste côté Léo, donc chez Alpha.
- **Relance WhatsApp :** le bouton ne s'affiche plus que si le numéro est utilisable (corrigé ce matin).

## Ce qui a été corrigé pendant l'audit

Les points 2, 3 et 4 ci-dessus. Les 39 vérifications automatiques du dépôt passent.

## Ce qui attend Beau

1. **Le régime fiscal par défaut** (point 1).
2. **La taille des champs sur ordinateur** (point 7).
3. **L'essai de Finia par Groq**, avec son compte : poser une question et donner l'heure.
