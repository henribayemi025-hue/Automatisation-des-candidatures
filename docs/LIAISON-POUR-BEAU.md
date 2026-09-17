# Relier Finjaro et Finjaro Accounting — la page pour Beau

Écrite à deux sessions le 17/09. Rien n'est en production côté place de marché : cette page existe pour que Beau décide.

---

## En une phrase

Quand une vendeuse marque une commande Finjaro comme **livrée**, la vente apparaît toute seule dans sa comptabilité, dans sa monnaie, sans qu'elle retape quoi que ce soit.

---

## Ce que ça change pour la vendeuse

Aujourd'hui, une vendeuse qui a une boutique sur Finjaro **et** qui tient ses comptes dans Accounting fait le travail deux fois : elle vend en ligne, puis elle ressaisit la vente à la main. C'est exactement le moment où les gens abandonnent — et une vente non saisie, c'est une comptabilité fausse.

Avec la liaison, elle ne fait plus rien. Elle appuie sur « livrée » comme d'habitude, et la vente est dans ses livres : le client, le numéro de commande Finjaro (`FJ-…`, pour qu'elle sache d'où ça vient), chaque article, et les frais de livraison en ligne séparée puisqu'elle les encaisse aussi.

**Ce qu'on lui demande quand même**, et c'est volontaire : compléter le coût d'achat de ses articles. Finjaro ne connaît pas ce que la vendeuse a payé sa marchandise — la place de marché n'enregistre que le prix de vente. Sans ce coût, sa comptabilité afficherait une marge de 100 % et **elle paierait des impôts sur un bénéfice qui n'existe pas**. Accounting le lui réclame donc au bon moment, lui propose le coût de sa fiche article quand il le connaît, et **refuse de clôturer son exercice** tant qu'une vente reste sans coût. C'est le seul endroit où on lui met un frein, et c'est pour la protéger.

**Si elle n'a pas de comptabilité Accounting**, il ne se passe rien du tout. Sa livraison fonctionne exactement comme avant. Rien ne lui est créé dans son dos : on ne donne à personne des livres de comptes dont elle ignore l'existence.

---

## Ce que ça change pour la place de marché

Presque rien de visible, et c'est voulu.

Le passage à « livrée » écrit la vente dans la même opération que la livraison elle-même. Il n'y a pas de service intermédiaire qui pourrait tomber en silence — c'est une leçon payée cher le 12/09, quand des passages automatiques étaient sautés sans erreur et sans que personne ne le voie pendant des jours.

Concrètement :

- **Une commande livrée deux fois par erreur ne crée jamais deux ventes.** Vérifié.
- **Une vendeuse sans comptabilité n'est pas gênée** : sa livraison passe, et on note simplement dans un journal interne qu'il n'y avait rien à faire.
- **Le stock n'est pas touché deux fois.** Finjaro sort déjà le stock au moment de la commande ; la liaison n'y retouche pas.
- **Les montants sont convertis dans la monnaie de la vendeuse**, et le taux utilisé est écrit dans l'opération — donc un contrôle six mois plus tard retrouve exactement le même chiffre.

Ce que ça ouvre, et qui compte plus que la fonctionnalité elle-même : Finjaro cesse d'être une vitrine et devient l'endroit d'où partent les chiffres d'une commerçante. C'est un argument que les autres places de marché n'ont pas.

---

## Ce que ça ne fait pas encore

- **Pas de taxe.** La place de marché ne calcule aucune TVA, donc les ventes arrivent sans taxe. Une vendeuse assujettie devra la traiter elle-même pour l'instant.
- **Pas de retours ni d'avoirs.** Une commande livrée ne peut pas être annulée sur Finjaro, donc le cas ne se présente pas aujourd'hui — mais le jour où on autorisera l'annulation après livraison, il faudra le construire d'abord.
- **Pas de commission.** La commission Finjaro n'est réclamée à personne aujourd'hui : elle vaut zéro sur les 22 commandes. Le jour où elle sera réclamée, ce sera une dette envers Finjaro, pas une retenue sur le chiffre d'affaires.
- **Le coût d'achat reste à compléter à la main** tant que la vendeuse n'a pas relié ses articles Finjaro à ses fiches Accounting. C'est le prochain chantier, et c'est ce qui rendra la liaison complètement automatique.

