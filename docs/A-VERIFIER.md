# À vérifier — liste tenue pour Beau

Quand Beau écrit « rappel », on lui redonne cette liste telle quelle, à jour.
Adresse : https://accounting.finjaro.net

## 1. Entrer dans l'application

- [ ] La page de connexion s'affiche quand on arrive (plus d'onboarding surprise).
- [ ] Google et e-mail fonctionnent avec le compte Finjaro habituel.
- [ ] **« Continuer avec Google »** ramène dans l'application, connecté — plus
      sur la page de connexion. (Cause corrigée : le jeton arrivait dans
      l'ancre `#…`, que la navigation par ancres écrasait.) Si Google refuse,
      la raison s'affiche en rouge au lieu d'un retour muet.
- [ ] Si ça retombe encore sur la connexion : vérifier dans Supabase →
      Authentication → URL Configuration que
      `https://accounting.finjaro.net/` figure
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

## Audit complet (12/09/2026)

Ce qui a été passé au crible : les 32 écrans, dans les 8 métiers de la
démonstration, à 1 280 px et à 390 px, en clair et en sombre, en français et
en anglais ; puis chaque bouton cliqué un par un (sauf les destructeurs).

- Erreurs JavaScript, débordement horizontal, texte coupé, bloc blanc en mode
  sombre, variable non remplacée : **aucun**.
- Boutons morts : **aucun**. Les vingt « sans effet » relevés par la machine
  étaient des onglets déjà actifs, des filtres déjà choisis, un envoi à vide,
  ou un export qui ouvre un autre onglet.
- Corrigé — **la démonstration vendait du riz chez le coiffeur.** Chaque
  métier a maintenant son propre jeu d'articles (coupes et tresses au salon,
  plats au restaurant, vidange et plaquettes au garage, médicaments en
  pharmacie, tuiles et ciment en import-export…). Le nom de l'entreprise de
  démonstration suit le métier.
- Corrigé — la visite guidée s'ouvrait par-dessus la caisse en parlant de
  l'accueil : elle commence sur l'accueil.
- Corrigé — chez le coiffeur, la caisse s'appelle « Encaisser », l'aide et le
  panier vide parlent de prestations, plus d'articles ni de stock.
- Corrigé — sur téléphone, 73 boutons en texte étaient trop petits pour le
  doigt (moins de 30 px). Tous font au moins 36 px maintenant : 0 sur 931.
- Corrigé — en anglais : onglets du stock, « Total des créances », le badge
  « au » des états, le message d'audit « Solde négatif », les noms de pays
  dans les réglages, quatre intitulés de comptes (report à nouveau,
  amortissements, avances au personnel, dotations).
- Reste en français quoi qu'il arrive, et c'est voulu : le contenu de la
  démonstration (noms d'articles, libellés d'écritures, fournisseurs).

Vérifications comptables rejouées après ces changements : jeu d'essai 383
événements, balance équilibrée, écart bilan 0, aucun stock négatif ; TVA,
tiers, clôture, FEC, paie, import : tous OK.

## Retours du comptable (14/09/2026)

Ce qu'il a dit, et ce qui a été fait :

- **« Je valide une vente, rien ne se passe. »** Vrai : seul un petit message
  en haut de page s'affichait, invisible sur téléphone. Maintenant le **ticket
  de caisse** s'ouvre par-dessus l'écran après Valider : lignes, total, payé,
  reste ; boutons Imprimer (format 80 mm), Envoyer sur WhatsApp, Vente
  suivante. Un devis ouvre le même écran avec « Voir les devis ».
- **« Trop de données à l'accueil. »** Les six chiffres restent ; la courbe,
  les meilleures ventes et « À traiter » sont passés en trois onglets, un seul
  visible à la fois.
- **« Il faut un manuel. »** docs/MANUEL.md, 22 sections, écran par écran :
  à quoi ça sert, pas à pas, ce que ça écrit en comptabilité, questions
  fréquentes. Dans l'application : menu du compte → Manuel d'utilisation,
  bouton « Manuel » du bandeau de démonstration, Paramètres. Imprimable ou
  enregistrable en PDF.
- **« Une caisse n'est jamais négative. »** Deux choses. La démonstration
  passait le loyer avant l'apport : l'apport est daté plus tôt et couvre la
  caisse, le compte mobile et la banque (vérifié jour par jour :
  scripts/cash-check.ts, minimum 0 sur les trois). Et dans Dépenses,
  l'application prévient avant d'enregistrer plus que le compte ne contient à
  cette date, avec le disponible ; on peut forcer, l'audit le signale.
- **« Ce n'est pas une balance, c'est un compte en T. »** La balance a
  maintenant **six colonnes** : solde d'ouverture, mouvements, solde de
  clôture, chacun en débit et crédit ; l'ancienne vue reste sous « Débit,
  crédit, solde ». L'export Excel suit. Contrôle : ouverture, mouvements et
  clôture équilibrés chacun.
- **« Les numéros de compte ne respectent pas la nomenclature. »**
  Immobilisations : un compte par nature selon la catégorie du bien —
  241 matériel et outillage, 2442 informatique, 2444 mobilier, 245 transport,
  231 bâtiments, 244 autres — et l'amortissement correspondant (2841, 28442,
  28444, 2845, 2831, 2844). Report à nouveau : 121 créditeur, 129 débiteur
  (utilisé à la clôture en cas de perte). PCG et plan générique alignés.
  La dotation de la démonstration passait par « charges diverses » : corrigé
  (681 / 28444).

