# À vérifier — liste tenue pour Beau

Quand Beau écrit « rappel », on lui redonne cette liste telle quelle, à jour.
Adresse : https://automatisation-des-candidatures.finjaro.workers.dev

## 1. Entrer dans l'application

- [ ] La page de connexion s'affiche quand on arrive (plus d'onboarding surprise).
- [ ] Google et e-mail fonctionnent avec le compte Finjaro habituel.
- [ ] Session expirée : message « votre session s'est terminée », e-mail prérempli.
- [ ] Le carré de 6 points (en haut) ouvre le menu et ramène à finjaro.net,
      depuis la connexion, l'accueil de démarrage et l'application.

## 2. Démonstration à envoyer aux comptables

- [ ] `#/demo/cameroun` ouvre directement trois mois d'activité, sans compte.
- [ ] `#/demo/france`, `#/demo/cote-d-ivoire`, `#/demo` (liste des pays).
- [ ] Bandeau « Démonstration » visible, bouton « Créer mon compte » qui efface
      l'exemple et ramène à la connexion.
- [ ] Les montants sont dans la monnaie du pays choisi.

## 3. Langue et pays

- [ ] Bouton FR / EN sur la connexion, l'accueil de démarrage et les réglages ;
      le choix est gardé après rechargement.
- [ ] Choisir un pays propose sa monnaie, sa taxe, son taux, son plan comptable
      et son début d'exercice ; « Appliquer le profil du pays » dans les réglages.
- [ ] 106 monnaies dans la liste, avec le bon nombre de décimales
      (yen sans centimes, dinar tunisien à 3 chiffres).

## 3 zéro. Design et recherche

- [ ] Les montants respirent (espaces lisibles, chiffres alignés à chasse fixe).
- [ ] Mode sombre : réglages → Apparence (Clair / Sombre / Système), ou le
      bouton dans le menu du compte ; tous les écrans restent lisibles.
- [ ] Cartes compactes partout ; en comptabilité, chaque ligne du bilan et du
      compte de résultat montre son poids dans le total.
