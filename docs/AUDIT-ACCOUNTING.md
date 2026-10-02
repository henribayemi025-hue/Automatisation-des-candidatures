# Audit d'Accounting, écran par écran

Demandé par Beau le 28/09 : « je veux commencer à partir du début de la
création de comptes jusqu'à la fin, donc chaque jour on audite deux trucs ».

**Deux écrans par jour**, dans l'ordre où une personne les rencontre.
Chaque constat est mesuré sur la production, jamais déduit d'une lecture du
code seule.

---

## Jour 1 — `Auth.tsx` (créer un compte) et `Onboarding.tsx`

### Méthode : lire les ÉVÉNEMENTS, pas l'instantané

Premier piège, et j'ai failli y tomber. La table `finia_workspaces` montre,
pour **tous** les espaces réels : entreprise « Mon entreprise », 0 vente,
0 article, `snapshot_seq = 0`, `updated_at` jamais bougé depuis la création.

Lu tel quel, ça ressemble à une perte de données massive. **Ce n'en est pas
une.** Accounting est une base à ÉVÉNEMENTS : la vérité est dans
`finia_events`, et `finia_workspaces.data` n'est qu'un instantané recompacté
tous les `COMPACT_AFTER = 300` événements. Avec 34 événements en tout, aucun
espace n'a jamais atteint le seuil — donc l'instantané est resté celui du
premier jour, ce qui est le comportement voulu.

**Conséquence à retenir, et elle compte pour Beau :** on ne peut répondre à
« où en est Accounting ? » en lisant `finia_workspaces`. Il faut compter les
événements. Tout tableau de bord bâti sur l'instantané affichera zéro pour
toujours.

### ⚠️ Je me suis trompé deux fois avant d'arriver au bon chiffre

Ma première lecture disait « entreprise : Mon entreprise » partout, donc
« personne n'a rempli sa fiche ». **Faux deux fois.**

1. L'instantané `finia_workspaces.data` est figé au premier jour (voir
   ci-dessus) : il montre « Mon entreprise » même quand la personne a renommé
   son commerce.
2. Le nom réel est dans le **patch** de l'événement `company.update`
   (`payload->'patch'->>'name'`), pas là où je l'avais cherché.

Beau avait raison de dire « quelqu'un l'utilise déjà ». Voici ce que disent
les événements une fois lus au bon endroit.

### L'entonnoir réel, compté sur les événements

Du 10/09 au 25/09, comptes de test exclus. **Sans noms** : ce dépôt peut être
lu, et ce sont des commerces réels.

| Étape | Personnes |
|---|---|
| Ont créé un compte | **8** |
| **Ont fini l'installation** (nom, pays, devise, régime fiscal) | **6** |
| Ont ouvert une session de caisse | 1 |
| Ont enregistré une vente | 2 |
| **Ont enregistré un article** | **0** |
| Ont invité un collègue | **0** |
| Sont revenus un autre jour | 1 |

**Six commerces sur huit ont fait l'installation complète** — pas « Mon
entreprise », mais un vrai nom, une vraie ville, la bonne devise, le bon plan
comptable (SYSCOHADA côté zone franc), la TVA au bon taux.

**Et c'est déjà international** : trois pays représentés (Cameroun, France,
Congo), deux devises (XAF, EUR). L'écran d'installation fait donc bien son
travail, y compris hors zone FCFA — c'est le seul endroit de tout Finjaro que
j'ai audité aujourd'hui où la devise n'était pas un piège.

### Ce qui marche, et ce qui bloque

**Ce qui marche :** l'inscription (8/8), l'installation (6/8), la caisse
(quelqu'un a ouvert une session avec un caissier nommé et encaissé deux
ventes le soir même).

**Ce qui bloque, et c'est le seul vrai mur : le catalogue.** Personne, jamais,
n'a enregistré un article. Les deux personnes qui ont vendu l'ont fait **sans
catalogue**, en tapant les montants à la main. Elles ont contourné l'écran
plutôt que de le remplir.

**Ce qui n'a jamais servi :** « Travailler à plusieurs », le 2ᵉ des quatre
arguments de l'écran d'inscription. `finia_members` est vide.

### 🔑 Le croisement qui décide de la prospection

**Trois des huit espaces Accounting appartiennent à des vendeuses de la place
de marché.** Et surtout : **la seule personne qui a enregistré des ventes ET
qui tient une boutique** est l'une d'elles.

Autrement dit, les vendeuses de la place de marché sont **3 inscrits sur 8**
mais **la moitié des gens qui s'en servent vraiment**. C'est le signal le plus
fort qu'on ait sur qui adopte Accounting.

### Le pont avec la place de marché existe — et il a déjà échoué deux fois

`finia_order_to_sale()` est un déclencheur posé sur `orders` : quand une
commande passe à « livrée », elle devient automatiquement une vente dans
l'espace Accounting de la vendeuse. Zéro saisie.

