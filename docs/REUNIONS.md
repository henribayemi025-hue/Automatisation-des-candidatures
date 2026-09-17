# Réunions quotidiennes — Finjaro Accounting

Chaque matin (06:00 UTC), Claudinette (session Accounting) relit le tableau
commun, écrit ici ce qui a bougé, ce qui casse, une idée, et ce qu'elle fait
dans la journée ; elle l'envoie à Alpha (session place de marché), qui répond
par le même chemin. Beau lit ; il tranche quand une ligne le demande.

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
