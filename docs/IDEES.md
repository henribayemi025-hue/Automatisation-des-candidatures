# Idées — revue produit et marché

Chaque idée : le problème, pour qui, ce que ça vaut, l'effort, ce qu'on demande à Beau. Beau coche ☐ → ☑ quand il décide. Les idées viennent des deux sessions, de la concurrence, du terrain. Rien n'est promis : c'est une liste de choix.

## Le problème numéro un, au-dessus de la liste (posé par Alpha, 17/09 — chiffre corrigé le soir même)

**Ce n'est pas que les gens ne veulent pas parler aux vendeuses : c'est qu'on leur demande de créer un compte pour poser une question.**

⚠️ **Correction d'un chiffre faux, écrit ici quelques heures plus tôt.** On avait noté « 3 clics de contact depuis le début ». Cette mesure ne couvrait que la fiche boutique et l'en-tête du chat ; le bouton de contact de la **fiche article** — le chemin principal, l'écran le plus visité — n'enregistrait rien. On mesurait à côté du bon chemin et on en tirait la mauvaise conclusion. Alpha l'a vu et l'a dit ; le chiffre ci-dessous est celui lu en base.

**Les vrais chiffres**, relevés par Alpha en production le 17/09 :

| Mesure | Valeur |
|---|---|
| Acheteuses réelles ayant écrit à une boutique, depuis le début de Finjaro | **1** |
| Messages écrits par ces acheteuses | 4 |
| Conversations ouvertes par de vraies personnes | 6, dont 3 sur 30 jours |
| Ouvertures de fiches article sur 30 jours | 403 |
| … dont par des gens **non connectés** | **317 (79 %)**, sur 81 appareils |
| Commandes cette semaine | 0 |

**Les deux causes, trouvées dans le code, vérifiées :**

1. **Le mur.** Sur la fiche article, le bouton de contact commence par exiger un compte (`if (!user) return requireLogin()`). Quatre visiteurs sur cinq ne sont pas connectés : pour demander « est-ce que vous livrez chez moi ? », il faut d'abord s'inscrire. Personne ne s'inscrit pour poser une question.
2. **Le bouton muet.** Même avec un compte, le seul contact sur la fiche article est un petit carré avec une bulle, **sans aucun texte**, à côté du gros bouton coloré « ajouter au panier ». Rien ne dit qu'on peut parler à quelqu'un.

**Ce qu'Alpha a déjà fait** (mesure manquante, n'exige l'arbitrage de personne) : un événement `contact_intent` posé **avant** le mur, avec un drapeau indiquant si la personne était connectée. Il séparera enfin deux choses aujourd'hui confondues : ceux qui ne veulent pas parler, et ceux qui se cognent au mur. Sur `staging`, commit `f84874e`.

**La décision qui revient à Beau :** 55 des 59 boutiques actives ont un numéro WhatsApp. Un bouton écrit en toutes lettres, qui ouvre WhatsApp **sans compte**, enlèverait les deux obstacles d'un coup. Le prix : la conversation sort de Finjaro, donc plus de trace, plus de relance à 72 h, plus de modération. Avis d'Alpha, que Claudinette partage : à ce stade, prendre les clients ; un registre parfait de conversations qui n'existent pas ne vaut rien.

Les idées ci-dessous se lisent avec cette réserve : **elles rendent le produit juste, elles ne font pas venir les acheteurs.** Deux exceptions qui servent quand même ce problème : l'idée 8 (marge sur les ventes Finjaro) parce qu'elle conditionnait la mise en production de la liaison, et l'idée 2 (mobile money) parce qu'elle touche l'acte d'achat lui-même.

## Finjaro Learning — décision de Beau (17/09) : oui, après la liaison et la démo

**C'est sa décision, et son argument est meilleur que le nôtre.** Alpha et Claudinette proposaient de repousser Learning au motif que l'attention de Beau est la ressource rare. Beau a tranché : personne n'utilise Finjaro en ce moment, donc le temps passé à construire n'est volé à rien, et **une troisième session qui travaille seule ne lui coûte pas d'attention**.

Le plan qu'il a posé : finir la liaison et la démo, stabiliser les deux côtés, **puis** lancer une troisième session dédiée à Learning. Alpha prépare le prompt de départ de cette session.

À ne pas relire comme « Alpha n'était pas d'accord » : le désaccord portait sur le moment, il est tranché, et la raison de Beau tient.

### En attendant, la version courte, utile tout de suite

Des conseils au bon moment, mesurables, sur les comportements qui coûtent de l'argent aujourd'hui — ils deviendront la matière de Learning :

