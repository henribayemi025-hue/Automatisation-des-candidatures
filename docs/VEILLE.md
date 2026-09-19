# Veille — innovation, concurrence, règles, IA

Une note par jour, la plus récente en tête. Trois agents fouillent le web en
parallèle (concurrence ; règles et paiements ; technologie et IA), je trie, je
garde ce qui est nouveau et utile.

**Règle qui ne se discute pas : aucun chiffre inventé.** Un taux, un seuil, un
prix ou une date qui ne figure pas dans une source réellement lue n'est pas
écrit ici. Quand l'information manque, c'est écrit « non trouvé ». Sur un sujet
fiscal, un chiffre faux ferait prendre un risque réel à un commerçant.

---

## 19/09/2026

**Ce qui ressort aujourd'hui : je me suis trompée hier, et la correction a une
date de péremption — le 1er octobre, dans douze jours.**

### Ma correction d'hier était fausse

Hier j'ai écrit, et j'ai dit à Beau et à Alpha, que l'information selon laquelle
les messages de service WhatsApp deviendraient payants était fausse. Je m'étais
appuyée sur la phrase de Meta disant qu'ils sont gratuits depuis le 1er novembre
2024.

**J'ai lu la page de Meta moi-même ce matin. Elle dit :**

> « Effective October 1, 2026, Meta will charge on a per-message basis for
> service messages. »

[Page officielle Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages)

Les deux phrases sont vraies : gratuits depuis 2024, facturés à partir du 1er
octobre 2026. J'avais lu la première et conclu que la seconde était une rumeur.
La leçon est étroite et utile : **une page qui confirme un état passé ne
contredit pas une annonce de changement.**

**Ce que ça nous coûte aujourd'hui : rien.** Nos boutons WhatsApp ouvrent des
liens `wa.me`, c'est-à-dire une conversation ordinaire entre deux personnes.
Nous n'utilisons pas l'interface professionnelle de WhatsApp, donc aucune
facturation ne nous touche. **Cela ne devient un coût que le jour où nous y
passerions** — et ce jour-là, la facture commencera au premier message.

### Règles et impôts

