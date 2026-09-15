# Simulation — passe intermédiaire : volume, simultanéité, hors ligne (faits)

Générée le 2026-09-15 par `npx vite-node scripts/sim-volume.ts`, en mémoire, à travers le moteur réel. Aucune base touchée. Ce qui demande un réseau réel (5 puis 20 caissiers sur Supabase, réseau lent) n'est pas mesuré ici : voir la fin du document.

## Volume : une boutique à dix ans

État construit : 12 ans, 118 190 événements, 214 240 écritures, 102 668 ventes, 6 articles (simulation 260 s, copie désactivée).

| Écran ou opération | Ce que fait la page | Temps |
|---|---|---:|
| Journal, sans filtre | tri de toutes les écritures | 88 ms |
| Journal, exercice en cours | filtre + tri | 10 ms |
| Balance générale | 16 comptes mouvementés | 43 ms |
| Grand livre, compte caisse, tout | 78 902 lignes + balance des comptes utilisés | 97 ms |
| Bilan | | 38 ms |
| Compte de résultat de l’exercice | | 9 ms |
| Accueil (indicateurs + meilleurs articles) | | 132 ms |
| Contrôles d’audit | | 180 ms |
| FEC de l’exercice | 0.1 Mo de texte | 23 ms |
| Écriture du cache local (JSON) | 194.3 Mo | 2121 ms |
| Lecture du cache local (JSON + normalisation) | | 1588 ms |
| Empreinte de scellement (hashState) | 241e5e63… | 1073 ms |
| **Une vente en caisse** (applyEvent avec copie réelle de l’état) | | **3670 ms** |
| **Ouverture de l’espace : rejeu de 300 événements** après le dernier instantané | | **804.2 s** |

Mémoire du processus après construction : 4200 Mo.

## Catalogue : 20 000 références

Création de 20 000 articles (20 000 événements product.save, copie désactivée) : 6.2 s ; état 19.4 Mo ; 20 000 écritures d’entrée en stock.
Recherche en caisse « référence 1999 » (même filtre que PointOfSale.tsx, parcours des 20 000 noms) : 7 ms.
Une vente avec ce catalogue (copie réelle) : 156 ms. Le catalogue est copié entier à chaque ticket.

## Deux appareils sans réseau sur le même espace

- Aucune opération perdue : serveur 44 ventes, appareil A 44, appareil B 44 (44 attendues). Écritures : 91 / 91 / 91.
- Aucune comptée deux fois : 44 identifiants distincts sur 44.
- Même état à la fin ? Empreinte serveur b7ad75c7, A b7ad75c7, B 8e8941aa → **différentes** (l’empreinte couvre les écritures, dont la référence, qui est le numéro de ticket : les deux appareils ont deux journaux différents jusqu’au prochain rechargement depuis le cloud).
- Numéros de tickets : la vente B-s1 est imprimée « FA-00001 » sur l’appareil B, s’appelle « FA-00001-B » sur l’appareil A et « FA-00001-B » après rechargement depuis le cloud. Les deux appareils numérotent depuis le même compteur local ; le moteur ajoute un suffixe au second arrivé (uniqueNumber).
- Stock des couches (3 en rayon, 2 vendues sur chaque appareil) : -1 après synchronisation ; aucun refus, aucun signal.
- Le même événement appliqué deux fois (réponse HTTP perdue, puis message temps réel) : 2 vente(s) pour 1 réelle, 4 écritures ajoutées. applyEvent n’est pas idempotent : la garde contre le doublon est uniquement dans collab.tsx (`applied`), remplie après la réponse du serveur.
- Renvoi d’un événement déjà écrit (réponse perdue puis nouvel essai) : `finia_events.id` est clé primaire (vérifié sur la production, lecture seule), l’insertion renvoie une erreur, `pushEvent` répond faux et l’événement reste dans la file locale à chaque tentative ; le voyant reste sur « en attente » sans fin.
- Déconnexion avec une file en attente : `signOut` efface `finia.outbox.*` (collab.tsx) ; les ventes non encore envoyées sont perdues sans avertissement.

## Clôture lancée pendant une vente

Exercice 2026-01-01→2026-12-31 clôturé (résultat 102 915 612). Une vente datée du 2026-12-31, validée après la clôture (caissier qui finit son ticket pendant que la gérante clôture) : acceptée. Compte de résultat de l’exercice clos avant 102 915 612, après 102 918 000 ; le résultat enregistré reste 102 915 612.

## Non mesuré ici (demande le projet de test en réseau)

- 5 puis 20 caissiers simultanés sur le même espace : chaque appareil reçoit chaque événement des autres par le canal temps réel et l’applique avec une copie complète de l’état (`applyRemote` → `applyEvent`). Le coût par événement reçu est celui mesuré plus haut pour une vente. À 20 caissiers et 120 tickets par jour chacun, un appareil applique 2 400 événements par jour reçus des autres.
- Le propriétaire renvoie l’état complet dans `finia_workspaces.data` tous les 300 événements (`COMPACT_AFTER`), quel que soit l’appareil qui les a produits : avec 20 caissiers, toutes les dix minutes en pleine journée, pour la taille de cache mesurée plus haut.
- Le schéma `finia_` n’existe pas sur le projet de test qiyvoaljqmbfldephobp ; y rejouer ces scénarios demande d’y créer les tables (migration sur le projet de test, aucune autre application n’y est).
