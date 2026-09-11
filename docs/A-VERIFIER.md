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

## 4. Rattrapage (pour qui ne saisit pas tous les jours)

- [ ] « Jour par jour » : plusieurs lignes, chacune à sa date, ventes et dépenses.
- [ ] « Relevé » : coller des SMS mobile money ou importer un CSV, vérifier le
      sens et le poste proposés, enregistrer.
- [ ] « Photo d'une facture » : l'assistant lit le document et propose la dépense
      (demande d'être connecté).
- [ ] Bandeau d'accueil après trois jours sans saisie.

## 5. Projets (suivi à part : ouverture, chantier, événement, matériel)

- [ ] Menu « Projets » : la démo contient « Ouverture du rayon papeterie »
      (budget 150 000, 83 % utilisé, 5 opérations, marge encore négative).
- [ ] « Nouveau projet » : nom, type, budget, dates, notes.
- [ ] Champ « Projet » dans Vendre, Achats, Dépenses et Rattrapage
      (il n'apparaît que s'il existe au moins un projet en cours).
- [ ] Fiche projet : « Rattacher une opération » déjà saisie, « Détacher ».
- [ ] L'assistant répond à « où en est le projet … ? ».

## 6. Comptabilité (à faire regarder par le comptable)

- [ ] Balance : total débit = total crédit.
- [ ] Bilan : « Équilibre du bilan — Vérifié ».
- [ ] Audit : les sept contrôles au vert.
- [ ] Historique : chaque action tracée, avec son auteur.
- [ ] Exports Excel et PDF sur les écrans de rapports.

## 7. Équipe

- [ ] Inviter une adresse e-mail en « Comptable » depuis Équipe.
- [ ] La personne se connecte avec cette adresse et voit l'espace.
- [ ] Elle n'a accès ni aux paramètres ni à l'équipe.

## Ce qui n'est pas encore fait

- Constructeur de requêtes (question en langage courant → tableau).
- Chat d'équipe avec photos et assistant dans le fil (prochaine étape).
- Plusieurs espaces de travail pour un même propriétaire.
- Immobilisations et amortissements automatiques, paie, déclarations fiscales.
- Les 8 photos de métiers pour l'écran d'accueil (attendues de Beau).