- **Burkina Faso : la vente des systèmes de facturation certifiée a commencé le
  7 septembre 2026**, d'abord pour les grandes entreprises et **les éditeurs de
  logiciels de facturation**, puis le 2 novembre et le 1er décembre pour les
  autres. Trente jours de délai après chaque mise en vente ; prix promotionnel
  de 150 000 FCFA jusqu'au 31 décembre. L'obligation elle-même date du 1er
  janvier 2025 (article 564-2 du Code général des impôts).
  [Communiqué relayé](https://burkina24.com/2026/09/07/communique-facture-electronique-certifiee-la-mise-en-vente-des-systemes-de-facturation-demarre-le-7-septembre-2026-au-burkina-faso-3/)
  **Pour nous** : un pays de plus où l'on ne facture pas librement, et où c'est
  en tant qu'**éditeur** qu'il faut s'inscrire — pas en tant que commerçant.

- **Zone CEMAC : un QR code de paiement interopérable est devenu obligatoire**
  par règlement du 8 avril 2026, lancé le 29 juillet à Douala. D'application
  directe dans les six États.
  [Analyse juridique](https://www.village-justice.com/articles/cameroun-code-paiement-interoperable-cemac-entre-imperatif-financiere,58521.html)
  **Pour nous** : l'encaissement au Cameroun et au Gabon ira vers un QR commun
  à tous les opérateurs, pas un QR par opérateur.

- **Et ce même QR entre en tension avec la loi camerounaise sur les données
  personnelles** (loi n° 2024/017) : il traite des identifiants d'appareil, de
  la géolocalisation et des horodatages, alors que l'autorité de contrôle qui
  doit autoriser ces traitements n'est pas encore constituée. Source : article
  de doctrine, pas un texte officiel.
  **Pour nous** : ce que l'application collecte au moment d'un paiement devient
  un sujet de conformité, pas seulement un sujet technique.

- **Wave n'était toujours pas raccordé au paiement instantané de la banque
  centrale au 31 juillet**, à deux mois de l'échéance du 30 septembre.
  [Analyse de presse](https://www.osiris.sn/wave-face-a-la-plateforme-pi-spi-et-l-interoperabilite-refus-ou-dilemme.html)
  · [Communiqué BCEAO](https://www.bceao.int/fr/communique-presse/connexion-la-plateforme-interoperable-du-systeme-de-paiement-instantane-pi-spi-de)
  **Pour nous** : ne pas supposer qu'on atteindra Wave par ce rail au 1er
  octobre. Une intégration directe resterait nécessaire.

- **Une réforme des services de paiement se prépare en zone CEMAC**, avec des
  statuts d'« opérateur de services de paiement » et une entrée en vigueur
  envisagée au 1er janvier 2027. Texte non encore publié.
  **Pour nous** : si un jour l'application encaisse **pour le compte** des
  commerçants, elle pourrait relever d'un statut à faire agréer. Aujourd'hui ce
  n'est pas le cas — l'argent va directement de la cliente à la commerçante.

### Concurrence et obligations ailleurs

- **Kenya : la tenue du stock devient une pièce fiscale.** L'administration
  exige des registres d'achats, ventes, transferts, retours et ajustements dans
  son système de facturation, y compris pour les petits commerces.
  [Source](https://tech-ish.com/2026/09/04/kra-orders-businesses-to-keep-stock-records-in-tims-and-etims/)
  **Pour nous** : cela valide le couplage caisse + stock, et impose de garder
  l'**historique des mouvements**, pas seulement le solde — ce que notre journal
  en ajout seul fait déjà par construction.

- **Brésil : les micro et petites entreprises devront émettre leurs factures de
  service par un émetteur public unique à partir du 1er novembre 2026.**
  [Source](https://plbrasil.com.br/nfse-para-me-e-epp/)
  **Pour nous** : le même schéma se répète partout — un émetteur public auquel
  le logiciel se raccorde. Mieux vaut concevoir **un raccordement générique**
  qu'un branchement par pays.

- **Cameroun : la taxation en temps réel de 2026 ne vise que quatre secteurs**
  (télécoms mobiles, brasserie, cimenteries, jeux), pas les petits commerces.
  [Source](https://ecomatin.net/cameroun-letat-vise-40-milliards-fcfa-des-2026-grace-a-la-taxation-en-temps-reel-des-telecoms-des-jeux-de-la-biere-et-du-ciment)
  **Pour nous** : sur le marché de démarrage, aucune obligation ne presse. La
  conformité peut rester derrière l'usage quotidien.

### Technologie

- **La lecture de texte sur l'appareil est disponible pour notre application
  mobile depuis le 15 septembre** : une suite de greffons pour Capacitor expose
  la reconnaissance de texte de Google, modèles embarqués, **hors ligne, sans
  clé d'interface et sans facturation à la requête**. Taille ajoutée à
  l'application : non chiffrée.
  [Source](https://capawesome.io/blog/capacitor-mlkit-8-2-0-release/)
  **Pour nous** : c'est la meilleure nouvelle de la journée. La première lecture
  d'un reçu photographié pourrait se faire **sur le téléphone, gratuitement**,
  et seuls les cas douteux partiraient au loin. Exactement le profil réseau
  lent, forfait compté.

- **Un modèle de reconnaissance vocale annonce prendre en charge le « français
  africain »**, avec un fonctionnement hors ligne revendiqué. Ni précision ni
  tarif publiés.
  [Source](https://www.itnewsafrica.com/2026/03/intron-launches-voice-ai-for-africa-with-24-languages/)
  **Pour nous** : à essayer avant tout autre modèle vocal, mais la règle d'hier
  tient — un montant dicté se relit à l'écran avant d'être enregistré.

- **Supabase surveille désormais la santé des services** (taux d'erreur sur
  l'authentification, le stockage, les fonctions edge), disponible aujourd'hui.
  [Source](https://supabase.com/changelog/50577-health-check-advisors)
  **Pour nous** : voir une fonction edge partir en erreur sans attendre qu'une
  vendeuse le signale. D'autant plus utile que nos fonctions edge sont communes
  à l'essai et à la production.

### Ce qui n'a pas pu être établi

Les grilles de frais des opérateurs de paiement mobile restent introuvables
dans une source officielle : tout ce qui circule vient de blogs commerciaux.
C'était déjà le trou d'hier, il n'est que partiellement comblé. La piste
suivante est de lire directement les journaux de version des portails
développeurs, que la recherche web n'indexe pas.

---

## 18/09/2026 — première note

Ce qui ressort aujourd'hui, en une phrase : **la loi vient de rattraper les
petits commerçants en Côte d'Ivoire, et leur propre fédération dit qu'ils ne
sont pas prêts pour les raisons exactes auxquelles Finjaro répond.**

### Règles et impôts

- **Côte d'Ivoire : les contrôles sur la facture normalisée électronique ont
  commencé le 1er septembre 2026.** Communiqué de la Direction générale des
  impôts d'août 2026 : opération de contrôle sur tout le territoire, visant les
  régimes RNI, RSI, RME et l'entrepreneur soumis aux taxes communales — donc
  les petits. Les non-inscrits sur la plateforme encourent les amendes du Code
  de procédures fiscales (montants non trouvés dans une source officielle).
  [Communiqué relayé par la presse](https://www.koaci.com/article/2026/08/26/cote-divoire/economie/cote-divoire-operation-de-controle-de-la-facturation-normalisee-electronique-a-partir-du-1er-septembre-voici-les-entreprises-visees_199883.html)
  · le site officiel `fne.dgi.gouv.ci` renvoyait une erreur au moment du contrôle.
  **Pour nous** : besoin d'achat immédiat et daté, mais aussi un piège — un
  reçu Finjaro non raccordé à la plateforme n'est pas un reçu conforme.

- **Et leur fédération demande la suspension des sanctions, le 5 septembre
  2026.** La FENACCI a créé un « Observatoire national de la FNE » en citant le
  manque d'équipement informatique, la non-maîtrise de l'outil, l'électricité et
  l'internet peu fiables.
  [Source](https://www.koaci.com/article/2026/09/05/cote-divoire/economie/cote-divoire-facturation-normalisee-electronique-la-fenacci-lance-lon-fne-et-appelle-a-une-veritable-concertation_200226.html)
  **Pour nous** : ce sont mot pour mot les objections que le hors ligne sur
  téléphone lève. L'argument de vente n'est pas la comptabilité, c'est « ça
  marche sans électricité fiable et sans savoir se servir d'un ordinateur ».

- **Gabon : l'agrément du logiciel par la DGI devient bloquant.** L'article
  P-832 ter du Code général des impôts, introduit par la loi de finances 2026,
  impose l'enregistrement des ventes par des appareils ou logiciels agréés, et
  conditionne la déduction des charges et la récupération de TVA à la réception
  de factures électroniques normalisées. Source : blog d'un cabinet d'avocats,
  pas un texte officiel ; date d'entrée en vigueur et procédure d'agrément non
  trouvées. [Source](https://blog.avocats.deloitte.fr/gabon-les-principales-mesures-de-la-loi-de-finances-pour-2026/)
  **Pour nous** : sans agrément, une facture Finjaro ferait perdre à son client
  sa déduction. Le Gabon n'est pas ouvrable sans cette démarche.

- **Cameroun : le fichier des contribuables a changé de plateforme.** Communiqué
  du ministre des Finances du 10 avril 2026, relayé par l'ordre des
  experts-comptables : les immatriculations passent par ATOM depuis le 1er
  juillet 2026, et les contribuables déjà inscrits sur Harmony doivent se
  ré-immatriculer avant le 31 décembre 2026.
  [Source ONECCA](https://www.onecca.cm/index.php/2026/07/15/modernisation-du-fichier-des-contribuables-ladministration-fiscale-lance-la-plateforme-atom/)
  **Pour nous** : le numéro d'identifiant unique saisi par nos utilisateurs peut
  cesser d'être valide au 1er janvier 2027. Un simple rappel dans l'application
  rend service, sans rien promettre.

- **France : depuis le 1er septembre 2026, toute entreprise assujettie doit
  pouvoir RECEVOIR ses factures par une plateforme agréée** ; les petites
  entreprises doivent ÉMETTRE au 1er septembre 2027.
  [Administration fiscale](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees)
  **Pour nous** : un utilisateur assujetti en France ne peut pas se contenter
  d'un PDF. Il faut dire clairement ce que nous ne couvrons pas.

- **Zone UEMOA : raccordement obligatoire au paiement instantané de la banque
  centrale au 30 septembre 2026** pour les banques et les établissements de
  monnaie électronique. Communiqué BCEAO du 25 juin 2026.
  [Source](https://www.bceao.int/fr/communique-presse/prolongation-du-delai-de-connexion-a-pi-spi)
  **Pour nous** : à terme, un rail d'encaissement interopérable unique au Sénégal
  et en Côte d'Ivoire, au lieu d'une intégration par opérateur.

- **Rien de vérifiable côté opérateurs.** Aucun changement d'interface de
  programmation, de frais ou d'obligation d'identification trouvé dans une
  source officielle datée chez MTN MoMo, Orange Money ou Wave. Les grilles
  tarifaires qui circulent viennent de blogs commerciaux : non retenues.

### Concurrence

- **Zoho a lancé une édition Nigeria de Zoho Books le 17 septembre 2026**, avec
  transmission des factures au portail de l'administration fiscale nigériane.
  C'est sa seizième édition pays. Tarifs non communiqués.
  [Source](https://technext24.com/news/zoho-books-for-vat-e-invoicing-nigeria/)
  **Pour nous** : un éditeur mondial industrialise la conformité pays par pays,
  et **aucune édition OHADA francophone n'existe dans sa liste**. C'est la
  fenêtre à occuper avant lui.

- **Bumpa (Nigeria) est entré au Kenya le 11 juin 2026** avec enregistrement des
  ventes hors ligne, vitrine en ligne, paiement mobile local et messagerie
  WhatsApp et Instagram centralisée.
  [Source](https://techtrendske.co.ke/2026/06/11/nigerias-bumpa-launches-in-kenya-offering-digital-tools-for-msme/)
  **Pour nous** : « caisse hors ligne + boutique en ligne + paiement mobile »
  n'est plus un avantage en soi. Ce qui reste défendable, c'est la comptabilité
  SYSCOHADA et la conformité de facturation, que Bumpa n'offre pas.

- **Nigeria : la facture électronique n'oblige les petites entreprises qu'en
  juillet 2027.** [Source](https://www.vatupdate.com/2026/03/06/nigeria-mandates-e-invoicing-for-smes-sets-timeline-for-full-digital-tax-compliance/)
  **Pour nous** : l'effort de localisation se justifie mieux en zone franc, où
  l'échéance est déjà passée.

- **Aucune annonce récente** chez Loyverse, Kyte, Vendus, Sage, Wave Accounting,
  Kippa, Khatabook ou Vyapar. Des concurrents locaux réels existent en zone
  franc, mais leurs pages sont du marketing sans date : à surveiller, pas à
  citer.

### Technologie et IA

- **Capacitor 8 relève le minimum Android à la version 7.0, et la version 8.5
  impose une migration iOS pour compiler avec le prochain Xcode.** Sorties du 8
  décembre 2025 et du 31 juillet 2026 ; les applications déjà publiées
  continuent de tourner. [Capacitor 8](https://capacitorjs.com/docs/updating/8-0)
  · [8.5](https://ionic.io/blog/capacitor-8-5-released)
  **Pour nous — et ma première formulation était fausse.** J'avais écrit qu'il
  fallait mesurer « avant tout passage ». Alpha m'a corrigée et j'ai vérifié
  dans le dépôt : la place de marché est **déjà** sur Capacitor 8.5 et
  `android/variables.gradle` porte `minSdkVersion = 24`, soit Android 7.0. Ce
  n'est pas une décision à venir, c'est l'état de l'application publiée. La
  vraie question est donc : **qui avons-nous déjà exclu, et pourquoi ne le
  savons-nous pas ?** La table des jetons de notification n'enregistre pas la
  version du système. Chiffre certain : 13 appareils Android et 4 iOS ont
  enregistré un jeton, donc tournent au moins sous Android 7.0. Le reste est
  **non mesuré et non mesurable aujourd'hui**.

- **WhatsApp relève certains tarifs au 1er octobre 2026** dans plusieurs pays,
  dont le Maroc ; montants non chiffrés dans la page lue.
  [Tarifs officiels](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
  **Pour nous** : raisonner pays par pays sur le coût des factures et rappels,
  pas sur un tarif unique.
  **Corrigé au passage** : l'affirmation très répandue selon laquelle les
  messages de service deviendraient payants au 1er octobre est fausse. La page
  de Meta dit que ces conversations sont gratuites depuis le 1er novembre 2024.

- **Un barème public de lecture de reçus existe depuis le 21 mai 2026**
  (10 000 reçus annotés à la main, code et données publiés), qui sépare « lire
  le texte » de « comprendre les lignes d'articles ».
  [Source](https://arxiv.org/abs/2605.22413)
  **Pour nous** : permet de mesurer notre lecture de photos de reçus contre un
  barème public au lieu de croire un fournisseur. Les photos froissées ou
  floues ne sont pas couvertes par ce travail.

- **Des modèles de reconnaissance vocale compacts pour 19 langues africaines
  ont été publiés le 1er juin 2026**, poids compris, avec un taux d'erreur de
  mots annoncé à 38 % contre 64,9 % pour le meilleur grand modèle sans
  entraînement spécifique. La présence du français ou d'une langue du Cameroun
  n'est pas confirmée. [Source](https://arxiv.org/abs/2606.02375)
  **Pour nous** : un petit modèle vocal peut tourner sur le téléphone, mais à
  38 % d'erreur, **jamais de montant saisi à la voix sans relecture à l'écran**.

### Corrections apportées après relecture par Alpha, le même jour

Alpha a relu cette note et repris deux choses. Les deux étaient justes, je les
ai vérifiées moi-même avant de corriger — c'est la règle qu'on s'est donnée :
celle qui voit un chiffre sans provenance reprend l'autre.

1. **Capacitor : ma formulation était fausse**, corrigée ci-dessus. Vérifié dans
   `package.json` et `android/variables.gradle` de la branche de production.
2. **L'occasion ivoirienne n'est pas une campagne.** Sur les boutiques de la
   place de marché il y a **une seule boutique ivoirienne** — Cameroun 50,
   France 7, Canada 2, Togo 1, Côte d'Ivoire 1, Allemagne 1. Chiffre relevé par
   Alpha, vérifié par moi par une lecture en base le 18/09. L'obligation légale
   ivoirienne reste un axe de produit, mais commercialement c'est aujourd'hui un
   appel téléphonique, pas un marché.
3. **Sa remarque que je garde, parce qu'elle vise juste** : cette obligation
   légale ne change pas son ordre de priorités, elle devrait changer le mien.
   Son problème est d'attirer des acheteuses ; le mien est que personne ne
   revient un deuxième jour dans Accounting. Une obligation avec une date
   dessus est la meilleure raison de revenir qu'on ait jamais eue à proposer.
4. **Le bouton WhatsApp en production n'est pas concerné par la hausse
   d'octobre** : il ouvre `wa.me`, donc une conversation ordinaire entre deux
   personnes, sans tarif. La hausse porte sur les messages envoyés par
   l'interface de programmation professionnelle, que nous n'utilisons pas.

### Ce qui n'a pas pu être vérifié aujourd'hui

- Le parcours d'achat sur un téléphone, demandé par Alpha : l'ouverture dans un
  navigateur piloté échoue sur la vérification du certificat de
  l'environnement, et la manipulation nécessaire pour la corriger est refusée
  par la protection de Claude Code. **Alpha a buté exactement au même endroit**
  de son côté, et a renoncé pour la même raison : contourner une protection de
  sécurité pour aller plus vite est précisément ce qu'on ne doit pas faire. Ce
  n'est donc pas un défaut d'une session, c'est une limite commune aux deux.
  Les pages répondent bien en direct (sitemap de 438 adresses lu, morceau
  `AppLauncher` vérifié).
  **Ce qu'Alpha a quand même obtenu sans la base, et qui vaut le détour** : une
  personne qui arrive sur Finjaro pour la première fois voit **trois choses
  empilées avant le site** — un carrousel de bienvenue, un bandeau cookies, et
  une bannière « Finjaro est plus rapide dans l'app · Installer ». Même en
  arrivant directement sur une adresse de recherche, on ne voit pas le
  résultat : on voit ça. Reproductible, capture à l'appui. Le parcours ne
  commence pas là où on croyait.
- Facture électronique au Cameroun : annoncée par la loi de finances 2026, mais
  aucune source ne donne ni article, ni seuil, ni format, ni date. Rien
  d'actionnable.
- Calendrier sénégalais : sites de l'administration en erreur. À reprendre.
