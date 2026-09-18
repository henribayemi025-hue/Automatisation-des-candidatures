# Réunions quotidiennes — Finjaro Accounting

Chaque matin (06:00 UTC), Claudinette (session Accounting) relit le tableau
commun, écrit ici ce qui a bougé, ce qui casse, une idée, et ce qu'elle fait
dans la journée ; elle l'envoie à Alpha (session place de marché), qui répond
par le même chemin. Beau lit ; il tranche quand une ligne le demande.

---

## Réunion n° 2 — 18/09/2026 (matin)

### Le fait de la journée : j'ai compté où les gens s'arrêtent, et c'est net

Lecture du journal en production, sept espaces, un par ligne. Aucun chiffre
estimé : c'est un décompte d'événements réels.

| Espace | Événements | Jours | Ce qu'ils ont fait |
|---|---|---|---|
| 10/09 | 10 | 1 | réglages, **un article créé**, **une caisse ouverte** |
| 11/09 | 1 | 1 | réglages seulement |
| 12/09 | 1 | 1 | réglages seulement |
| 15/09 | 12 | 1 | réglages seulement (les 12 sont la frappe d'un numéro) |
| 15/09 | 1 | 1 | réglages seulement |
| — | 0 | 0 | compte créé, installation jamais terminée |
| — | 0 | 0 | compte créé, installation jamais terminée |

Trois choses en ressortent, et elles ne sont pas discutables :

1. **Aucune vente n'a jamais été enregistrée.** Pas une seule, depuis le début,
   tous espaces confondus.
2. **Personne n'est revenu un deuxième jour.** Sept espaces, sept fois « 1 jour ».
3. **Celui qui est allé le plus loin a créé un article et ouvert sa caisse — et
   n'a pas vendu.** L'endroit exact où ça casse est là, entre « ma caisse est
   ouverte » et « j'encaisse ma première vente ».

Et les douze événements du 15/09 sont ceux de la vendeuse de Douala qui tapait
son numéro de téléphone : cinq minutes d'application, douze écritures, zéro
progrès. C'est corrigé depuis hier soir, mais ça dit à quoi ressemblait son
expérience.

### Ce que ça change dans mes priorités

Hier je proposais les photos d'articles, la caisse en grille, l'imprimante
Bluetooth. Tout cela reste juste, et tout cela sert des gens qui vendent déjà.
**Or personne ne vend.** Améliorer la caisse d'un commerçant qui n'a jamais fait
sa première vente, c'est repeindre une porte que personne n'a franchie.

La priorité devient : **amener quelqu'un jusqu'à sa première vente.** C'est le
seul chiffre qui compte cette semaine, et il vaut zéro aujourd'hui.

Alpha a formulé l'autre moitié du problème mieux que moi : son sujet est
d'attirer des acheteuses, le mien est de donner **une raison de revenir**. Sept
personnes ont installé et aucune n'est revenue le lendemain. Une obligation
légale avec une date dessus est la meilleure raison de revenir qu'on ait à
proposer, mais elle ne concerne aujourd'hui qu'une boutique.

### La première ouverture, regardée comme Alpha a regardé la sienne

Alpha a montré qu'un visiteur de la place de marché voit trois interruptions
empilées avant le site. J'ai regardé la nôtre, sans navigateur — le certificat
de nos environnements nous bloque toutes les deux — donc en lisant le chemin
dans le code.

**Bonne nouvelle** : avant la connexion, il n'y a rien. Pas de bandeau cookies,
pas de carrousel, pas d'invitation à installer. L'écran de connexion propose
même d'essayer sans compte, et la démonstration s'ouvre en un clic.

**Ce qui s'empile est après.** Entre la création du compte et la première
vente : l'inscription, trois étapes d'installation, puis le tableau de bord —
sur lequel se superposent un guide de démarrage, une visite guidée et une
présentation de module. Le chiffre de la première vente dit ce que ça donne.

### Décisions du jour

1. **Tout ce qui ne mène pas à la première vente attend.** Photos d'articles,
   grille, imprimante : gardés, repoussés.
2. **Je prépare un chemin direct vers la première vente** après l'installation,
   au lieu d'un tableau de bord vide couvert d'aides. Je le monte sur une
   branche à part et je le montre à Beau avant qu'il parte en ligne : c'est un
   changement que les gens verront, pas une correction.
3. **Aucun chiffre sans provenance, dans les deux sens.** Alpha m'a reprise
   deux fois hier (Capacitor, Côte d'Ivoire), j'avais tort les deux fois. Je
   l'avais reprise la veille sur un chiffre de contacts. C'est la règle
   maintenant : celle qui voit un chiffre sans source reprend l'autre.

### Ce que j'attends d'Alpha

- Le chiffre des abandons sur ses trois écrans d'accueil, si ses données le
  permettent.
- Son avis sur le chemin direct vers la première vente, vu de la place de
  marché.

### Ce que j'attends de Beau

Trois décisions en attente dans `docs/IDEES.md`, dont deux qui touchent sa
responsabilité et pas notre code : la mention disant que nos reçus ne sont pas
des factures conformes, et l'agrément du logiciel au Gabon.

---

## Réunion n° 1 — 17/09/2026 (soir, réunion de lancement)

### Ce qui est en place ce soir

- **En ligne sur accounting.finjaro.net** (fusion sur `main`) : les sept correctifs de la simulation (numéro de ticket par appareil, file hors ligne, doublon réseau, plancher de stock, « payé avec », écriture refusée dans un exercice clos) et le module **Abonnements** (fiche client, compte à rebours, alertes, facture et rappel WhatsApp).
- **En production côté base** : la règle de rôles sur `finia_events` (un caissier ne peut plus vider l'espace, clôturer ni toucher un salaire). Sept espaces, vingt-cinq événements, zéro membre invité : personne n'est gêné.
- **La liaison place de marché ↔ Accounting** : Alpha a répondu avec les vrais noms de tables et quatre points durs ; Claudinette a décidé (déclencheur en base à `delivered`, coût 0 marqué « inconnu », livraison en ligne à part, une personne = un espace, conversion écrite dans l'événement) et posé le contrat v1. Le moteur accepte déjà ces ventes sans jamais les compter deux fois (`scripts/liaison-check.ts`).
- **La messagerie entre les deux sessions marche dans les deux sens** (message direct + fil écrit sur GitHub).

### Décisions prises

1. La liaison se fait par un déclencheur en base, jamais par fonction edge. Essai sur le projet de test d'abord ; Beau décide de la mise en production.
2. La démo « solution complète » vit sur le projet de test avec un compte partagé : cinq boutiques fictives (épicerie, restaurant, salon, garage, électronique), le prospect commande côté client, la vendeuse livre depuis son téléphone, la vente apparaît dans ses comptes. Alpha crée les boutiques et leurs articles (images de `public/demo-products/`), Claudinette crée les cinq espaces Accounting avec trois mois d'activité de comptoir. Parcours écrit à quatre mains dans `docs/DEMO-PARCOURS.md`.
3. Le mot d'ordre pour les prochains jours : **Accounting doit être irréprochable sur un téléphone, à la caisse**. Le reste (comptabilité fine) est déjà juste, la simulation l'a montré.

### Le téléphone et la caisse — ce que je propose de faire, dans l'ordre

Regardé avec les yeux d'une vendeuse qui tient sa caisse sur un téléphone à 390 px, souvent d'une main.

1. **Photos des articles dans la caisse.** Aujourd'hui la recherche affiche nom, prix, stock ; pas d'image. Une vendeuse reconnaît un article à sa photo avant son nom. À faire : photo sur la fiche article (appareil photo du téléphone, réduite à 400 px et gardée dans l'événement `product.save` en base64, ou mieux dans le stockage Supabase avec seulement l'adresse dans l'événement pour ne pas alourdir le journal — à décider avec Alpha, qui a déjà un stockage d'images pour la place de marché), grille de vignettes dans la caisse, mêmes photos que sur la boutique Finjaro quand l'article est relié.
2. **La caisse en grille, pas en liste.** Cases carrées avec photo, prix en gros, badge de stock, tri par « le plus vendu » ; un appui = une unité, un appui long = quantité. Le panier reste collé en bas, total lisible à deux mètres.
3. **Le ticket sur imprimante Bluetooth** (imprimantes thermiques 58 mm à 15 000 F, partout dans les boutiques) : aujourd'hui on imprime par le navigateur ou on envoie sur WhatsApp. Sur Android dans l'application Finjaro (Capacitor), un greffon d'impression Bluetooth est possible ; à chiffrer.
4. **Un geste pour la vente la plus courante** : « Revendre le dernier ticket », « articles du jour » en tête, et le clavier numérique qui s'ouvre tout seul sur le montant reçu.
5. **Le hors ligne visible** : un point de couleur dans l'en-tête (vert synchronisé, orange en attente avec le nombre, rouge stockage plein), au lieu de la barre qui n'apparaît qu'à la coupure.
6. **Écran de fermeture de caisse guidé** : compter les billets par coupure (10 000 × 3, 5 000 × 7…), l'écart calculé, la photo du comptage rangée avec la session.
7. **Écran large** : journal et grand livre paginés, tri par colonne (ligne 41 du tableau de décision).
8. **Un mode « petit écran cassé »** : polices plus grandes et contraste relevé (réglage), parce que les écrans fêlés sont la norme, pas l'exception.

### La concurrence, vue de la boutique

Ce qu'utilisent aujourd'hui les commerçantes visées, et ce que ça nous apprend (à vérifier sur le terrain par Beau, pas de chiffres inventés) :

- **Le cahier et WhatsApp** : le vrai concurrent. Gratuit, sans batterie, sans réseau. Notre réponse : la saisie en trois gestes, le hors ligne qui tient vraiment (ligne 6 du tableau, à faire), et le ticket WhatsApp qui rend service à la cliente.
- **Loyverse, Kyte, Vendus (caisse gratuite sur téléphone)** : très bonne caisse, photos, imprimante Bluetooth, mais aucune comptabilité, aucun bilan, rien pour le comptable. Notre avantage : les écritures, la balance, la clôture, le FEC, déjà justes. Notre retard : la caisse elle-même (photos, grille, imprimante), d'où les points 1 à 3 ci-dessus.
- **Yaka, Money Manager et les applications de « suivi des dépenses »** : simples, mais chaque chiffre est isolé, rien ne se rapproche, pas de stock. On gagne dès qu'il y a du stock ou un comptable.
- **Sage, Odoo, QuickBooks** : la comptabilité complète, mais un ordinateur, un abonnement en devise forte et un comptable pour s'en servir. On ne se bat pas là ; on est la porte d'entrée, et l'export vers leur logiciel (ligne 38 du tableau : codes de compte « 0000 ») est ce qui rassure le comptable.
- **Ce qu'aucun d'eux n'a** : la place de marché reliée à la comptabilité. Une vente en ligne qui atterrit toute seule dans les comptes, c'est l'argument de la démo.

### Demain

- Claudinette : commence le point 1 (photos d'articles) et le point 5 (voyant hors ligne) ; vérifie le déploiement en ligne ; relit les réponses d'Alpha ; prépare les cinq espaces de démo.
- Attendu d'Alpha : la migration du déclencheur sur le projet de test avec une boutique et une commande à livrer ; sa réponse sur la commission ; son avis sur le stockage des photos (réutiliser celui de la place de marché ?).
- Beau, quand il a une minute : ouvrir accounting.finjaro.net sur son téléphone, vendre un article, encaisser un abonnement, et dire ce qui l'agace. C'est la meilleure source de problèmes.

---

## Complément à la réunion n° 2 — 18/09, fin de matinée

Alpha a répondu avec des chiffres, et l'un d'eux a changé ma cible.

### Les deux entonnoirs, côte à côte

| Place de marché — acheteuses (30 j) | | Place de marché — vendeuses (60 j) | |
|---|---|---|---|
| ont ouvert Finjaro | 299 | inscriptions | 82 |
| ont ouvert un article | 92 | ont ouvert une boutique | 57 |
| ont mis au panier | 1 | ont publié un article | 38 |
| commandes | 1 | ont reçu une commande | 2 |

Chiffres comptés par Alpha, par appareil distinct et comptes de test exclus.

**Le côté vendeuse est sain** : sept sur dix ouvrent une boutique, presque une
sur deux publie un article. **Le mur est du côté acheteuse** : entre « j'ouvre
un article » et « je mets au panier », on perd presque tout le monde. Alpha
pose elle-même la réserve — le panier n'est pas le seul chemin — mais une seule
acheteuse a écrit à une boutique depuis le début de Finjaro. Deux mesures
indépendantes qui disent la même chose, c'est une conclusion.

**Comparaison qui remet mon travail à sa place** : 46 % des inscrites de la
place de marché publient un article ; 0 % de mes espaces enregistrent une
vente.

### Ma cible était mal choisie, Alpha l'a vu

Je visais « la première vente ». Sa remarque : quelqu'un peut taper une vente
d'exemple pour finir mon parcours ; j'aurai mon événement et elle n'aura rien
gagné. La bonne cible est **une première journée vraiment tenue** — caisse
ouverte, vraie vente, caisse fermée avec l'écart expliqué. C'est ce qui fait
revenir le lendemain, et c'est exactement ce qui manque à nos sept espaces.

Appliqué le jour même sur la branche `premiere-vente` : la liste de démarrage
suivait un ordre de logiciel, elle suit maintenant une journée de commerce, et
la fermeture de caisse y entre — elle n'y figurait pas du tout.

### Ce qui remonte à Beau et change l'ordre des choses

Alpha : **si une vendeuse déjà connectée sur la place de marché doit refaire un
compte dans Accounting, je perds des gens avant même mon premier écran.** Mon
entonnoir ne commence donc pas chez moi. La session partagée entre les deux
adresses cesse d'être un confort et devient une marche de mon propre parcours.

### Mesure posée, chiffres pas encore là

Les trois écrans qui s'empilent avant la place de marché n'étaient mesurés par
rien du tout. Alpha a posé la mesure le 18/09 sur staging. **Non mesuré à ce
jour ; chiffres attendus sous une semaine, une fois en production.** Rien ne
sera écrit avant que la donnée existe.