---

## Ce que ça change dans ses comptes, précisément

Une commande livrée devient **une vente comme si elle l'avait encaissée au comptoir** : elle apparaît dans ses ventes, dans sa caisse, dans son journal, dans sa balance, dans son bilan, et dans son export pour le comptable. Elle n'est pas rangée à part, parce qu'une vente est une vente.

Deux choses la distinguent, et elles sont visibles :
- Son numéro commence par `FJ-` : c'est une vente venue de la boutique en ligne.
- Tant que le coût d'achat manque, elle est signalée en rouge, sur l'accueil et à l'écran des ventes.

Ce que la vendeuse voit dans ses chiffres, avant qu'elle complète le coût : l'argent encaissé est juste, la caisse est juste, le bilan est équilibré — **seul le bénéfice est trop beau**. Après qu'elle a complété : le coût des marchandises est enregistré à la date de la vente, et le bénéfice devient le vrai.

Le stock de son magasin n'est pas touché par ces ventes : les articles vendus en ligne sont déjà sortis de son stock Finjaro au moment de la commande. Si elle tient un stock à part pour sa boutique physique, il reste intact.

---

## Ce qui a été vérifié, et où

Sur le projet de test, pas en production. Une commande réelle de 26 500 FCFA (deux articles plus la livraison) chez une vendeuse de test : la vente est arrivée juste, au centime, dans sa monnaie. Livrée une deuxième fois : toujours une seule vente. Chez une vendeuse sans comptabilité : rien, et la livraison est passée.

Côté Accounting, cette vente réelle a été **reprise telle qu'elle est en base et rejouée dans le moteur de l'application** : caisse juste, bilan équilibré, aucun mouvement de stock, aucune erreur de contrôle, et un rejeu du même événement ne crée jamais de doublon. Vingt et un contrôles automatiques couvrent la liaison et le coût manquant, dont le passage d'un bénéfice de 31 500 à 13 500 après complément du coût. Ils se rejouent en une commande : `npx vite-node scripts/liaison-check.ts` et `scripts/liaison-replay-check.ts`.

Deux défauts ont été trouvés et corrigés **avant** d'arriver à cette page, et ils méritent d'être dits parce qu'ils seraient passés inaperçus :

1. La monnaie de l'entreprise était lue à un endroit qui n'est rempli qu'après 300 opérations. Sur un compte neuf il est vide — donc **toute vendeuse venant d'ouvrir sa comptabilité aurait vu ses ventes refusées**, sans message.
2. Les ventes arrivaient avec une marge de 100 % et **entraient telles quelles dans le bénéfice de l'année**. C'est ce qui aurait coûté de l'argent réel à une commerçante au moment de payer ses impôts.

---

## La décision qui revient à Beau

Poser la migration `0127_liaison_commande_vers_vente.sql` en production.

Elle touche **les deux applications** : elle vit dans la place de marché et elle écrit dans les tables d'Accounting. C'est pour ça qu'elle attend. Elle n'ajoute rien qui puisse casser l'existant — elle ne fait quelque chose que sur une commande qui passe à « livrée », et seulement si la vendeuse a une comptabilité.

**Le risque, dit franchement.** L'écriture de la vente se fait dans la même opération que la livraison. C'est un choix : il garantit qu'aucune vente ne se perd en silence. Mais il a une conséquence qu'il faut connaître avant, pas découvrir : si cette écriture échouait pour une raison qu'on n'a pas prévue, **la livraison échouerait avec elle** et la vendeuse verrait une erreur au moment d'appuyer sur « livrée ». Aujourd'hui, sept espaces comptables existent en production et une seule commande a été livrée en treize jours : si cela arrivait, cela toucherait une personne, pas cent.

**La marche arrière prend dix secondes.** Une seule ligne retire le déclencheur (`drop trigger trg_finia_order_to_sale on orders`) et tout revient exactement à l'état d'avant. Aucune donnée n'est perdue : les ventes déjà créées restent dans les comptes, les commandes restent dans la place de marché, et les livraisons repartent comme avant.

Le jour où tu dis oui, la première vendeuse concernée verra sa prochaine livraison arriver dans ses comptes.
