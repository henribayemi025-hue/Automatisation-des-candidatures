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

## Ce qui a été vérifié, et où

Sur le projet de test, pas en production. Une commande réelle de 26 500 FCFA (deux articles plus la livraison) chez une vendeuse de test : la vente est arrivée juste, au centime, dans sa monnaie. Livrée une deuxième fois : toujours une seule vente. Chez une vendeuse sans comptabilité : rien, et la livraison est passée.

Deux défauts ont été trouvés et corrigés **avant** d'arriver à cette page, et ils méritent d'être dits parce qu'ils seraient passés inaperçus :

1. La monnaie de l'entreprise était lue à un endroit qui n'est rempli qu'après 300 opérations. Sur un compte neuf il est vide — donc **toute vendeuse venant d'ouvrir sa comptabilité aurait vu ses ventes refusées**, sans message.
2. Les ventes arrivaient avec une marge de 100 % et **entraient telles quelles dans le bénéfice de l'année**. C'est ce qui aurait coûté de l'argent réel à une commerçante au moment de payer ses impôts.

---

## La décision qui revient à Beau

Poser la migration `0127_liaison_commande_vers_vente.sql` en production.

Elle touche **les deux applications** : elle vit dans la place de marché et elle écrit dans les tables d'Accounting. C'est pour ça qu'elle attend. Elle n'ajoute rien qui puisse casser l'existant — elle ne fait quelque chose que sur une commande qui passe à « livrée », et seulement si la vendeuse a une comptabilité.

Le jour où tu dis oui, la première vendeuse concernée verra sa prochaine livraison arriver dans ses comptes.
