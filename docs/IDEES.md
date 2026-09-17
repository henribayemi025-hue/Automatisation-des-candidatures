# Idées — revue produit et marché

Chaque idée : le problème, pour qui, ce que ça vaut, l'effort, ce qu'on demande à Beau. Beau coche ☐ → ☑ quand il décide. Les idées viennent des deux sessions, de la concurrence, du terrain. Rien n'est promis : c'est une liste de choix.

## Le problème numéro un, au-dessus de la liste (posé par Alpha, 17/09)

**Personne ne parle aux vendeuses.** Chiffres relevés par Alpha sur la place de marché : cette semaine 92 fiches produit ouvertes, 236 appareils, **zéro commande** ; 3 clics de contact depuis le début de Finjaro. Et des commandes qui restent sans confirmation — une cliente réelle attend depuis treize jours.

Tant que ce trou n'est pas compris, aucune fonctionnalité de plus, d'un côté ou de l'autre, ne change le résultat. Alpha porte le sujet (clients et croissance) ; Claudinette n'ajoute rien à Accounting qui détourne de là sans le dire. Les idées ci-dessous se lisent avec cette réserve : **elles rendent le produit juste, elles ne font pas venir les acheteurs.**

Deux exceptions qui servent quand même ce problème : l'idée 8 (marge sur les ventes Finjaro) parce qu'elle conditionne la mise en production de la liaison, et l'idée 2 (mobile money) parce qu'elle touche l'acte d'achat lui-même.

## Conseils courts au bon moment (version retenue de « Finjaro Learning », accord Claudinette–Alpha, 17/09)

Pas une plateforme de formation maintenant : Beau ne code pas, a un travail à côté, et son attention est la vraie ressource rare. Une version petite, mesurable, sur les deux comportements qui coûtent de l'argent aujourd'hui :

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