Il s'est déclenché **deux fois**, et les deux fois il a inscrit au journal :
`espace_absent`. La vendeuse n'avait pas de compte Accounting.

**Deux vraies ventes auraient atterri toutes seules dans une comptabilité, si
la vendeuse avait eu un espace.** C'est le seul chemin mesuré qui remplit
Accounting sans que personne ne tape quoi que ce soit.

### Ce que je propose (à trancher par Beau)

1. **Ne pas demander le catalogue en premier.** Laisser entrer, laisser
   vendre, et proposer le catalogue quand il fait gagner du temps.
2. **Brancher l'import** pour ceux qui ont déjà une liste (Excel, photo d'une
   liste de prix, catalogue WhatsApp) plutôt que la saisie au clavier.
3. **Viser d'abord les vendeuses de la place de marché** : leur catalogue est
   déjà dans Finjaro, et le pont existe déjà.
4. Retirer ou requalifier « Travailler à plusieurs » tant que personne ne
   l'utilise.

---

## Jour 2 — `Dashboard.tsx` (Accueil) et `PointOfSale.tsx` (caisse), 30/09

Audit fait par Alpha en production, sur la démo (`/#/demo/<pays>/<métier>`),
sans compte, à 390 px et 1440 px. Corrections et mesures par Claudinette.

| # | Constat (Alpha) | Gravité | Ce qui a été fait |
|---|---|---|---|
| 1 | Dans la démo, le restaurant perd de l'argent (marge brute −92 %, résultat −725 847 FCFA), la pharmacie aussi (−15 %) ; garage 71 % et import-export 84 %, trop beaux. | Grave : la démo est le lien de prospection. | Cause confirmée dans `demo.ts` : les coûts d'achat étaient ceux de l'épicerie, appliqués au catalogue de chaque métier. Corrigé : on garde seulement l'écart au coût de référence ; les quantités achetées et vendues suivent le prix de l'article (au plus ×5) ; la facture en dollars est réservée à l'épicerie et à l'import-export ; stock de départ de la pharmacie doublé. **Mesuré après correction** (Cameroun, France, Canada, 8 métiers, sur l'exercice et sur le mois) : tous les résultats sont positifs ; marges brutes au Cameroun : boutique 26 %, restaurant 49 %, garage 32 %, pharmacie 31 %, électronique 44 %, import-export 18 %. Aucun événement de la démo refusé, avant comme après. |
| 3 | À la caisse, la taxe s'ajoute au prix affiché (22 500 → 26 831). | **Plus grave que prévu** : c'était un défaut, pas un choix. | Le réglage « Mes prix affichés incluent déjà la taxe » existe (Paramètres) et vaut « oui » par défaut, mais l'écran de caisse faisait son propre calcul et ajoutait toujours la taxe. L'écriture comptable, elle, était juste (le montant enregistré est plafonné au bon total). Corrigé : la caisse utilise le même calcul que la comptabilité (`saleTotals`). Vérifié : Poulet DG + café = 5 000 FCFA, dont TVA 807. **Aucun espace réel (hors comptes de test) n'a la TVA activée** : personne n'a été touché. |
| 2 | Caisse sur téléphone : rien ne montre qu'un article est entré dans le panier. | Moyen | Barre fixe au-dessus du menu du bas : « 2 article(s) · 5 000 FCFA — Encaisser », qui descend au panier ; elle laisse la place du bouton de l'assistant. Vérifié à 390 px. |
| 4 | Accueil : le premier chiffre de l'axe du graphique est coupé. | Petit | Axes en notation courte (« 200 k », « 1,5 M »). |
| 5 | Accueil : sigles « MTD / YTD ». | Petit | Remplacés par « Mois / Année / 30 j » (traduits en anglais). |
| 6 | Codes comptables (70, SIG, 411…) sur les cartes de l'Accueil. | À vérifier | Vérifié dans le code : ils ne s'affichent qu'en mode expert. La démo s'ouvre en mode expert ; à Beau de dire si elle doit s'ouvrir en mode simple pour les commerçants. |

Vérifié et correct selon Alpha : graphique, aucune erreur JavaScript, devise
selon le pays, astuce propre au restaurant.

---

## Jour 3 — `Sales.tsx` (ventes) et `Stock.tsx`, 01/10

Fait par Claudinette sur la démo (boutique et garage, Cameroun), 390 px et
1440 px, sans compte.

