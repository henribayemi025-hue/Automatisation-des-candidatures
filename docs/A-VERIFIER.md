# À vérifier — liste tenue pour Beau

Quand Beau écrit « rappel », on lui redonne cette liste telle quelle, à jour.
Adresse : https://automatisation-des-candidatures.finjaro.workers.dev

## 1. Entrer dans l'application

- [ ] La page de connexion s'affiche quand on arrive (plus d'onboarding surprise).
- [ ] Google et e-mail fonctionnent avec le compte Finjaro habituel.
- [ ] **« Continuer avec Google »** ramène dans l'application, connecté — plus
      sur la page de connexion. (Cause corrigée : le jeton arrivait dans
      l'ancre `#…`, que la navigation par ancres écrasait.) Si Google refuse,
      la raison s'affiche en rouge au lieu d'un retour muet.
- [ ] Si ça retombe encore sur la connexion : vérifier dans Supabase →
      Authentication → URL Configuration que
      `https://automatisation-des-candidatures.finjaro.workers.dev/` figure
      dans les « Redirect URLs ». Ce réglage n'est pas dans le code.
- [ ] Six points : l'application déjà ouverte est marquée « Ouverte » et n'est
      pas un lien ; « Finjaro » ouvre finjaro.net dans un nouvel onglet.
- [ ] **Numéro de téléphone** : nom + numéro + mot de passe suffisent pour créer
      un compte. Le numéro doit porter son indicatif (+237…), sinon c'est refusé.
      Il n'est PAS vérifié par SMS — c'est le mot de passe qui protège.
- [ ] Le même numéro écrit de trois façons ouvre le même compte ; deux pays
      différents restent deux comptes.
- [ ] Toute la phrase « Pas encore de compte ? Créer un compte » est cliquable.
- [ ] « Ouvrir une démonstration » ouvre vraiment la démonstration (avant, il
      entrait en mode local sur un écran vide), et n'est plus présenté comme
      réservé aux comptables.
- [ ] **Se déconnecter** : dans le menu du compte (en haut à droite, avec le nom
      et une flèche) ET dans Paramètres → Mon compte.
- [ ] Session expirée : message « votre session s'est terminée », e-mail prérempli.
- [ ] Le carré de 6 points (en haut) ouvre le menu et ramène à finjaro.net,
      depuis la connexion, l'accueil de démarrage et l'application.

## 1 bis. Visite guidée (nouveau)

- [ ] À la première ouverture (démo ou juste après l'inscription), une carte
      « Visite guidée · 1/8 » apparaît en bas à droite. Suivant / Précédent
      changent d'écran ; Terminer la ferme ; elle ne revient pas toute seule.
- [ ] Relance : menu du compte (en haut à droite) → « Visite guidée », ou le
      bouton du bandeau Démonstration, ou Paramètres → « Voir la visite guidée
      avec ces mots ».
- [ ] Les mots suivent le métier : import-export → « Marchandises » et l'étape
      Achats avec les frais d'approche ; salon → « Prestations », 7 étapes,
      sans Achats ; restaurant → « Carte ».
- [ ] Paramètres → Activité : une note dit tout de suite ce que le menu
      affiche maintenant (ex. « Vendre · Marchandises · Clients & fournisseurs
      · Ventes »).

## 2. Démonstration à envoyer aux comptables

- [ ] `#/demo/cameroun` ouvre directement trois mois d'activité, sans compte.
- [ ] **Un lien par métier**, pour vérifier chacun :
      `#/demo/cameroun/boutique` · `/restaurant` · `/coiffure` · `/garage` ·
      `/services` · `/pharmacie` · `/electronique` · `/import-export`.
      Ouvrir un second lien change le métier sans recharger ni dupliquer les
      données. La page `#/demo` propose les métiers avant les pays.
- [ ] `#/demo/france`, `#/demo/cote-d-ivoire`, `#/demo` (liste des pays).
- [ ] Bandeau « Démonstration » visible, bouton « Créer mon compte » qui efface
      l'exemple et ramène à la connexion.
- [ ] Les montants sont dans la monnaie du pays choisi.

## 3. Langue et pays

- [ ] Bouton FR / EN sur la connexion et l'accueil de démarrage ; dans les
      réglages, deux boutons en toutes lettres **« Français » / « English »**,
      la langue active surlignée, et une phrase qui dit laquelle est en cours
      (avant, « Français · English » n'était qu'un texte : cliquer dessus ne
      faisait rien). Le choix est gardé après rechargement.
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
- [ ] Panier vide : la carte explique qu'on scanne ou qu'on clique un article,
      et que la quantité s'ajuste avec − et + ; bouton « Tout vider ».
- [ ] Prix affichés taxe comprise (réglages → « Mes prix affichés incluent déjà
      la taxe ») : le client paie l'étiquette, la ligne « dont TVA » montre la
      part de taxe, et le chiffre d'affaires est hors taxe.
- [ ] Ouvrir deux fois le même lien de démonstration ne double plus les articles.

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

- [ ] Paramètres → **Activité** change le métier sans se déconnecter.
- [ ] Salon de coiffure : le menu dit « Encaisser », « Prestations »,
      « Clientes & fournisseurs », « Prestations réalisées » ; **Stock et Achats
      disparaissent** du menu, et la fiche d'une prestation ne demande plus de
      quantité.
- [ ] Restaurant : « Carte » et « Additions ». Garage : « Interventions ».
- [ ] Paramètres → case **« Je suis des quantités en stock »** : cochée, les
      écrans Stock et Achats reviennent, même pour un salon qui revend des
      produits.

- [ ] Restaurant : l'écran des articles s'appelle « Carte », exemples de plats,
      conseil sur le coût des ingrédients.
- [ ] Garage : « Pièces et interventions », conseil sur le devis.
- [ ] Boutique, pharmacie, salon, électronique : mêmes écrans, mots du métier.
- [ ] Les postes de dépense du métier apparaissent en tête des listes.

## 4 ter. Fiches clients et fournisseurs

- [ ] « Modifier » rouvre la fiche (nom, téléphone, e-mail, adresse).
- [ ] « Supprimer » une fiche jamais utilisée : effacée définitivement.
- [ ] « Supprimer » une fiche qui a des ventes, des achats ou une dette :
      la fenêtre dit combien d'opérations, propose « Archiver », et prévient
      s'il reste un solde en cours.
- [ ] Une fiche archivée disparaît des listes, de la caisse, des achats et de
      la recherche ; les factures déjà émises gardent le nom.
- [ ] « Voir les archivés » → « Réactiver » la remet dans la liste.

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

## 6 bis. Personnel (nouveau)

- [ ] Menu « Personnel » : la démo contient Awa (au mois, 85 000) et Paul
      (à la journée, 3 500), avec six semaines de pointage et une avance
      de 20 000 en cours.
- [ ] « Nouvelle personne » : nom, poste, au mois / à la journée / à l'heure.
- [ ] Onglet « Présences » : un clic par personne et par jour ; repointer
      corrige au lieu d'ajouter une deuxième ligne.
- [ ] « Avance » : l'argent versé apparaît en « Avance en cours », pas en
      dépense — c'est une créance sur la personne.
- [ ] Onglet « Paie » : le brut est calculé (salaire du mois, ou jours
      pointés × taux), les avances sont retenues, le net s'affiche.
- [ ] « Le net est versé aujourd'hui » décoché : la paie reste « Reste due »,
      et le bouton « Verser » la solde plus tard.
- [ ] Journal : écriture `PAIE-AAAA-MM` — la charge est au BRUT, jamais au net.
- [ ] Après une paie : audit sans anomalie, bilan toujours vérifié.
- [ ] Ce qui n'y est PAS : cotisations sociales, bulletin de paie
      réglementaire, déclarations. C'est assumé, pas oublié.

## 7 pré. Pour le fiscaliste et pour un import-export (nouveau)

À montrer en premier à Gautier (fiscaliste) et à Duviol (import-export).

- [ ] **Déclaration de TVA** (menu Comptabilité, mode expert) : par mois,
      collectée sur les ventes, déductible sur les achats et la douane, et
      le net à reverser ou le crédit à reporter. Chaque ligne est une écriture.
- [ ] Métier **« Import-export / négoce »** dans la liste des activités :
      « Marchandises », conseil sur les frais d'approche.
- [ ] Achats → « Nouveau bon de commande » → case **« Achat à l'étranger »** :
      devise de la facture + taux ; les prix des lignes se saisissent dans
      cette devise et la conversion s'affiche à côté.
- [ ] **Frais d'approche** : douane, fret, transitaire, assurance, manutention,
      autres ; « TVA payée en douane » ; « payés avec ».
- [ ] Le total affiche Facture → converti, Marchandise, Frais, **Coût rendu
      magasin**.
- [ ] À la réception : le stock entre au coût rendu (réparti sur les articles
      au prorata), la TVA de douane est déductible, **aucune TVA locale n'est
      inventée sur une facture étrangère**, et le fournisseur n'est dû que de
      sa facture. Journal : ligne « Douane, fret, transit » au crédit de la
      banque.
- [ ] La démo Cameroun contient une importation « Shenzhen Light Export » en
      dollars avec douane, fret et transitaire ; bilan toujours vérifié.
- [ ] Ce qui n'est PAS fait : écart de change au règlement (si le taux a bougé
      entre la commande et le paiement) ; déclaration officielle DGI/DSF.

## 7 bis. Ce qu'un comptable réclamait (nouveau)

- [ ] **Immobilisations** (menu « Mon argent ») : la démo contient un
      congélateur à 720 000 amorti sur 5 ans, déjà amorti de trois mois.
- [ ] « Nouveau bien » : nom, valeur, durée ; cocher « déjà enregistré dans
      l'application » si l'achat a été saisi ailleurs, sinon l'écriture
      d'acquisition est passée toute seule.
- [ ] « Passer la dotation du mois » : le montant proposé est le cumul dû ;
      un mois oublié se rattrape tout seul ; jamais deux fois la même période.
- [ ] « Sortir » un bien : prix de vente, gain ou perte calculé, écriture passée.
- [ ] **Rapprochement bancaire** : choisir le compte et la période, saisir le
      solde du relevé ; l'écart doit tomber à zéro une fois tout pointé.
- [ ] Coller un relevé (ou des SMS mobile money) puis « Pointer ce qui
      correspond » : seules les correspondances certaines sont cochées.
- [ ] **Clôture de l'exercice** : la période proposée est modifiable ; une
      année encore en cours ne se clôture pas.
- [ ] Après clôture : comptes 6 et 7 à zéro, résultat passé en « Report à
      nouveau », bilan toujours vérifié, et compte de résultat de l'année
      toujours lisible dans les rapports.
- [ ] « Rouvrir » extourne les écritures de clôture — rien n'est effacé.
- [ ] **Export FEC**, depuis la clôture et depuis Documents : fichier texte de
      18 colonnes, total débit = total crédit.

## 8. Équipe

- [ ] Inviter une adresse e-mail en « Comptable » depuis Équipe.
- [ ] La personne se connecte avec cette adresse et voit l'espace.
- [ ] Elle n'a accès ni aux paramètres ni à l'équipe.

## Ce qui n'est pas encore fait

- Constructeur de requêtes (question en langage courant → tableau).
- Appels audio/vidéo dans la discussion ; réception des messages WhatsApp dans l'app.
- Plusieurs espaces de travail pour un même propriétaire.
- Bulletins de paie réglementaires, cotisations sociales et déclarations
  fiscales pré-remplies : un autre métier, à faire pays par pays.
  (Le suivi du personnel, des avances et de la paie versée, lui, est fait.)
- Agenda et rendez-vous ; tâches à cocher ; factures qui reviennent chaque
  mois ; mode « sans stock » pour les métiers de service.
- Lettrage automatique facture ↔ règlement, avoirs et retours de marchandise.
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