Non fait, à lui demander : « le plan comptable est précédé des 0000 » — on n'a
pas compris s'il parle de comptes à longueur fixe (4431000) ou d'autre chose.

## Régime d'imposition (retour du comptable, 14/09/2026)

- **Trois régimes** à l'inscription et dans Paramètres : réel (TVA facturée,
  déduite, déclarée), IGS (pas de TVA, écran de déclaration retiré du menu),
  non assujetti. Choisir IGS coupe la taxe partout ; revenir au réel la
  rallume.
- **Précompte sur achat** : taux dans Paramètres (régime IGS), proposé sur
  chaque bon de commande et modifiable. À la réception : stock sans le
  précompte, 4492 « État — acomptes et précomptes d'impôt » au débit,
  fournisseur au crédit du total dû. Cumul affiché dans l'écran TVA.
- Aucun taux n'est pré-rempli : il dépend du régime de l'acheteur et de
  celui du vendeur, c'est au fiscaliste de le dire.
- Vérifié par scripts/regime-check.ts : IGS sans TVA collectée ni déductible,
  précompte 2 % sur 200 000 = 4 000 en 4492, fournisseur 204 000, coût
  unitaire inchangé, bilan équilibré, retour au réel.
- Pas fait : le côté **vendeur** (un grossiste qui retient lui-même le
  précompte sur ses ventes). À faire quand le fiscaliste aura confirmé le
  traitement voulu.

## Sans réseau et installation (15/09/2026)

Demande de Beau : « comme les applis genre Money Manager, quelqu'un télécharge
et tout marche même sans internet ; les parties obligées d'être connectées le
demandent ».

Ce qui est en place :

- L'application se garde sur l'appareil dès la première ouverture en ligne.
  Ensuite elle **s'ouvre et fonctionne sans réseau** : vente, ticket imprimé,
  caisse, dépenses, stock, journal, balance, bilan.
- Elle **s'installe** sur l'écran d'accueil du téléphone et sur le bureau d'un
  ordinateur, dans sa propre fenêtre. Paramètres → « Sur cet appareil ».
- Bandeau « Pas de réseau » qui dit qu'on peut continuer, et compte les
  opérations qui partiront à la reconnexion. Il disparaît au retour du réseau.
- Bandeau « Nouvelle version prête » avec un bouton **Mettre à jour** :
  jamais de rechargement au milieu d'une vente.
- L'assistant, hors réseau, répond avec le moteur local au lieu d'attendre un
  appel qui va échouer, et le dit.

À tester par Beau :

1. Ouvrir le lien, attendre quelques secondes, **fermer l'onglet**.
2. Couper les données mobiles et le wifi.
3. Rouvrir le lien : l'application doit s'ouvrir, avec ses chiffres.
4. Faire une vente : le ticket doit sortir.
5. Remettre le réseau : le bandeau disparaît.
6. Paramètres → « Sur cet appareil » → **Installer l'application** (sur
   ordinateur Chrome ou Edge, et sur Android). Sur iPhone : Partager puis
   « Sur l'écran d'accueil ».

Vérifié en machine, à 1 280 px et 390 px : service worker actif, réouverture
sans réseau, vente et ticket hors réseau, balance équilibrée hors réseau,
police conservée, bandeaux affichés et retirés, mise à jour proposée puis
appliquée, aucune erreur JavaScript.

Ce qui demande toujours le réseau, et le dit : assistant complet, création et
connexion de compte, travail à plusieurs.

## Nouvelle adresse (15/09/2026)

L'application a maintenant son nom : **https://accounting.finjaro.net**
(domaine personnalisé ajouté au worker Cloudflare, zone finjaro.net).

L'ancienne adresse `automatisation-des-candidatures.finjaro.workers.dev`
continue de répondre : rien ne casse pendant la transition.

À faire côté Supabase, sinon la connexion Google rebondira sur la nouvelle
adresse comme elle le faisait sur l'ancienne. **Un seul réglage, et on
n'en déplace aucun autre :**

- Authentication → URL Configuration → **Redirect URLs**, AJOUTER :
  `https://accounting.finjaro.net/**`
  (garder les entrées existantes tant que les autres adresses servent).

**Le Site URL ne se touche pas.** Il reste `https://finjaro.net`.

J'avais écrit ici le contraire le 15/09, et c'était faux. Le Site URL est
global au projet Supabase, pas propre à une application, et il sert de base
aux liens des e-mails d'authentification. Le `signUp()` de la place de marché
ne passe aucun `emailRedirectTo` : le lien de confirmation de chaque nouvelle
inscription sur finjaro.net est donc construit à partir du Site URL. Le
déplacer aurait envoyé toute personne s'inscrivant sur finjaro.net vers
l'outil de comptabilité, sans pouvoir valider son compte. Voir CLAUDE.md.

À savoir : les données d'une application web sont rangées par adresse. Ce qui
a été saisi en test sur l'ancienne adresse ne suit pas sur la nouvelle. Sans
conséquence aujourd'hui, personne ne l'utilise encore pour de vrai.

Reste à faire ailleurs, hors de ce dépôt : le sélecteur d'applications de la
place de marché pointe peut-être encore vers l'ancienne adresse. À vérifier
dans le dépôt de finjaro.net, que je ne touche pas.