| # | Constat | Gravité | Ce qui a été fait |
|---|---|---|---|
| 1 | Ventes : « Encaissé » (7 445 720) **plus grand** que « Chiffre d'affaires » (6 421 291). Le chiffre d'affaires était hors taxe, l'encaissé taxe comprise ; les ventes annulées comptaient. | Moyen : une commerçante croit à une erreur. | Cartes « Total facturé » (taxe comprise, avec « dont … hors taxe ») et « Encaissé » (avec « Reste à encaisser »). Ventes annulées exclues. Vérifié sur le garage : facturé 28 474 000, encaissé 27 568 600, reste 905 400. |
| 2 | Une prestation (main-d'œuvre, diagnostic) sortait du stock à chaque vente : stock à zéro, alerte « Rupture », et **tuile de caisse grisée** — un garage ne pouvait pas encaisser son heure de main-d'œuvre. | **Grave pour les métiers mixtes** (garage, réparation). | Règle unique `holdsStock()` : un article de nature « prestation » n'a pas de stock. Appliquée à l'écriture des ventes, à la caisse, à l'écran Stock, à l'Accueil et à l'assistant. Vérifié : la tuile s'encaisse sans avertissement, le Stock compte 6 références au lieu de 8. Les articles existants gardent leur nature : seuls ceux marqués « prestation » changent. |
| 2 bis | Relu par Alpha : un garage **neuf** retombait sur le défaut, car le formulaire Article part de « Marchandise » et l'import de catalogue ne pose aucune nature. | Grave (vrais comptes) | Deux protections, proposées par Alpha : (a) un nom de travail facturé (« main-d'œuvre », « diagnostic », « réparation », « vidange », « coupe »…) propose « Prestation » dans le formulaire tant que la personne n'a pas choisi elle-même, et devient prestation à l'import ; (b) à la caisse, un article sans stock qui ressemble à une prestation (ou à coût nul) n'est plus grisé : la caisse demande « Est-ce une prestation ? » une seule fois. Vérifié à l'écran sur un garage de démo. |
| 3 | Démo ouverte le 1er du mois : aucune vente du jour, donc « −100 % vs M-1 » en rouge. | Petit | La démo vend aussi le jour même. Le 1er du mois, la comparaison porte sur un seul jour et reste forcément irrégulière. |
| 4 | Sur téléphone, les cartes de chiffres prennent tout le premier écran avant la liste. | Petit | Noté, pas corrigé : en deux colonnes, les montants en FCFA ne tiennent pas à 390 px. |

Aucune erreur JavaScript (seules erreurs : polices bloquées par le réseau
de l'environnement de test).

### Jour 4 fait le 02/10 (ci-dessous).

---

## Jour 4 — `Expenses.tsx` (dépenses) et `Debts.tsx` (créances et dettes), 02/10

Fait par Claudinette sur la démo (boutique, Cameroun), 390 px et 1440 px,
en français et en anglais, sans compte.

| # | Constat | Gravité | Ce qui a été fait |
|---|---|---|---|
| 1 | Payer un fournisseur ne prévenait pas quand la caisse n'avait pas assez d'argent (les dépenses le font déjà) : une caisse pouvait passer en négatif sans un mot. | Moyen | Même avertissement que pour une dépense, avec « Enregistrer quand même ». Le calcul est celui des dépenses, vérifié à l'écran sur une dépense ; dans la démo, les caisses ont assez d'argent pour toutes les dettes, donc l'avertissement fournisseur n'a pas pu s'afficher en vrai. |
| 2 | Dépenses : l'avertissement « pas assez d'argent » restait affiché après avoir corrigé le montant, le moyen de paiement ou la date, et réapparaissait à la réouverture. | Petit | Il disparaît dès qu'on change un de ces champs. Vérifié. |
| 3 | Liste des dépenses dans l'ordre de saisie : une dépense saisie après coup se perdait au milieu. | Petit | La plus récente en haut, par date. Vérifié. |
| 4 | En anglais, une vingtaine de textes restaient en français : titres des colonnes de **tous** les tableaux de l'application, titre des dettes, « Compte imputé », « Montant (XAF) », « {n} jours »… | Moyen pour l'ouverture au monde | Titres de colonnes traduits une fois pour toutes dans le composant tableau ; textes des deux écrans passés en traduction. Vérifié en anglais. |
| 5 | Tableau « Soldés » des dettes : sur téléphone, la colonne Date était coupée et il fallait faire défiler. | Petit | Origine et Date masquées sur téléphone, comme dans le tableau du dessus. Mesuré : 356 px pour 356 px disponibles. |
| 6 | **La date « du jour » est celle de Londres, pas celle du commerce.** `today()` et 37 autres endroits prennent la date en temps universel. À Toronto, une vente de 20 h est datée du lendemain ; à Douala, une vente entre minuit et 1 h est datée de la veille. | **Moyen, et grave à l'échelle mondiale** (rapports du jour, clôture, rappels du soir). | Pas corrigé aujourd'hui : 38 endroits à changer ensemble, sinon des comparaisons de dates se décalent d'un jour entre elles. Proposé pour demain, avec un test à minuit dans plusieurs fuseaux. |

Aucune erreur JavaScript.

### À faire demain (jour 5)

Le n° 6 (date du jour en heure locale, partout à la fois), puis
`Purchases.tsx` (achats).
