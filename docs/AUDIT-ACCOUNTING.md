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

### L'entonnoir réel, compté sur les événements

Du 10/09 au 23/09, comptes de test exclus :

| Étape | Personnes |
|---|---|
| Ont créé un compte | **8** |
| Ont nommé leur entreprise | 7 |
| **Ont enregistré un article** | **0** |
| Ont enregistré une vente | 2 |
| Ont invité un collègue | **0** |

Et le rythme : **7 personnes sur 8 ont tout fait le jour même de leur
inscription et ne sont jamais revenues.** Une seule est repassée, dix jours
plus tard.

### Ce que ça dit, écran par écran

**1. La création de compte n'est pas le problème.** 8 personnes sur 8 la
franchissent. L'écran fait son travail.

**2. Le mur est juste après, et il a un nom : le catalogue.** Personne,
jamais, n'a enregistré un article. Or deux personnes ont enregistré une
vente — donc elles ont réussi à vendre **sans catalogue**, en tapant tout à
la main. Elles ont contourné l'écran plutôt que de le remplir.

Saisir son stock article par article, au clavier, sur un téléphone, avant
d'avoir vu le moindre bénéfice : c'est là que tout le monde s'arrête. C'est
exactement la même cause que les 222 articles « prix sur demande » de la place
de marché, où des boutiques ont tout coché plutôt que de saisir 93 prix.

**3. « Travailler à plusieurs » n'a jamais servi.** C'est le 2ᵉ des quatre
arguments affichés sur l'écran d'inscription (« Caissier, gérant, comptable
sur le même espace, en direct »). La table `finia_members` est **vide** :
personne n'a jamais invité personne. On met en avant une promesse que
personne n'a essayée — ce n'est pas un mensonge, mais ce n'est pas encore un
argument.

**4. Un signal à ne pas perdre :** un espace porte **12** événements
`company.update` le même jour. Quelqu'un a rempli la fiche de son entreprise
douze fois de suite. Soit le formulaire ne garde pas ce qu'on lui donne, soit
il n'est pas clair qu'il a enregistré. À regarder de près : c'est la seule
trace qu'on ait de quelqu'un qui s'acharne.

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

### À faire demain (jour 2)

`Dashboard.tsx` et `PointOfSale.tsx` — le premier écran après l'entrée, et
celui que les deux seules personnes actives ont réellement utilisé.
