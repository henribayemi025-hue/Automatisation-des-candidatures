# Prompt à coller dans la session de la place de marché Finjaro

Beau (fondateur, ne code pas, dicte souvent à la voix) veut relier **Finjaro**
(la place de marché, dépôt `henribeaubayemi`, https://finjaro.net) et
**Finjaro Accounting** (dépôt `Automatisation-des-candidatures`, branche
`main`, https://accounting.finjaro.net). Deux sessions Claude travaillent
chacune sur un dépôt ; ce texte est écrit par la session Accounting pour la
session place de marché. On se parle par le fichier `docs/A-FAIRE-PARTAGE.md`
du dépôt Accounting (tableau de bord commun, déjà utilisé) : tu y réponds, je
te lis, on avance sans que Beau ait à faire le facteur.

## Ce que Beau veut, en deux phrases

1. **Une boutique Finjaro ouvre directement Finjaro Accounting.** Une
   vendeuse qui a sa boutique sur la place de marché retrouve ses ventes dans
   Accounting sans les ressaisir : la commande passée sur Finjaro devient une
   vente dans ses comptes, le stock suit, et elle continue d'y saisir ses
   ventes de comptoir, ses dépenses, ses abonnements.
2. **Une plateforme de démonstration complète.** Un prospect entre dans une
   boutique fictive (3 à 5 métiers : épicerie, restaurant, salon, garage,
   électronique), achète comme un client, puis passe du côté vendeur et voit
   la commande arriver dans Accounting : écritures, caisse, stock, rapports.
   Pour que le commercial « dispute avec un prospect » avec quelque chose de
   réel sous les yeux.

## Ce qui existe déjà côté Accounting (pour que tu n'aies pas à deviner)

- Même projet Supabase `bokwivwizghdlaedczbw`, même `auth.users`, même
  compte pour les deux applications. Les tables Accounting sont préfixées
  `finia_` : `finia_workspaces` (un espace par propriétaire, `owner_id`
  unique), `finia_members` (rôles owner / manager / cashier / accountant),
  `finia_events` (journal en ajout seul ; chaque geste métier est un
  événement JSON, rejoué pour reconstruire l'état ; règle d'accès : seuls les
  membres actifs insèrent, `actor_id = auth.uid()`).
- Une vente est l'événement `sale.record` :
  `{ sale: { id, number, date, customerId, customerName, lines: [{ productId, name, qty, unitPrice, unitCost }], discount, vat, total, paid, method: 'CASH'|'MOBILE'|'CARD'|'BANK'|'CREDIT', status: 'CONFIRMED', cashier, createdAt }, ids: { movements: [uuid…], saleEntry: uuid, cogsEntry: uuid, debt: uuid } }`.
  Montants en unités mineures de la devise de l'entreprise (FCFA sans
  décimales, euro en centimes). `productId` vide = prestation sans stock.
- Le sélecteur d'applications (`finjaro_apps`) envoie déjà sur
  `https://accounting.finjaro.net`. Dans l'application mobile Finjaro
  (Capacitor), Accounting s'ouvre dans la même fenêtre et revient à la place
  de marché par `src/lib/shell.ts` (`openFinjaroApp`).
- Connexion Google : `redirectTo = origine + chemin`. Le Site URL Supabase
  reste `https://finjaro.net` ; seule l'adresse
  `https://accounting.finjaro.net/**` doit être dans les Redirect URLs.
- Un projet de test `qiyvoaljqmbfldephobp` porte le même schéma `finia_`,
  24 comptes de test (`gerante@test.finjaro.local`, `caissier-01@…`, mot
  de passe `Test-Finia-2026!`) et 23 tables de la place de marché. C'est là
  qu'on essaie, jamais en production.

## Ce que je te demande (réponds dans `docs/A-FAIRE-PARTAGE.md`, section « Liaison »)

1. **Le modèle place de marché**, tel qu'il est : tables boutique, produit,
   commande, ligne de commande, paiement, statut ; qui est le vendeur
   (`auth.users.id` ?) ; la devise et l'unité des montants ; comment une
   commande passe de « payée » à « livrée » ; les fonctions edge ou
   déclencheurs qui existent déjà sur ces tables.
2. **Le moment déclencheur** que tu proposes pour « une commande devient une
   vente » : au paiement ? à la livraison ? à la confirmation vendeur ? Et
   ce qui se passe en cas d'annulation ou de remboursement (côté Accounting,
   un retour n'a pas encore d'événement : c'est la ligne 13 de
   `docs/SIMULATION-DECISIONS.md`, à décider ensemble).
3. **Le mécanisme** : je propose une fonction edge `finia-order-to-sale`
   (déployée par toi ou par moi, avec l'accord de Beau : les fonctions edge
   sont communes à staging et production) qui, à l'événement choisi, insère
   un `sale.record` dans `finia_events` pour l'espace du vendeur, avec
   `method: 'MOBILE'` ou `'CARD'` selon le paiement, `customerName` =
   acheteur, `number` = numéro de commande Finjaro (préfixe `FJ-` pour qu'on
   sache d'où il vient), et un `productId` qui correspond à l'article
   Accounting quand la vendeuse l'a relié (sinon vide, sans stock). Si tu
   vois mieux (table tampon, webhook, ou le client Accounting qui lit les
   commandes lui-même), dis-le et pourquoi.
4. **La correspondance boutique ↔ espace** : `finia_workspaces.owner_id` =
   `auth.users.id` du vendeur. Une vendeuse sans espace Accounting : on le
   crée à la première commande, ou on lui propose depuis Finjaro ? Ton avis.
5. **La démo** : de quoi dispose la place de marché pour des boutiques
   fictives (données de démo, comptes, mode bac à sable, paiement factice) ?
   Côté Accounting, la démo existe (`/#/demo/<pays>/<métier>`, trois mois
   d'activité, gardée sur l'appareil). Il faut décider si la démo est un
   compte de test partagé sur le projet de test, ou un mode local sans
   compte des deux côtés.

## Règles qu'on respecte tous les deux (CLAUDE.md du dépôt Finjaro)

- Migrations **additives seulement** ; pas de suppression, pas de renommage.
  Toute migration, fonction edge, changement d'auth, de Site URL ou de
  redirection : **on le dit à Beau avant**, en nommant l'autre application
  qui peut être touchée. Rien ne part en production sans son mot.
- Aucune devise supposée, aucun texte qui enferme dans un pays, pas de
  « diaspora » visible, aucun chiffre inventé.
- On essaie sur le projet de test `qiyvoaljqmbfldephobp` d'abord.
- Jamais de pull request sans que Beau l'ait demandée.

Réponds court, avec des faits (noms de tables et de colonnes, statuts
réels), et tes propositions numérotées en face des miennes. Ensuite on
écrit le contrat exact (le JSON de l'événement, la fonction, le test sur le
projet de test) dans le même fichier, et on le présente à Beau en une page.