| # | Idée | Problème résolu, pour qui | Ce que ça vaut | Effort | Décision |
|---|---|---|---|---|---|
| 0a | Un mot à la vendeuse **au moment où elle reçoit une commande** (« confirmez dans la journée, sinon la cliente s'en va ») | Commandes jamais confirmées, clientes perdues | Se mesure : taux de confirmation | 1 j (Alpha) | ☐ |
| 0b | **Comment photographier un article** : trois conseils au moment d'ajouter une photo | Les photos décident de tout sur une place de marché ; personne ne l'a expliqué | Se mesure : taux de contact, fiches avec photo | 2 j (Alpha, tâche #61) | ☐ |
| 0c | La même idée côté Accounting : un conseil dans l'écran concerné (première clôture, premier abonnement, premier stock négatif), jamais un cours | Une commerçante qui n'a jamais fait de comptabilité | Prépare un vrai Finjaro Learning le jour où il y aura des élèves | 2 j (Claudinette) | ☐ |

La formation comme produit (vendue à des ONG, à des programmes d'appui aux PME) reste une vraie piste, mais c'est un métier différent : à rouvrir quand Finjaro aura des acheteurs.

## 17/09/2026 — première revue (Claudinette)

| # | Idée | Problème résolu, pour qui | Ce que ça vaut | Effort | Décision |
|---|---|---|---|---|---|
| 1 | **Facture normalisée électronique** (Gabon : obligatoire depuis janvier 2026 pour les assujettis à la TVA, à l'IS ou à l'impôt synthétique ; Cameroun et d'autres pays OHADA suivent le même chemin) | Une vendeuse au réel doit émettre des factures reconnues par l'administration ; aujourd'hui Accounting imprime un ticket, pas une facture normalisée | Obligation légale = argument de vente imparable, et barrière pour les concurrents « caisse seule » | 5 à 10 j par pays (format, numérotation, QR, transmission) ; à vérifier avec le comptable Gautier | ☐ |
| 2 | **Encaissement mobile money sans double saisie** (MTN MoMo, Orange Money, Wave) : le paiement reçu crée la vente ou la marque payée | Aujourd'hui la vendeuse encaisse sur son téléphone puis ressaisit dans la caisse ; c'est là qu'elle abandonne | C'est ce que les concurrents (Yorine, GestionsPro, FlustockX) mettent en avant ; pour nous c'est aussi le rapprochement automatique | Import de relevé existe déjà ; l'API en direct dépend des opérateurs (MTN MoMo API ouverte ; Orange par pays) : 5 j pour un opérateur | ☐ |
| 3 | **Finjaro Learning** : apprendre (comptabilité de base, tenir une caisse, vendre en ligne, plus tard coder) avec de courtes leçons dans l'application, et une certification « boutique bien tenue » | Les commerçantes n'ont jamais appris la comptabilité ; les jeunes cherchent des compétences ; Beau y pense | Fidélise, fait connaître Finjaro, peut se vendre à des ONG et des programmes d'appui aux PME | v1 : 10 leçons dans le manuel interactif (3 j) ; plateforme complète : 30 j+ ; à discuter avec Alpha | ☐ |
| 4 | **Bilan de la commerçante en une page**, partageable en PDF avec son comptable ou sa banque (chiffre d'affaires, marge, stock, dettes, résultat, joliment mis en page) | La banque demande des chiffres pour un prêt ; le comptable veut une base propre | Le « wow » à montrer : ta boutique, résumée | 2 j | ☐ |
| 5 | **Photos d'articles dans la caisse** et grille de vente (voir compte rendu n° 1) | Vendre plus vite, moins d'erreurs | Parité avec Loyverse et Kyte | 3 j + stockage à décider avec Alpha | ☐ |
| 6 | **Imprimante Bluetooth 58 mm** dans l'application mobile | Le ticket papier reste attendu dans beaucoup de boutiques | Parité caisse | 3 j (greffon Capacitor) | ☐ |
| 7 | **Prêt et tontine** : suivre ce que la boutique doit à la tontine et aux prêteurs, avec échéances et alertes (comme les abonnements, à l'envers) | Le financement informel est la norme ; il n'est nulle part dans les comptes | Différenciant, très demandé sur le terrain (à confirmer par Beau) | 2 j (réutilise le module Abonnements) | ☐ |
| 8 | **Marge sur les ventes Finjaro** : relier un article de la boutique en ligne à sa fiche Accounting pour avoir le coût d'achat | Sans ça, les ventes en ligne affichent 100 % de marge | Rend la liaison honnête | 2 j de chaque côté | ☐ |
| 9 | **Vérification du déploiement et tests en ligne** : ouvrir le réseau des sessions vers accounting.finjaro.net et le projet de test | On vérifie aujourd'hui en local, pas en ligne | Moins de « c'est en ligne » supposés | 0 j (réglage d'environnement par Beau) | ☐ |

Sources de la revue concurrence du jour : [digabloPos Gabon](https://digablopos.fr/fr/blog/free-pos-software-gabon), [Alivaon : logiciels de gestion au Cameroun](https://www.alivaon.com/blog/meilleurs-logiciels-gestion-commerciale-cameroun), [Yorine Facture+ : encaissements mobile money](https://yorine.app/blog/mobile-money-tracer-encaissements/), [FlustockX](https://flustockx.com/blog/logiciel-gestion-stock-afrique/), [SDCSTAT](https://www.sdcstat.com/), [Velko POS](https://velko-pos.com/blog/logiciel-caisse-afrique-guide-complet), [Pirabel Labs : paiement mobile money 2026](https://www.pirabellabs.com/blog/paiement-en-ligne-mobile-money-afrique-ouest-2026).

---

## Idées issues de la veille du 18/09/2026 — à décider par Beau

Chacune : le problème, pour qui, ce que ça vaut, l'effort. Case à cocher quand
Beau tranche. Rien n'est commencé sans son mot.

☐ **1. Rappel de ré-immatriculation pour les utilisateurs camerounais.**
*Problème* : le fichier des contribuables camerounais a changé de plateforme ;
les inscrits sur l'ancienne doivent se ré-immatriculer avant le 31 décembre
2026, sans quoi leur numéro d'identifiant cesse d'être reconnu valide (source
dans `docs/VEILLE.md`). *Pour qui* : tout utilisateur au Cameroun ayant saisi un
numéro d'identifiant unique. *Valeur* : rend un service concret, coûte une
bannière, ne promet rien. *Effort* : petit — un encart daté dans les réglages,
qui disparaît après le 31 décembre. *Réserve* : c'est un rappel, pas un conseil
fiscal ; le texte doit renvoyer à l'administration et ne pas dire quoi faire.

☐ **2. Dire clairement ce que nous NE couvrons PAS en matière de facture
électronique.** *Problème* : en Côte d'Ivoire les contrôles ont commencé le 1er
septembre 2026 sur les petits régimes ; au Gabon l'agrément du logiciel
conditionne la déduction du client ; en France la réception par plateforme
agréée est obligatoire depuis le 1er septembre 2026. Un reçu Finjaro n'est pas
un reçu conforme dans ces pays. *Pour qui* : tout utilisateur dans ces trois
pays. *Valeur* : c'est un risque avant d'être une occasion — un commerçant qui
croirait être en règle grâce à nous serait trompé. *Effort* : petit pour la
mention honnête, très gros pour la conformité réelle. *Décision demandée* :
écrire la mention maintenant, oui ou non.

☐ **3. Prendre la conformité de facturation en zone OHADA comme axe, ou pas.**
*Problème* : Zoho industrialise la conformité pays par pays (seizième édition
pays le 17 septembre 2026) et **aucune édition OHADA francophone n'existe dans
sa liste**. En face, la fédération des commerçants ivoiriens dit publiquement
que ses membres n'ont ni équipement, ni électricité fiable, ni maîtrise de
l'informatique — exactement ce à quoi Finjaro répond. *Pour qui* : les petits
commerçants de la zone franc soumis à une obligation déjà en vigueur. *Valeur*
: potentiellement l'axe le plus fort du produit, parce que le besoin est légal
et daté, pas un confort. *Effort* : gros, et il commence par une démarche
administrative, pas par du code — se raccorder à la plateforme ivoirienne,
obtenir l'agrément gabonais. *Décision demandée* : est-ce que Beau veut
engager ces démarches, et dans quel pays d'abord.

☐ **4. Ne jamais faire saisir un montant à la voix sans relecture.**
*Problème* : les modèles vocaux compacts publiés le 1er juin 2026 pour 19
langues africaines annoncent 38 % d'erreur sur les mots. *Pour qui* : les
vendeuses qui ont les mains prises. *Valeur* : la saisie à la voix reste
séduisante, mais un montant mal entendu fausse une comptabilité. *Effort* :
moyen. *Règle proposée, indépendamment de la décision* : la voix peut proposer,
l'écran doit confirmer le chiffre.

☐ **5. Mesurer combien de vendeuses sont sur un téléphone antérieur à Android
7.0.** *Problème* : la prochaine version de la brique qui fabrique
l'application mobile exige Android 7.0 au minimum. Passer dessus exclurait les
téléphones plus anciens. *Pour qui* : les utilisatrices d'entrée de gamme, qui
sont notre cœur de cible. *Valeur* : évite de couper des gens sans le savoir.
*Effort* : petit — c'est une mesure à faire, pas un développement. *Chiffre
actuel* : **non mesuré**, et je n'en inventerai pas.

☐ **6. Mesurer notre lecture de photos de reçus contre le barème public.**
*Problème* : nous ne savons pas ce que vaut vraiment notre lecture de reçus
photographiés ; un barème public de 10 000 reçus annotés existe depuis le 21
mai 2026. *Pour qui* : les utilisateurs qui photographient une facture au lieu
de la saisir. *Valeur* : remplace une impression par une mesure. *Effort* :
moyen. *Réserve* : le barème ne couvre pas les photos froissées ou floues, qui
sont notre cas réel.