- [ ] Ctrl+K (ou la loupe de l'en-tête) : écrans, produits, clients, factures,
      montants. Entrée ouvre le résultat.
- [ ] Caisse : recherche dans les mouvements de la session.

## 3 bis. Accueil professionnel

- [ ] Six indicateurs comparés (CA, marge brute, résultat, trésorerie, créances,
      dettes) ; bouton MTD / YTD / 30 j ; « vs M-1 » ou « vs N-1 » sur chaque carte.
- [ ] Cliquer une carte ouvre l'écran de détail ; courbe miniature dans CA et trésorerie.
- [ ] Meilleures ventes : nom complet qui défile, part de marge, barre.
- [ ] Graphique recettes / dépenses / trésorerie lisible sur téléphone.

## 3 ter. Point de vente

- [ ] Scanner un code-barres (ou taper une référence + Entrée) ajoute l'article,
      avec un bip ; code inconnu signalé sans bloquer.
- [ ] « Client passager » par défaut, « Identifier » seulement si besoin.
- [ ] « Attente » met un panier de côté ; reprise en un clic.
- [ ] Ventes : recherche par numéro, client, article ou montant ;
      Caisse : « Retrouver un ticket ».

## 4. Rattrapage (pour qui ne saisit pas tous les jours)

- [ ] « Jour par jour » : plusieurs lignes, chacune à sa date, ventes et dépenses.
- [ ] « Relevé » : coller des SMS mobile money ou importer un CSV, vérifier le
      sens et le poste proposés, enregistrer.
- [ ] « Photo d'une facture » : l'assistant lit le document et propose la dépense
      (demande d'être connecté).
- [ ] Bandeau d'accueil après trois jours sans saisie.
- [ ] « Reprise d'un bilan existant » : soldes d'ouverture saisis, ou balance
      Excel / CSV importée ; écriture « AN » dans le journal ; bilan vérifié.
- [ ] « Lire un PDF ou une photo » (compte connecté) : déposer le bilan ou la
      balance ; l'assistant remplit les cases et dit si actif = passif.

## 4 bis. Adaptation au métier

- [ ] Restaurant : l'écran des articles s'appelle « Carte », exemples de plats,
      conseil sur le coût des ingrédients.
- [ ] Garage : « Pièces et interventions », conseil sur le devis.
- [ ] Boutique, pharmacie, salon, électronique : mêmes écrans, mots du métier.
- [ ] Les postes de dépense du métier apparaissent en tête des listes.

## 5. Projets (suivi à part : ouverture, chantier, événement, matériel)

- [ ] Menu « Projets » : la démo contient « Ouverture du rayon papeterie »
      (budget 150 000, 83 % utilisé, 5 opérations, marge encore négative).
- [ ] « Nouveau projet » : nom, type, budget, dates, notes.
- [ ] Champ « Projet » dans Vendre, Achats, Dépenses et Rattrapage
      (il n'apparaît que s'il existe au moins un projet en cours).
- [ ] Fiche projet : « Rattacher une opération » déjà saisie, « Détacher ».
- [ ] L'assistant répond à « où en est le projet … ? ».

## 6. Discussion (fil d'équipe)

- [ ] Menu « Discussion » : sur ordinateur, canaux à gauche, fil au centre,
      chiffres du projet (ou membres) à droite ; sur téléphone, pilules.
- [ ] Envoyer un message ; il reste après rechargement ; partagé entre membres.
- [ ] « @assistant … » : réponse dans le fil (IA connecté, moteur local sinon).
- [ ] Connecté : joindre la photo d'une facture → l'assistant propose la dépense,
      bouton « Enregistrer cette dépense » utilisable par n'importe quel membre.
- [ ] Dettes & crédits : « Relancer sur WhatsApp » ouvre WhatsApp avec le
      message déjà écrit (clients qui ont un numéro).

## 7. Comptabilité (à faire regarder par le comptable)

- [ ] Balance : total débit = total crédit.
- [ ] Bilan : « Équilibre du bilan — Vérifié ».
- [ ] Audit : les sept contrôles au vert.
- [ ] Historique : chaque action tracée, avec son auteur.
- [ ] Exports Excel et PDF sur les écrans de rapports.

## 8. Équipe

- [ ] Inviter une adresse e-mail en « Comptable » depuis Équipe.
- [ ] La personne se connecte avec cette adresse et voit l'espace.
- [ ] Elle n'a accès ni aux paramètres ni à l'équipe.

## Ce qui n'est pas encore fait

- Constructeur de requêtes (question en langage courant → tableau).
- Appels audio/vidéo dans la discussion ; réception des messages WhatsApp dans l'app.
- Plusieurs espaces de travail pour un même propriétaire.
- Immobilisations et amortissements automatiques, paie, déclarations fiscales.
- Les 8 photos de métiers pour l'écran d'accueil (attendues de Beau).

## Documents

- docs/SECTEURS.md : comment chaque métier se gère, ce qui est fait, ce qui reste.
- docs/FEUILLE-DE-ROUTE.md : les 100 points classés fait / prochain / plus tard.

## Dernier balayage automatique (11/09/2026, soir)

- Accueil, point de vente (scanner simulé, attente, recherche), reprise de bilan
  (saisie et import CSV), discussion trois colonnes rejoués : OK.
- 27 écrans ouverts en démo à 390 px et 1 280 px : aucune erreur, aucun débordement.
- Parcours rejoués : connexion, session expirée, démo (lien direct par pays),
  FR/EN, profils pays, devises, rattrapage (journées, relevé, photo), rappel,
  projets, discussion, WhatsApp.
- Opérations enchaînées en démo : ouverture de caisse, vente, devis converti,
  bon de commande réceptionné, règlement d'une créance, extourne, clôture de
  caisse, exports Excel (journal, balance, produits), rapport imprimable.
  Après tout cela : audit sans anomalie, bilan vérifié.
- Jeu d'essai rejoué en XAF, EUR, JPY, GBP : balance équilibrée, écart bilan 0,
  aucun stock négatif.
