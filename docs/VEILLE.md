# Veille — innovation, concurrence, règles, IA

Une note par jour, la plus récente en tête. Trois agents fouillent le web en
parallèle (concurrence ; règles et paiements ; technologie et IA), je trie, je
garde ce qui est nouveau et utile.

**Règle qui ne se discute pas : aucun chiffre inventé.** Un taux, un seuil, un
prix ou une date qui ne figure pas dans une source réellement lue n'est pas
écrit ici. Quand l'information manque, c'est écrit « non trouvé ». Sur un sujet
fiscal, un chiffre faux ferait prendre un risque réel à un commerçant.

---

## 09/10/2026 (couvre du 07 au 09/10)

### Concurrence
- **SplashArk, Cameroun (communiqué du 08/10/2026)** :
  - société américaine qui fait du Cameroun son premier marché africain ;
  - application gratuite pour vendre et prendre des réservations avec acompte
    (« 35 métiers », selon le communiqué) ;
  - paiement par mobile money (via pawaPay) ou par carte (via Stripe), l'argent
    étant retenu jusqu'à la livraison ;
  - un assistant IA pour fixer les prix ; français et anglais.

  C'est un communiqué rédigé par le fondateur, pas un article : aucune
  traction n'est mesurée.
  [EIN Presswire](https://www.einpresswire.com/article/945126301/splashark-lance-au-cameroun-son-appli-pour-vendre-r-server-et-tre-pay-par-mobile-money)
  → Concurrent direct de la place de marché sur notre marché de démarrage. Il
  n'a ni caisse ni comptabilité : c'est là que Finjaro se distingue.
- **Bujeti « Brain », Nigeria et Kenya (article du 08/10/2026 ; ouvert à tous
  depuis le 30/09)** : quatre « coéquipiers » IA pour les équipes financières.
  L'un lit les factures et les reçus ; un autre relance les impayés par e-mail,
  SMS et WhatsApp, et peut proposer un échéancier. Aucun ne peut déplacer
  d'argent seul.
  [Disrupt Africa](https://disruptafrica.com/2026/10/08/yc-backed-bujeti-launches-ai-teammates-to-take-manual-work-off-african-finance-teams/)
  → Deuxième signal en deux jours après BharatNXT : la relance des impayés par
  WhatsApp devient une attente de base. Voir l'idée du 08/10 dans IDEES.md.
- **Inde (articles du 08/10/2026, rien de décidé)** :
  - les frais sur les paiements UPI aux commerçants pourraient passer du
    15/10 au 01/01/2027
    ([Inc42](https://inc42.com/buzz/upi-mdr-rollout-may-be-deferred-to-january-2027-amid-pushback-by-retailers/)) ;
  - le GST Council a donné un accord de principe à une seule déclaration
    annuelle pour les entreprises jusqu'à « Rs 5 crore » de chiffre d'affaires
    ([Economic Times](https://economictimes.indiatimes.com/news/economy/policy/gst-reforms-16-lakh-small-businesses-may-get-annual-return-option-easier-e-commerce-selling/articleshow/134799885.cms)).

  → Rien à faire tant que Finjaro n'entre pas en Inde. Le jour venu, UPI y
  sera le moyen de paiement par défaut.
- **Brésil (article du 08/10/2026)** : à partir du 01/11/2026, les micro et
  petites entreprises du Simples Nacional qui facturent des services passent
  par l'émetteur national de NFS-e, en ligne ou par API.
  [Contadores](https://www.contadores.cnt.br/noticias/tecnicas/2026/10/08/emissao-de-nfs-e-o-que-muda-para-me-e-epp-em-novembro.html)
  → Une seule API nationale au lieu de systèmes municipaux : l'entrée au
  Brésil coûterait moins cher côté facture. Simple note.

### Règles et paiements
- **Pannes de mobile money (07 et 08/10/2026)**, d'après les pages d'état des
  agrégateurs (pas des opérateurs) :
  - MTN MoMo, 07/10, de 03:49 à 05:57 UTC, dans plusieurs pays dont le
    Cameroun, la Côte d'Ivoire, le Bénin, la RDC et le Nigeria
    ([pawaPay](https://status.pawapay.io/incidents/t0q35cjjj3d4)) ;
  - Orange Money Cameroun, 08/10, de 16:41 à 20:29 UTC, encaissements et
    reversements ([pawaPay](https://status.pawapay.io/incidents/pj0944rvrnmp)) ;
  - Orange Money Burkina Faso, 07/10, de 12:40 à 16:23 UTC
    ([Flutterwave](https://status.flutterwave.com/incidents/sthd1xbbphpz)).

  → Trois pannes de plusieurs heures en deux jours. Dans la caisse, une vente
  « Mobile money » compte comme encaissée tout de suite, même si l'argent
  n'est jamais arrivé. Idée ajoutée dans IDEES.md.
- **BCEAO (deux communiqués du 08/10/2026)** :
  - les Trésors publics de l'UEMOA se branchent sur PI-SPI (salaires,
    subventions, impôts et taxes), la Côte d'Ivoire d'abord
    ([BCEAO](https://www.bceao.int/fr/communique-presse/connexion-des-tresors-publics-la-plateforme-interoperable-du-systeme-de-paiement)) ;
  - la liste des établissements de paiement agréés au 31/08/2026 compte
    « trente-quatre (34) structures »
    ([BCEAO](https://www.bceao.int/fr/communique-presse/liste-des-etablissements-de-paiement-agrees-dans-lumoa-au-31-aout-2026)).

  → L'import de relevés devra un jour reconnaître un impôt payé par PI-SPI.
  Côté place de marché : vérifier qu'un partenaire d'encaissement figure sur
  la liste avant de signer.
- **Gabon (dépêche AGP du 08/10/2026)** : la Banque mondiale recommande
  d'« étendre progressivement Digitax aux petites entreprises ». C'est une
  recommandation, pas une obligation.
  [AGP](https://agpgabon.ga/gabon-finances-publiques-la-banque-mondiale-preconise-une-refonte-numerique-de-ladministration-fiscale/)
  → À surveiller pour un futur export, sans rien promettre dans l'interface.
- **Côte d'Ivoire, à confirmer** : un site privé (Lookuptax) cite un
  communiqué de la DGI du 14/09/2026, qui laisse 45 jours aux entreprises
  émettant leurs factures FNE par API pour se mettre en conformité. Le texte
  officiel n'a pas pu être ouvert : le site de la DGI était injoignable.
  [Lookuptax](https://lookuptax.com/tax-changes/cote-divoire/fne-api-conformity-29-oct-2026)
  → Accounting n'émet pas de FNE par API, donc rien ne casse. À relire avant
  toute décision sur le « Reçu de caisse » ivoirien.
- **Rien de daté** : DGI Cameroun, DGID Sénégal, DGI Gabon (sites muets ou
  injoignables), journaux des API MTN, Orange et Wave.

### Technologie et IA
- **supabase-js 2.117.3 (07/10/2026)** : corrige l'envoi d'un fichier vers une
  fonction edge (le type du fichier est conservé) et l'envoi vers le stockage
  (les champs passent avant le fichier).
  [GitHub](https://github.com/supabase/supabase-js/releases/tag/v2.117.3)
  → Accounting est en 2.116.0 et envoie des photos vers le stockage
  (discussion). Mise à jour à prévoir, puis essai d'un envoi de photo. Pas
  faite ce matin : la veille ne met rien en ligne.
- **LightOnOCR-3 (08/10/2026)** : modèles de lecture de documents en trois
  tailles, sous licence Apache 2.0. Ils repèrent les tableaux, les formulaires
  et l'écriture manuscrite. La page annonce le meilleur score sur un test de
  documents français ; les reçus ne sont pas cités.
  [Hugging Face](https://huggingface.co/blog/lightonai/lightonocr-3)
  → Un lecteur de reçus ouvert, possible secours à Gemini. Mais il lui faut un
  serveur avec carte graphique : il ne tourne pas sur Workers.
- **ML Drift, Google AI Edge (08/10/2026)** : le moteur qui fait tourner l'IA
  sur la carte graphique du téléphone passe en source ouverte. Il marche sur
  Android, iOS et ordinateur, et dans le navigateur par WebGPU.
  [Google Developers](https://developers.googleblog.com/ml-drift-next-gen-gpu-aiml-inference-at-the-edge/)
  → Rend plausible, un jour, la lecture de reçu hors ligne dans l'application.
  Rien d'immédiat.
- **Supabase (08/10/2026)** : la page d'état passe sur incident.io. Les
  abonnements par SMS, webhook ou RSS sont à refaire ; ceux par e-mail sont
  conservés.
  [Supabase](https://supabase.com/changelog/status-page-migration)
  → Si une alerte de panne arrivait par webhook ou SMS, elle est muette
  depuis le 08/10.
- **Reconnaissance vocale** : Falcon ASR (07/10) ne couvre que le français en
  plus de l'arabe et des grandes langues, et n'a pas encore d'API. Aucune
  langue africaine trouvée ailleurs.
- **Rien de daté** : Groq (rien sur gpt-oss), Gemini, Cloudflare Workers AI,
  Mistral, WhatsApp Business, Capacitor.

---

## 08/10/2026 (couvre du 06 au 08/10, élargi au 30/09 quand c'était utile)

### Concurrence
- **QuickBooks (06/10/2026)** : Intuit ouvre son connecteur QuickBooks à Muse,
  l'assistant IA de Meta. Il était déjà disponible dans Claude, ChatGPT et
  Perplexity.
  [American Banker](https://americanbanker.com/payments/news/intuit-adds-metas-muse-to-small-business-ai-menu)
  → Le leader ne garde pas son assistant pour lui : il met ses données là où les
  gens parlent déjà à une IA. À garder en tête pour Finia, sans urgence.
- **StashUp Kiosk, Ghana (article du 07/10/2026)** :
  - une vitrine à partager sur WhatsApp, Instagram ou Facebook ;
  - paiement par mobile money ;
  - commandes et paiements au même endroit ;
  - ouverture gratuite, 1,5 % de commission sur chaque vente conclue, sans
    abonnement.

  [GhanaWeb](https://www.ghanaweb.com/GhanaHomePage/features/Ghana-s-informal-sellers-are-getting-a-new-way-to-run-their-businesses-2055576)
  → C'est le pont « vitrine → gestion » que vise Finjaro, et une référence de
  prix pour la place de marché.
- **Massiwa AI Suite, Comores (analyse du 06/10/2026 ; offre publiée le 07/08)** :
  - facturation SYSCOHADA, stock, mobile money ;
  - de 10,17 € à 30,50 € par mois selon la formule, avec un mois d'essai.

  [Capmad](https://www.capmad.com/article/massiwa-ai-suite-pousse-les-erp-africains-a-se-caler-sur-les-realites-des-pme)
  → En Afrique francophone, la conformité OHADA avec le mobile money s'affiche
  déjà autour de 10 € par mois. À verser au dossier « prix » qui attend Beau.
- **Afri Invoice, Nigeria (07/10/2026)** : quatre formules pour passer à la
  facture électronique du fisc nigérian (validation, numéro unique, API). Prix
  non publiés.
  [BusinessDay](https://businessday.ng/technology/article/tax-reforms-afri-invoice-rolls-out-new-plans-to-ease-e-invoicing-adoption/)
  → Là où la facture électronique devient obligatoire, les petits commerces
  s'équipent. La conformité pays par pays sert à entrer sur un marché.
- **BharatNXT, Inde (07/10/2026)** : « Seller Hub », avec liens d'encaissement,
  **relances de paiement automatiques** et escompte de factures, sur le réseau
  interentreprises de NPCI.
  [Tribune India](https://www.tribuneindia.com/news/business/bharatnxt-partners-with-bharat-connect-for-business-to-power-a-unified-b2b-invoicing-and-payments-network-for-indias-msmes/)
  → La relance automatique des créances devient la norme. Chez nous, elle est
  manuelle, un clic sur WhatsApp. Idée ajoutée dans IDEES.md.

### Règles, impôts et paiements
- **UEMOA, PI-SPI obligatoire à partir du 02/11/2026** : texte de la BCEAO du
  02/10, distinct de la liste des établissements déjà notée le 02/10. Les
  transactions de monnaie électronique interopérables entre personnes physiques
  passeront par PI-SPI. Selon la presse, qui concorde, car les PDF de la BCEAO
  sont des scans illisibles :
  - envois nationaux gratuits jusqu'à 8 000 FCFA cumulés par jour, par
    utilisateur et par établissement ;
  - au-delà, des frais de 0 à 0,8 % HT sont permis ;
  - réception gratuite ;
  - entre pays de l'UEMOA à partir du 01/06/2027 ;
  - rien de fixé pour les paiements aux commerçants.

  [Communiqué BCEAO](https://www.bceao.int/fr/communique-presse/transactions-de-monnaie-electronique-entre-personnes-physiques-par-lintermediaire),
  [Avis n°0019](https://www.bceao.int/fr/reglementations/avis-ndeg0019-relatif-aux-transactions-de-monnaie-electronique-entre-personnes),
  [Pulse.ci](https://www.pulse.ci/article/finance-vos-transferts-jusqua-8-000-fcfa-deviennent-gratuits-des-le-2-novembre-dans-lespace-uemoa-2026100702324323017)
  → L'import des relevés mobile money range déjà les lignes « frais » et
  « commission » en charges financières. Après le 02/11, il faudra vérifier
  avec un vrai relevé que les lignes PI-SPI sont bien reconnues. Ne jamais
  écrire « gratuit » pour les paiements aux commerçants.
- **France, facture électronique (article du 05/10/2026)** :
  - l'AIFE, qui gère Chorus Pro, a suspendu à partir du 01/10 ses échanges avec
    la plateforme agréée de VosFactures, après une intrusion chez un
    sous-traitant ;
  - l'intrus serait passé par la génération de PDF à partir des modèles de
    factures ;
  - les échanges ont été rétablis ensuite, sous surveillance.

  [Next](https://next.ink/259753/facturation-electronique-fuite-dinformations-chez-vosfactures-a-cause-dun-prestataire/)
  → Chez nous, factures et tickets se fabriquent dans le navigateur de la
  personne, sans moteur de PDF sur un serveur : ce point d'entrée n'existe pas.
  À retenir pour le jour où l'on passera par une plateforme agréée : pouvoir en
  changer.
- **Sénégal, SENTAX (communiqué du 30/09/2026, en vigueur le 01/10)** : la
  plateforme de déclaration en ligne s'ouvre aux moyennes entreprises. Elle est
  « ouverte », pas obligatoire, pour elles ; elle l'est pour les grandes depuis
  le 01/09. Il s'agit de déclarations, pas de facture électronique.
  [DGID](https://www.dgid.sn/)
  → Un récapitulatif de TVA du mois, prêt à recopier, devient utile aux clients
  sénégalais de taille moyenne. L'écran TVA le donne déjà ; à vérifier qu'il
  colle aux cases de SENTAX le jour où un client sénégalais arrive.
- **Rien de daté et vérifiable du 01 au 08/10** pour le Cameroun (DGI, IGS), le
  Gabon, l'OHADA, Orange Money et Wave (hors PI-SPI). Les portails de la Côte
  d'Ivoire (FNE) et du Gabon répondaient en erreur 503.

### Technologie et IA
- **Groq** : rien de neuf dans le changelog. Mais `qwen/qwen3.8-27b`, deuxième
  de notre chaîne de secours, est encore « Preview », et Groq prévient que ces
  modèles peuvent être retirés à bref délai.
  [Groq, modèles](https://console.groq.com/docs/models)
  → Sans risque : s'il disparaît, le Worker passe tout seul au suivant (un
  refus fait passer au modèle suivant). Rien à faire.
- **Capacitor 8.5.3 (07/10/2026)** : une seule correction, pour iOS avec Swift
  Package Manager et des plugins Cordova.
  [Notes de version](https://github.com/ionic-team/capacitor/releases)
  → Rien côté web. À prendre à la prochaine construction iOS si ce cas se
  présente.
- **EmbeddingGemma 2, Google (06/10/2026)** : modèle ouvert de recherche par le
  sens, qui tourne sur l'appareil et dans le navigateur, sans connexion.
  Environ 191 Mo de mémoire pour le texte seul. Langues non précisées.
  [Google Developers](https://developers.googleblog.com/google-ai-edge-with-embeddinggemma-2/)
  → Piste pour une recherche hors ligne, mais trop lourd pour un téléphone
  d'entrée de gamme. À surveiller.
- **Reconnaissance vocale** : rien de daté dans la période. Hors période
  (24/09) : Sunflower v2 de Sunbird AI, licence Apache 2.0, couvre le wolof, le
  lingala et le pidgin nigérian, mais aucune langue camerounaise.
  [Hugging Face](https://huggingface.co/Sunbird/SunflowerASR-51-african-languages)
- **Rien de neuf** pour Gemini (après le 06/10), Cloudflare Workers, Workers AI
  et WhatsApp. Deux articles de presse annoncent que les messages libres des
  entreprises sur WhatsApp Business deviennent payants le 01/10. La page
  officielle de Meta dit encore le contraire, donc ce n'est pas confirmé, et ça
  ne touche pas nos simples liens wa.me.

---

## 07/10/2026 (couvre du 06 au 07/10)

**Journée calme. Rien qui menace le produit ou qui demande une décision.**

### Concurrence

- **Inde (06/10/2026)** : la 57e réunion du Conseil de la GST est repoussée au
  08/10. Au programme : simplifier les procédures des petits contribuables
  (pénalités de retard, enregistrement plus rapide). Rien sur la facture
  électronique.
  [source](https://www.tribuneindia.com/news/arrest-provisions/govt-reschedules-gst-council-57th-meeting-to-october-8-cites-unavoidable-circumstances)
  → *Pour nous* : rien à faire avant d'ouvrir l'Inde.

### Règles, impôts et paiements

- Rien de daté dans la période (facture électronique OHADA ou France, MTN MoMo,
  Orange Money, Wave). Deux sources n'ont pas pu être ouvertes (Agence Ecofin,
  refus d'accès ; Business in Cameroon, page vide).

### Technologie et IA

- **Gemini (06/10/2026)** : nouveau modèle d'images `gemini-nano-banana-2.1` ;
  `gemini-3.1-flash-image` est déprécié, sans date d'arrêt.
  [source](https://ai.google.dev/gemini-api/docs/changelog)
  → *Pour nous* : Accounting ne l'utilise pas. Les fonctions d'images de la place
  de marché, passées dessus le 06/10, devront changer un jour : signalé à Alpha.
- **Cloudflare AI Gateway (06/10/2026)** : une clé refusée par un fournisseur
  renvoie désormais toujours 401.
  [source](https://developers.cloudflare.com/changelog/post/2026-10-05-provider-credential-errors/)
  → *Pour nous* : rien, nous n'utilisons pas AI Gateway.
- **Supabase (06/10/2026)** : jetons d'accès personnels limités à un projet et à
  des droits précis.
  [source](https://supabase.com/changelog/scoped-personal-access-tokens-ga)
  → *Pour nous* : utile pour une base partagée par plusieurs applications : un
  jeton en lecture seule sur le seul projet commun, pour les agents. À proposer
  à Beau quand il voudra resserrer les accès.

---

## 06/10/2026 (couvre du 05 au 06/10)

**Journée calme. Un seul fait qui compte : au Burkina Faso, la facture électronique
certifiée passe par un logiciel homologué par le fisc, pays par pays.**

### Concurrence et règles

- **Burkina Faso (communiqué du 05/10/2026)** : le logiciel local DOLICO a obtenu
  l'attestation de conformité de la DGI pour la facture électronique certifiée.
  Calendrier rappelé dans l'article : grandes entreprises depuis le 07/09/2026,
  moyennes entreprises du réel normal le 02/11/2026, autres moyennes entreprises
  le 01/12/2026.
  [source](https://burkina24.com/2026/10/05/communique-facture-electronique-certifiee-le-logiciel-burkinabe-dolico-obtient-lattestation-de-conformite-de-la-direction-generale-des-impots/)
  → *Pour nous* : dans l'espace OHADA, chaque fisc homologue ses logiciels
  (Burkina, Côte d'Ivoire avec la FNE, Congo, Togo). Les petits commerces sont
  hors calendrier pour l'instant, mais une entreprise moyenne ne pourra pas
  facturer avec une caisse non homologuée. À prévoir : un branchement par pays,
  pas un format unique.
- **MTN Ghana (05/10/2026)** : campagne pour l'épargne et le placement par MoMo.
  Rien sur l'API ni sur les tarifs.
  [source](https://www.myjoyonline.com/mtn-encourages-ghanaians-to-use-momo-for-saving-investing-and-financial-planning/)
  → *Pour nous* : rien à faire.
- Rien de nouveau ni d'officiel pour le Cameroun, le Sénégal, la Côte d'Ivoire, le
  Gabon ou la France. Plusieurs résultats présentés comme récents dataient de 2021
  à 2025 : écartés.

### Technologie et IA

- **Supabase (05/10/2026)** abandonne quatre adaptateurs de `@supabase/server`
  (retrait le 01/12/2026). [source](https://supabase.com/changelog)
  → *Pour nous* : rien, nous ne les utilisons pas (vérifié dans le dépôt).
- Rien dans la période pour Gemini, Workers AI, WhatsApp ni Capacitor.

---

## 05/10/2026 (couvre du 30/09 au 05/10 ; pas de veille les 03 et 04/10)

**Le fait du jour : un concurrent direct est apparu au Cameroun, au même format
que nous (application web hors ligne), avec un prix public.**

### Concurrence

- **« Caisse Boutique » (02/10/2026, Cameroun)** : application web de caisse
  100 % hors ligne. Prix annoncé : 5 000 FCFA par mois, payé en MTN MoMo ou
  Orange Money. Impression Bluetooth sur ticket thermique 58 mm, mentions DGI
  sur le reçu (NIU, RCCM, numéro séquentiel).
  [source](https://dev.to/caisse_boutique/comment-jai-construit-une-pwa-de-caisse-enregistreuse-100-hors-ligne-pour-les-commercants-du-57i6)
  → *Pour nous* : notre reçu porte déjà NIU et RCCM, et notre caisse marche
  hors ligne. Ce qui nous manque face à eux : l'impression directe sur un petit
  ticket Bluetooth (nous passons par l'impression du téléphone) et un prix
  affiché. Notre avance : la comptabilité automatique, l'assistante, le
  rattrapage par photo, la place de marché.
- **Platybooks (01/10/2026, Afrique du Sud)** : un devis accepté devient une
  facture avec un lien de paiement par carte (Paystack).
  [source](https://techparley.com/platybooks-wants-to-close-the-gap-between-invoicing-and-payment-for-africas-small-businesses/)
  → *Pour nous* : un lien de paiement (mobile money) sur nos factures devient
  une attente de base.
- **Nigeria (article du 04/10/2026)** : comité de pilotage d'une stratégie
  nationale de facturation numérique, pour transformer les factures vérifiées
  en crédit pour les PME.
  [source](https://oneclickafrica.com/posts/fg-inaugurates-committee-on-digital-invoicing-financial-optimisation-strategy-to-unlock-capital)
  → *Pour nous* : argument pour le jour où l'on ouvre le Nigeria ; rien à faire
  maintenant.

### Règles, impôts et paiements

- **Rien de nouveau et d'officiel dans la période** sur la facture électronique
  (Cameroun, Gabon, Sénégal, Côte d'Ivoire, OHADA) ni sur les API ou tarifs de
  MTN MoMo, Orange Money et Wave. Plusieurs résultats présentés comme récents
  par les moteurs de recherche dataient de 2024 ou de 2025 : écartés.
- **Kenya (02/10/2026)** : coupure programmée de deux heures d'eTIMS, le
  système obligatoire de facture fiscale.
  [source](https://peopledaily.digital/business/kra-announces-2-hour-etims-outage-on-friday-night)
  → *Pour nous* : si l'on se branche un jour sur une facture fiscale en ligne,
  il faudra une file d'attente qui renvoie après coupure (c'est déjà notre
  principe hors ligne).

### Technologie et IA

- **Google a arrêté le modèle `gemini-2.5-flash-image` le 02/10/2026**,
  remplaçant conseillé `gemini-3.1-flash-image-preview`.
  [source](https://ai.google.dev/gemini-api/docs/deprecations)
  → *Pour nous* : Accounting n'est pas touché (son assistante utilise
  `gemini-2.5-flash`, sans date d'arrêt annoncée). La fonction `miroir-ia` de
  la place de marché utilisait ce modèle en secours : signalé à Alpha.
- **Cloudflare (01 et 02/10/2026)** : des opérations en cours peuvent garder un
  Durable Object actif jusqu'à 15 min ; les espaces KV peuvent être fixés dans
  l'UE ou aux États-Unis, rien en Afrique.
  [source 1](https://developers.cloudflare.com/changelog/post/2026-10-01-pending-io-keep-alive/) ·
  [source 2](https://developers.cloudflare.com/changelog/post/2026-10-02-kv-jurisdictions-ga/)
  → *Pour nous* : rien à faire aujourd'hui (nous n'utilisons ni l'un ni l'autre).
- **Rien de daté dans la période** sur la lecture d'écriture manuscrite, la
  voix en langues africaines, Capacitor ou Supabase.

---

## 02/10/2026

**Le fait du jour : PI-SPI a bien démarré, Wave compris. Côté technique, un
changement Supabase du 30/10 à ne pas oublier dans nos prochaines
migrations. Concurrence : rien de neuf.**

### Concurrence

- Rien de daté sur un produit concurrent du 25/09 au 02/10. À titre
  d'argument seulement : le patron de Sage demande au gouvernement
  britannique une stratégie d'IA pour les PME, qui « n'achètent que les
  outils au retour immédiat et mesurable » (enquête Sage SME Pulse), publié
  le 29/09/2026.
  [streamlinefeed.co.ke](https://streamlinefeed.co.ke/news/sage-chief-calls-for-targeted-ai-strategy-to-boost-uk-small-businesses)
  → Conforte notre message : montrer tout de suite ce que l'application
  rapporte (une créance relancée et payée, un jour sans saisie rattrapé).

### Règles, impôts et paiements

- **PI-SPI : la BCEAO a publié la liste des 175 établissements autorisés à
  ouvrir le paiement instantané au public au 30/09/2026**, dont Orange
  Finances Mobiles, MTN Money, Moov Money, Djamo et Julaya, dans les 8 pays
  de l'UEMOA. Publié le 01/10/2026.
  [financialafrik.com](https://www.financialafrik.com/2026/10/01/bceao-liste-des-175-participants-autorises-a-ouvrir-les-services-de-pi-spi-au-public-au-30-septembre-2026/)
- **Wave est raccordé à PI-SPI** (Sénégal, et Wave Digital Finance figure
  aussi pour la Côte d'Ivoire dans la liste). Publié le 01/10/2026.
  [sikafinance.com](https://www.sikafinance.com/marches/senegal-43-structures-connectees-a-la-pi-spi-de-la-bceao_64628)
  → Corrige notre note du 29/09 (« Wave pourrait rester à part ») : en zone
  UEMOA, un relevé Wave ou Orange Money peut maintenant contenir des
  virements venant d'une banque ou d'un autre opérateur. Notre import de
  relevés les lit comme n'importe quelle ligne ; à surveiller : qu'un même
  paiement vu des deux côtés ne soit pas compté deux fois au rapprochement.
- Rien de nouveau et daté pour la France, la Côte d'Ivoire (FNE), le
  Sénégal, le Cameroun, le Gabon ni les API MTN et Orange.

### Technologie et IA

- **Supabase, le 30/10/2026 : les NOUVELLES tables du schéma public ne
  seront plus exposées automatiquement à l'API.** Annoncé le 28/04 (hors
  fenêtre, rappelé parce que l'échéance approche).
  [supabase.com/changelog](https://supabase.com/changelog)
  → Toute migration future d'Accounting qui crée une table lue par
  l'application devra donner elle-même les droits (`grant`), sinon
  l'application ne la verra pas. Les tables existantes ne changent pas. La
  base étant partagée, Alpha est prévenu.
- **Cloudflare publie Clef et Clef-flash sur Workers AI** (01/10/2026) :
  des modèles libres qui renvoient une réponse typée avec une probabilité,
  l'annonce cite le traitement de factures.
  [developers.cloudflare.com](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/)
  → Piste à tester plus tard pour un tri rapide dans le worker (« reçu ou
  facture ? », « quelle catégorie de dépense ? ») ; ne remplace pas la
  lecture des reçus par Gemini.
- Supabase OrioleDB en bêta publique (01/10) : sans objet, la base est
  partagée et on ne change pas de moteur.
- Rien de nouveau et daté pour Gemini, Capacitor, Resend, WhatsApp, la
  reconnaissance vocale en langues africaines, ni de faille publiée sur nos
  briques.

---

## 01/10/2026

**Semaine calme. Rien côté concurrence. Côté règles, aucune nouvelle de
PI-SPI après l'échéance du 30/09, et un point d'étape français. Côté
technique, un outil Supabase qui pourrait simplifier nos fonctions edge.**

### Concurrence

Rien retenu. Aucune annonce datée du 24/09 au 01/10 pour les concurrents
suivis (Afrique francophone, Nigeria, Kenya, Inde, Brésil, Zoho, Sage,
QuickBooks, Xero). Seules apparaissent des mises à jour d'applications sans
contenu décrit (OkCredit, Paytm for Business), sans valeur pour nous.

### Règles, impôts et paiements

- **PI-SPI (UEMOA) : rien de publié après l'échéance du 30/09.** Aucun
  communiqué de la BCEAO, aucun bilan des raccordements, aucune annonce de
  report ou de sanction trouvés ; on ne sait toujours pas si Wave s'est
  raccordé. À revérifier la semaine prochaine.
- **France, facture électronique : point d'étape de l'administration.**
  Selon un webinaire de l'Ordre des experts-comptables Paris Île-de-France
  rapporté par Compta-Online, 43 % de l'ensemble des entités avaient choisi
  une plateforme agréée au 20/09/2026 (71,4 % du « cœur de cible »). Les
  dates de l'article sont incohérentes (mis à jour le 24/09 pour un webinaire
  annoncé le 29/09) : chiffres à prendre avec prudence.
  [compta-online.com](https://www.compta-online.com/facturation-electronique-ao5562)
  → Confirme que beaucoup de petites entreprises françaises ne sont pas
  prêtes à recevoir leurs factures électroniques. Sans urgence pour
  Finjaro (déjà noté le 27/09 : obligation active, sanctions suspendues).
- Rien de nouveau et daté pour le Cameroun, le Sénégal, le Gabon, la Côte
  d'Ivoire, MTN MoMo, Orange Money ou Wave.

### Technologie et IA

- **Supabase Middleware 1.0** : une petite bibliothèque libre (MIT) pour
  enchaîner avant chaque requête la vérification de session, le CORS et
  d'autres contrôles, utilisable dans les fonctions edge comme dans
  Cloudflare Workers. Publié le 30/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog/supabase-middleware-1-0)
  → Pourrait regrouper les contrôles de CORS et de jeton de nos fonctions
  (accounting-rappels, accounting-inscription-tel). Pas urgent : ces
  fonctions sont communes à staging et à la production, toute migration
  se ferait une par une et avec l'accord de Beau.
- Cloudflare : appel de Workflows via `ctx.exports` (27/09) et algorithmes
  post-quantiques dans Web Crypto (01/10).
  [developers.cloudflare.com](https://developers.cloudflare.com/changelog/)
  → Aucun effet pour nous aujourd'hui.
- Rien de nouveau et daté pour Gemini, DeepSeek, Capacitor, Resend, les PWA
  ou la reconnaissance vocale en langues africaines.

---

## 30/09/2026

**Un fait concurrent qui compte : QuickBooks relance les impayés depuis
l'assistant de Meta. Côté règles, rien de publié cette semaine, mais une
homologation BCEAO du 16/09 que nous n'avions pas notée. Côté technique,
un outil Cloudflare utile pour savoir quelle poussée a cassé quoi.**

### Concurrence

- **QuickBooks se branche sur Muse, l'assistant de Meta** : depuis une
  conversation, créer et envoyer des factures payables en ligne, suivre les
  impayés, envoyer des relances, consulter résultat et trésorerie. Pays
  couverts et lien avec WhatsApp : non précisés. Publié le 29/09/2026.
  [intuit.com](https://www.intuit.com/blog/innovative-thinking/tech-innovation/intuit-quickbooks-joins-muse-for-small-business/)
  → La relance d'impayés depuis une messagerie devient la norme chez les
  grands : notre bouton « Relancer sur WhatsApp » reste utile mais n'est
  plus un avantage exclusif. Ne pas le présenter comme une exclusivité.
- Moniepoint (Nigeria) utilise son réseau de terminaux pour vendre en agence
  des actions de l'introduction en bourse de Dangote Refinery. Publié le
  25/09/2026. [techcabal.com](https://techcabal.com/2026/09/25/moniepoint-pos-network-investment-network/)
  → Contexte seulement : au Nigeria, le terminal de paiement devient une
  porte vers d'autres services ; un commerçant Moniepoint y est très attaché.
- Rien trouvé et daté pour l'Afrique francophone, Wave, Bumpa, l'Inde, le
  Brésil ou Sage. (Zoho Books Nigeria du 17/09 : déjà noté.)

### Règles, impôts et paiements

- **Rien de publié du 23 au 30/09** sur la facture électronique, le fisc ou
  le mobile money au-delà de ce qui est déjà noté. Aucune annonce trouvée
  de la connexion de Wave à PI-SPI avant l'échéance du 30/09.
- **Pas encore noté ici : le 16/09/2026, la BCEAO a annoncé l'homologation
  des « API Business » de PI-SPI**, qui permettent aux logiciels
  d'entreprise de se brancher directement sur la plateforme de paiement
  instantané de l'UEMOA. [bceao.int](https://www.bceao.int/) (annonce vue
  en page d'accueil ; le communiqué lui-même n'a pas été ouvert, le nombre
  de solutions homologuées n'est donc pas repris).
  → C'est la voie officielle pour encaisser et rapprocher les paiements
  UEMOA directement dans la caisse, au lieu d'importer des relevés. Voir
  IDEES.md.
- **Mise en garde** : des résumés de recherche attribuent au Sénégal un
  « décret 2026-101 / SFEC au 01/08/2026 ». Il concerne en réalité le
  **Congo-Brazzaville** (sfec.gouv.cg). Ne pas l'attribuer au Sénégal.

### Technologie et IA

- **Cloudflare Workers Metrics affiche désormais chaque mise en ligne sur
  les graphiques**, pour dater le début d'une régression. Publié le
  25/09/2026.
  [developers.cloudflare.com](https://developers.cloudflare.com/changelog/post/2026-09-25-release-flows-workers-metrics/)
  → Utile chez nous : Cloudflare déploie seul à chaque poussée et la CI
  verte ne prouve pas la mise en ligne ; ce graphique relie une panne à une
  poussée précise. Aucune action requise.
- NKENNEAi lance des modèles de reconnaissance et de synthèse vocales, en
  swahili d'abord (article sponsorisé). Publié le 25/09/2026.
  [techcabal.com](https://techcabal.com/2026/09/25/nkenneai-launches-its-first-african-language-speech-models-starting-with-swahili/)
  → Rien d'utilisable : aucune langue parlée au Cameroun pour l'instant.
- Rien de nouveau et daté pour Supabase, Gemini, DeepSeek, Capacitor, les
  PWA ou la lecture de reçus.

---

## 29/09/2026

**Semaine toujours pauvre côté concurrence. Deux faits utiles côté
règles/paiements (une précision sur PI-SPI, un point France sans urgence
pour nous). Côté technologie, rien de nouveau à faire : un fait déjà noté
le 27/09 revient (Postgres), un autre ne concerne pas notre usage de
WhatsApp.**

### Concurrence

Rien retenu. Aucun fait produit daté du 22 au 29/09 trouvé et vérifié pour
Wave, Bumpa, Kippa, Flowcart, Moniepoint, PalmPay, Khatabook, Vyapar,
OkCredit, Zoho Books, Sage, QuickBooks ou les solutions brésiliennes (Bling,
Omie, Conta Azul). Point hors périmètre, à titre indicatif : la Nigeria
Fintech Week s'est tenue à Lagos les 22-23/09, sans annonce produit
vérifiable pour un concurrent direct.

### Règles, impôts et paiements

- **UEMOA/PI-SPI : Wave n'est pas dans la liste des participants
  autorisés** au 31/07/2026 (dernier point de situation trouvé, hors
  fenêtre stricte mais éclaire l'échéance du 30/09 déjà notée) — tension
  entre son modèle à frais et la gratuité imposée par PI-SPI pour les
  particuliers.
  [dakaractu.com](https://www.dakaractu.com/Wave-face-a-la-plateforme-PI-SPI-et-l-interoperabilite-Refus-ou-dilemme-strategique-pour-ne-pas-se-saborder_a275313.html)
  → Ne pas supposer une interopérabilité universelle des mobile money dès
  le 30/09 : Wave pourrait rester à part. À vérifier avant toute mention
  aux vendeuses UEMOA.
- **France : 31 incidents vérifiés sur 12 plateformes agréées de
  facturation électronique entre le 01/09 et le 26/09/2026**, dont 9
  affectant directement les flux de factures. Publié le 27/09/2026.
  [kohenavocats.fr](https://kohenavocats.fr/2026/09/27/panne-plateformes-agreees-facturation-entreprises-fournisseurs-decisions-2026/)
  → Une facture bloquée par une panne de plateforme n'efface pas les
  délais de paiement. Sans urgence pour Finjaro (pas d'intégration à une
  Plateforme Agréée), mais à garder en tête pour les deux comptes français
  déjà inscrits, s'ils facturent en B2B.

### Technologie et IA

- Mise à jour de sécurité Postgres 15.19/17.11 (Supabase) : même fait que
  le 27/09, revient cette semaine sans élément nouveau. Toujours vérifié :
  Accounting n'utilise ni `ltree` ni `btree_gist`. Rien à refaire.
- **WhatsApp Business Platform : les messages de service au-delà de 1000
  par mois et par numéro deviennent payants à partir du 01/10/2026.**
  Publié le 28/09/2026.
  [techweez.com](https://techweez.com/2026/09/28/whatsapp-business-pricing-october-2026/)
  → **Ne concerne pas Finjaro aujourd'hui** : les relances WhatsApp
  d'Accounting sont des liens `wa.me` ouverts dans l'app WhatsApp de la
  vendeuse elle-même, jamais l'API Business officielle. À revoir seulement
  si un envoi programmatique était un jour envisagé.
- Reconnaissance vocale en langues africaines peu dotées (lingala,
  shona) : un défi Google Research/Zindi a publié ses résultats le
  22/09/2026 — travaux de recherche, aucun modèle prêt à intégrer pour le
  wolof, le lingala ou le pidgin cette semaine.
  [blog.google](https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/meet-the-winners-of-the-waxal-speech-recognition-challenge/)
  → Rien d'actionnable maintenant, à surveiller.
- Gemini 4 : Google confirme un lancement « dès que possible », sans date
  ferme. Publié le 24/09/2026.
  [9to5google.com](https://9to5google.com/2026/09/24/google-says-gemini-4-release-is-coming-as-soon-as-possible/)
  → Rien à changer : l'assistant reste sur les modèles Gemini actuels
  (et DeepSeek en secours depuis le 28/09) tant qu'aucune version stable
  n'est publiée.

---

## 28/09/2026

**Semaine toujours pauvre : rien côté concurrence, un point de contexte sur
l'échéance BCEAO qui approche (sans confirmation d'aucun opérateur), deux
faits techniques mineurs déjà vérifiés sans impact.**

### Concurrence

Rien retenu. Aucun fait daté du 21 au 28/09 trouvé et vérifié pour les
concurrents suivis. Point hors périmètre, à titre indicatif seulement :
Remita (Nigeria, paiements — pas caisse/compta) a présenté une nouvelle
application le 23/09 au Nigeria Fintech Week ; aucun chiffre vérifiable,
impact quasi nul pour Finjaro.

### Règles, impôts et paiements

- **UEMOA : l'échéance BCEAO du 30/09 (PI-SPI) est une généralisation, pas
  un nouveau lancement** — le service existe depuis 09/2025, le 30/09 est
  la date à laquelle banques et établissements de paiement doivent l'avoir
  ouvert à leurs clients (transferts gratuits entre particuliers, alias par
  numéro de téléphone, QR code marchand standardisé). Publié le 23/09/2026.
  [benin-news.com](https://benin-news.com/2026/09/23/pi-spi-benin-paiement-instantane/)
  → Toujours rien d'actionnable : aucune source datée ne confirme ni
  n'infirme la conformité de MTN MoMo, Orange Money ou Wave à cette
  échéance. Dossier FNE Côte d'Ivoire toujours gelé depuis le 05/09.

### Technologie et IA

- **Supabase Logs passe à une facturation à l'usage**, période de grâce
  jusqu'à début 2027 (« 90 %+ des projets restent dans les limites
  incluses »). Publié le 25/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog)
  → Le projet partagé `bokwivwizghdlaedczbw` répartit cette facturation
  entre toutes les applications ; à surveiller sans urgence vu la période
  de grâce.
- **Chrome 154 : Background Fetch exige désormais la permission « accès
  réseau local » et applique CORS comme un fetch classique.** Publié le
  22/09/2026.
  [developer.chrome.com](https://developer.chrome.com/release-notes/154)
  → **Vérifié : Accounting n'utilise pas l'API Background Fetch.** Rien à
  faire.
- Rien de nouveau ailleurs (extraction de reçus/factures, reconnaissance
  vocale, WhatsApp Business, Capacitor) : soit hors fenêtre stricte, soit
  déjà noté.

---

## 27/09/2026

**Semaine encore pauvre : rien côté concurrence, un seul fait réglementaire
(France, sans urgence), deux faits techniques — dont un qui mérite une
vérification rapide sur la base partagée.**

### Concurrence

Rien retenu. Aucun fait daté du 20 au 27/09 trouvé et vérifié pour Wave,
Bumpa, Kippa, Flowcart, Khatabook, Vyapar, OkCredit, Sage, QuickBooks, Zoho
Books ou Jumia. Point noté en passant : Kippa (Nigeria) semble à l'arrêt
depuis 2025 (site indisponible, fondateurs partis) — pas un fait de cette
semaine, mais à ne plus compter comme concurrent actif si le sujet revient.

### Règles, impôts et paiements

- **France : confirmation d'une phase de tolérance sans sanction jusqu'à
  fin 2026 pour la facturation électronique.** L'obligation de réception
  est en vigueur depuis le 01/09/2026 pour toutes les entreprises
  assujetties à la TVA ; l'administration a annoncé ne pas sanctionner les
  entreprises en difficulté jusqu'à la fin de l'année. Publié le
  23/09/2026.
  [kohenavocats.fr](https://kohenavocats.fr/2026/09/23/facture-electronique-obligatoire-1-septembre-2026-sarl-sas-recevoir-emettre-sanctions-contester/)
  → Aucune urgence si Finjaro sert un jour un commerçant facturant vers la
  France ; l'obligation reste active, juste non sanctionnée pour l'instant.
- Dossier FNE/RNE Côte d'Ivoire (tension FENACCI/DGI) : toujours aucun
  développement depuis le 05/09 — dossier apparemment gelé pour l'instant.
  Échéance BCEAO PI-SPI du 30/09 : rien de nouveau au-delà du rappel déjà
  noté. Rien sur MTN MoMo, Orange Money, Cameroun, Gabon, Sénégal.

### Technologie et IA

- **Supabase met à jour Postgres (15.19 / 17.11) — action possible sur la
  base partagée.** Corrige 44 CVE cumulées. Deux points « breaking » :
  les index sur colonnes `ltree` et `btree_gist` construits avec l'ancienne
  version peuvent renvoyer des résultats **silencieusement incomplets**
  s'il y a un encodage multioctet ou un collationnement non-libc ; il faut
  les reconstruire avec `REINDEX INDEX CONCURRENTLY` si c'est le cas.
  Publié le 25/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes)
  → **Vérifié : les migrations de Finjaro Accounting n'utilisent ni `ltree`
  ni `btree_gist`.** Le projet `bokwivwizghdlaedczbw` étant partagé avec
  d'autres applications, signalé à Alpha pour vérification côté
  place de marché et Legion.
- **Google lance Gemini 3.8 Flash TTS** (synthèse vocale, pas
  reconnaissance) : plus de 100 langues, bibliothèque élargie à plus de
  2000 voix. Publié le 23/09/2026.
  [unite.ai](https://www.unite.ai/google-rolls-out-gemini-3-8-speech-models-in-api-and-ai-studio/)
  → C'est de la voix générée, pas de la saisie vocale : pas directement
  utile pour lire un reçu, mais pourrait un jour faire lire des montants à
  voix haute dans une langue locale.
- Rien de nouveau ailleurs (OCR de reçus, PWA/offline, Capacitor, WhatsApp
  Business) : soit hors fenêtre stricte, soit déjà noté.

---

## 26/09/2026

**Semaine la plus pauvre depuis longtemps : rien côté concurrence, rien côté
réglementation/paiements, deux faits techniques mineurs seulement.** Fenêtre
stricte 19-26/09. Point de suivi particulier : le dossier de tension entre
la FENACCI et la DGI ivoirienne sur la Facture Normalisée Électronique
(contrôles automatisés démarrés le 01/09) n'a produit aucun développement
daté dans la fenêtre — dernier fait connu toujours le 05/09 (création de
l'Observatoire national de la FNE par la FENACCI). À revérifier la semaine
prochaine.

### Concurrence

Rien retenu. Aucun fait daté du 19 au 26/09 trouvé et vérifié pour Wave,
Bumpa, Kippa, Flowcart, Khatabook, Vyapar, OkCredit, Sage, QuickBooks, Zoho
Books ou Jumia, sur aucun des marchés suivis (OHADA, Nigeria, Kenya, Inde,
Brésil).

### Règles, impôts et paiements

Rien de nouveau et vérifiable dans la fenêtre. Vérifié spécifiquement et
écarté (hors fenêtre) : le dossier FNE/RNE Côte d'Ivoire (dernier fait le
05/09), le refus de Wave de rejoindre PI-SPI (articles du 13/07 et du
24/08), les nouveautés MTN MoMo/Orange Money/Sénégal/Gabon/Burkina/France.

### Technologie et IA

- **Supabase CLI 2.118.0 : génération de types sans Docker**, et nouvelle
  commande `supabase pull` pour reconstituer un environnement local
  complet. Publié le 25/09/2026.
  [github.com/supabase/cli](https://github.com/supabase/cli/releases)
  → Simplifie l'outillage de développement local ; ne touche pas le projet
  Supabase partagé.
- **NKENNEAi lance ses premiers modèles vocaux africains (swahili),
  entraînés sur plus de 65 000 heures d'audio** ; yoruba, igbo, pidgin
  nigérian et somali annoncés à venir, démo publique le 29/09/2026. Publié
  le 25/09/2026.
  [techcabal.com](https://techcabal.com/2026/09/25/nkenneai-launches-its-first-african-language-speech-models-starting-with-swahili/)
  → Le swahili n'est pas prioritaire pour le Cameroun, mais signale que
  l'écosystème de reconnaissance vocale en langues africaines avance ; à
  surveiller pour d'éventuelles langues locales (rien trouvé sur
  wolof/douala/ewondo cette semaine).
- Rien retenu ailleurs (extraction de reçus/factures, WhatsApp Business —
  la hausse de tarif annoncée par des blogs tiers n'apparaît dans aucune
  entrée datée du changelog officiel Meta cette semaine, donc non retenue).

---

## 25/09/2026

**Encore une semaine pauvre dans la fenêtre stricte (18-25/09) : aucun fait
concurrentiel retenu, un seul fait réglementaire (un rappel d'échéance, pas
une nouveauté), deux notes techniques mineures.** Les trois agents ont
écarté beaucoup de contenu daté juste avant la fenêtre (FNE Côte d'Ivoire
fin août-début septembre, tarification WhatsApp Business du 01/09) plutôt
que de le compter comme neuf.

### Concurrence

Rien retenu. Aucun fait daté du 18 au 25/09 trouvé et vérifié pour Wave,
Bumpa, Kippa, Flowcart, Khatabook, Vyapar, OkCredit, Sage, QuickBooks, Zoho
Books ou Jumia, sur aucun des marchés suivis (OHADA, Nigeria, Kenya, Inde,
Brésil).

### Règles, impôts et paiements

- **UEMOA : rappel du délai BCEAO pour l'interopérabilité des paiements
  instantanés (PI-SPI).** La BCEAO a fixé au 30/09/2026 la date limite pour
  que les banques et établissements de monnaie électronique des 8 pays
  UEMOA (dont Côte d'Ivoire, Sénégal, Burkina Faso) ouvrent le service
  PI-SPI : transferts entre particuliers gratuits, en moins de 10 secondes,
  24/7, QR code standardisé inter-opérateurs. L'article ne nomme pas MTN
  MoMo, Orange Money ou Wave spécifiquement. Publié le 23/09/2026.
  [benin-news.com](https://benin-news.com/2026/09/23/pi-spi-benin-paiement-instantane/)
  → Rien d'actionnable maintenant (pas de changement d'API/frais chez un
  opérateur nommé), mais à surveiller pour une future intégration mobile
  money multi-opérateurs dans les pays OHADA francophones.
- Rien de nouveau et vérifiable dans la fenêtre pour le Cameroun, le Gabon,
  le Sénégal, le Burkina Faso, la France, MTN MoMo ou Orange Money (les
  faits pertinents trouvés — FNE Côte d'Ivoire, tarification WhatsApp
  Business — datent d'avant le 18/09 et avaient déjà été notés ou écartés).

### Technologie et IA

- **Supabase renomme « Database > Replication » en « Database > Pipelines »
  dans le tableau de bord.** Les anciennes URL redirigent, aucun
  comportement d'API ne change. Publié le 21/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog)
  → Rien à corriger dans le code ; à retenir seulement si une documentation
  interne Finjaro montre encore l'ancien libellé.
- **Capacitor publie la version 9.0.0-alpha.7** (corrections Android/iOS,
  améliorations CLI). Publié le 18/09/2026.
  [github.com/ionic-team/capacitor](https://github.com/ionic-team/capacitor/releases)
  → Une alpha, pas une version pour la production ; à garder en tête pour
  une future migration majeure.
- Rien retenu ailleurs (OCR de reçus, voix en langues africaines,
  PWA/offline, WhatsApp Business) : soit hors fenêtre stricte, soit déjà
  noté les jours précédents.

---

## 24/09/2026

**La semaine la plus pauvre depuis le début de cette veille.** Fenêtre stricte
17-24/09 : les trois agents ont chacun passé en revue leur périmètre et
écarté tout ce qui datait d'avant le 17/09 (déjà noté) ou n'était pas
vérifiable par lecture directe de la source. Résultat : **aucun fait
concurrentiel, aucun fait réglementaire retenu cette semaine.** Deux petites
notes techniques internes, et un point de veille adjacent sur le paiement.

### Concurrence, règles et paiements

Rien retenu. Beaucoup de contenu circulait sur la Côte d'Ivoire, le Gabon,
le Sénégal et le Burkina Faso, mais tout datait d'avant le 17/09 (déjà noté
les jours précédents) ou portait des chiffres non vérifiables par lecture de
la source — écartés conformément à la règle du haut de ce document.

- **Point de veille adjacent, pas une nouveauté logicielle** : Konoom, une
  fintech tchadienne, a communiqué le 17/09/2026 sur un agrément
  d'établissement de paiement mobile au Cameroun (décret officiel du
  21/07/2026, vérifié). Ce n'est ni un logiciel de caisse ni de
  comptabilité — c'est un acteur mobile money de plus aux côtés d'Orange
  Money et MTN MoMo. Noté ici, sans idée associée : à ressortir seulement
  si Finjaro envisage un jour une intégration de paiement mobile
  supplémentaire.

### Technologie et IA

- **Supabase ajoute des « Health Check Advisors »** : surveillance des taux
  d'erreur sur Auth, Storage, Edge Functions et Data API, avec sévérité et
  lien direct vers le problème. Publié le 18/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog)
  → Utile en interne pour être alerté d'une panne du backend partagé avant
  qu'une commerçante ne la découvre en premier. Aucun changement pour
  l'application elle-même.
- Rien retenu ailleurs (OCR de reçus, voix en langues africaines,
  PWA/Capacitor, WhatsApp Business) : soit hors de la fenêtre stricte, soit
  déjà noté les jours précédents (Opus 5.5, GPT-6 Sol/Luna).

---

## 23/09/2026

**La semaine a de nouveau été pauvre dans la fenêtre stricte (16-23/09) — et
la découverte la plus utile aujourd'hui n'est ni fiscale ni concurrentielle,
c'est technique et interne.** Les trois agents ont écarté beaucoup de contenu
« 2026 » non daté précisément plutôt que de le garder par défaut : c'est ce
qu'on leur demande. Un seul fait mérite vraiment l'attention : **Zoho a lancé
une édition Nigeria de sa suite comptable avec e-facturation intégrée** — un
acteur mondial pose enfin un pied en Afrique de l'Ouest anglophone avec de la
conformité fiscale locale, pas seulement une traduction. La zone OHADA
francophone reste, pour l'instant, le terrain le moins disputé.

Côté technique : Supabase supprime aujourd'hui même (23/09) l'ancien point
d'entrée de ses journaux (`logs.all`) au profit d'un nouveau. **Vérifié dans
le code : Finjaro Accounting ne l'utilise nulle part.** Rien à corriger, mais
ça valait la peine de regarder un jour de bascule.

### Concurrence

- **Zoho Books arrive au Nigeria avec e-facturation et retenue à la source
  intégrées.** Édition Nigeria de Zoho Books (et de sa suite Billing,
  Invoice, Commerce, Inventory, Spend, Expense, Procurement, Practice) :
  calcul automatique de la TVA, gestion de la retenue à la source, barème TVA
  pour le portail TaxProMax, soumission directe des e-factures au portail de
  la Nigeria Revenue Service. Publié le 17/09/2026.
  [techeconomy.ng](https://techeconomy.ng/zoho-books-launches-nigeria-edition-to-help-businesses-manage-vat-and-e-invoicing),
  [brandspurng.com](https://brandspurng.com/2026/09/17/zoho-launches-nigeria-edition-of-zoho-books/)
  → Un acteur avec une force de frappe produit et marketing très supérieure
  entre en Afrique de l'Ouest avec de la conformité fiscale locale poussée. À
  surveiller : s'il étend cette localisation à la zone OHADA francophone.
- Rien trouvé dans la fenêtre stricte pour le Cameroun, la Côte d'Ivoire, le
  Sénégal, le Gabon, le Kenya, l'Inde ou le Brésil (les événements identifiés
  sur ces marchés datent tous d'avant le 16/09 et avaient déjà été notés, ou
  n'ont pas pu être datés avec certitude). Aucune levée de fonds ni
  changement de prix vérifié pour Sage, QuickBooks, Wave, Bumpa, Kippa,
  Khatabook, Vyapar ou OkCredit.

### Règles, impôts et paiements

- **France : premier bilan de la facturation électronique entre
  entreprises, deux semaines après son entrée en vigueur.** Aucun blocage
  d'entreprise signalé, mais trois frictions concrètes : factures rejetées
  pour données manquantes, erreurs d'adressage dans l'annuaire national,
  problèmes côté plateformes agréées. Publié le 15/09/2026.
  [yad.fr](https://www.yad.fr/facturation-electronique-bilan-15-jours/)
  (des chiffres de fréquentation cités dans cet article n'étaient pas
  sourcés par son auteur ; non retenus ici.)
  → Si Finjaro sert un jour un client français en émission obligatoire, il
  faudra valider les champs obligatoires et l'identifiant de destinataire
  avant transmission — pas après un rejet.
- Rien trouvé de vérifiable dans la fenêtre stricte pour le Cameroun, le
  Gabon, le Sénégal, le Burkina Faso, ni pour les API ou frais de MTN MoMo,
  Orange Money ou Wave. Plusieurs chiffres circulaient dans des extraits de
  recherche (promotion Burkina Faso, taxe mobile money Cameroun) sans page
  source lisible pour les confirmer : **non retenus**, conformément à la
  règle du haut de ce document.

### Technologie et IA

- **Claude Opus 5.5** : multimodal, lecture de documents denses et de
  photos pour l'extraction, prix en baisse d'environ 20 % par rapport à
  Opus 5. Publié le 22/09/2026.
  [anthropic.com](https://www.anthropic.com/claude-opus-5-5)
  → Rendrait moins coûteuse une fonctionnalité « photographier un reçu →
  écriture préremplie » si elle passe par cette API.
- **GPT-6 Sol et GPT-6 Luna** (OpenAI) : deux modèles moins chers que leurs
  prédécesseurs, fenêtre de contexte de 1,05 million de tokens. Publié le
  22/09/2026.
  [techcrunch.com](https://techcrunch.com/2026/09/22/openai-launches-gpt-6-sol-and-luna/)
  → Alternative à comparer si un futur assistant texte (catégorisation de
  dépenses, aide comptable) cherche à réduire son coût.
- **Supabase ajoute des « Health Check Advisors »** : surveillance des taux
  d'erreur sur Auth, Storage, Edge Functions et Data API, avec sévérité et
  lien direct vers le problème. Publié le 18/09/2026.
  [supabase.com/changelog](https://supabase.com/changelog)
  → Détecterait une panne d'auth ou de fonction edge partagée avant qu'une
  vendeuse ne signale un problème de caisse. Voir idée n° 9, déjà notée.
- **Supabase retire l'ancien point d'entrée `analytics/endpoints/logs.all`
  aujourd'hui même, 23/09/2026**, au profit de `analytics/endpoints/logs`.
  [byteiota.com](https://byteiota.com/supabase-september-2026-scoped-tokens-trace-context-and-the-logs-all-deadline/)
  → Vérifié dans le code de Finjaro Accounting : `logs.all` n'y est appelé
  nulle part. Rien à corriger.

---

## 22/09/2026

**Ce qui ressort aujourd'hui : la semaine a été pauvre en nouveautés, et c'est
un résultat en soi.** Les trois recherches ont cherché dans la fenêtre stricte
du 15 au 22 septembre et ont écrit « rien trouvé » plutôt que de remplir avec
du vieux. Deux choses méritent une décision : la Côte d'Ivoire contrôle
désormais les reçus normalisés chez les micro-entreprises — nos utilisateurs
exactement — et le Burkina met les **éditeurs de logiciels** dans la première
vague de certification.

**Et une correction de correction, sur le même sujet que le 19/09.** La
recherche technologie a conclu que l'annonce de facturation des messages de
service WhatsApp était fausse, parce que la page tarifaire de Meta dit encore
que les conversations de service sont gratuites. C'est exactement le piège que
j'avais documenté il y a trois jours, et un agent y est retombé. J'ai vérifié
moi-même : la page Meta dédiée dit mot pour mot « Effective October 1, 2026,
Meta will charge for service messages, which have not been charged since
November 2024 ». **Ma correction du 19/09 tient.** L'ancienne adresse de la
page décrit l'état actuel ; la nouvelle décrit le changement.

### Règles et impôts

- **Côte d'Ivoire : les contrôles de la facture et du reçu normalisés
  électroniques ont commencé, et les micro-entreprises sont dedans.** La DGI
  contrôle depuis le 1er septembre 2026 l'usage de la FNE (facture) et du RNE
  (reçu) sur tout le territoire. Quatre régimes visés, dont **le régime des
  micro-entreprises (RME) et celui de l'entrepreneur** — c'est-à-dire notre
  public. Les entreprises non régularisées encourent les amendes du Livre de
  procédures fiscales ; un montant de 10 millions FCFA circule dans les
  résultats de recherche, la page n'a pas pu être ouverte, **le chiffre n'est
  donc pas retenu**. Publié le 31/08/2026.
  [yeclo.com](https://www.yeclo.com/facture-normalisee-electronique-en-cote-divoire-la-dgi-lance-des-controles-le-1er-septembre/)
  → Une caisse Finjaro qui n'émet pas de reçu normalisé électronique met le
  commerçant ivoirien en infraction. Ce n'est plus une fonctionnalité qui
  manque, c'est un risque qu'on lui fait courir.

- **Et les commerçants ivoiriens s'organisent contre.** La FENACCI a d'abord
  exigé la suspension des contrôles, puis créé le 5 septembre 2026 un
  Observatoire National de la FNE pour réclamer une concertation. Publié les
  30/08 et 05/09/2026.
  [koaci.com](https://www.koaci.com/article/2026/09/05/cote-divoire/economie/cote-divoire-facturation-normalisee-electronique-la-fenacci-lance-lon-fne-et-appelle-a-une-veritable-concertation_200226.html)
  → Des milliers de commerçants sont contraints d'émettre des factures
  conformes tout en rejetant les solutions qu'on leur impose. C'est une porte
  d'entrée, pas seulement une contrainte.

- **Burkina Faso : les éditeurs de logiciels sont dans la PREMIÈRE vague.**
  Le calendrier de mise en vente des systèmes certifiés était déjà noté le
  19/09 ; ce qui est nouveau, c'est qui est visé quand. Le 7 septembre 2026
  concerne les entreprises de la DGE **et les éditeurs de logiciels** ; le
  2 novembre les DME au régime normal ; le 1er décembre les DME au régime non
  déterminé. Trente jours de mise en conformité après chaque date. Prix
  promotionnel de 150 000 FCFA par unité jusqu'au 31/12/2026. Publié le
  03/09/2026.
  [burkina24.com](https://burkina24.com/2026/09/03/communique-facture-electronique-certifiee-la-mise-en-vente-des-systemes-de-facturation-demarre-le-7-septembre-2026-au-burkina-faso-2/)
  → C'est le seul texte trouvé à ce jour qui vise explicitement les éditeurs.
  Vendre au Burkina demanderait d'acquérir un module de contrôle et de se
  certifier — pas d'émettre un PDF bien présenté.

- **France : une proposition de loi demande un moratoire sur la facturation
  électronique des petites structures.** Déposée à l'Assemblée nationale le
  15 septembre 2026 par La France Insoumise, elle vise à suspendre
  l'obligation pour les auto-entrepreneurs, PME et exploitants agricoles, et à
  créer un portail public en alternative aux plateformes privées. Motif
  invoqué : aucun portail public n'a été mis en place ni accompagnement
  déployé. Publié le 17/09/2026.
  [agra.fr](https://www.agra.fr/articles/facturation-electronique-une-proposition-de-loi-lfi-sur-un-moratoire)
  → Un signal de risque calendaire, pas une règle. Ça ne change rien
  aujourd'hui ; ça dit de ne pas investir dans une offre d'émission pour
  micro-entreprises françaises sans suivre ce texte.

- **UEMOA : l'échéance de raccordement au paiement instantané tombe le
  30 septembre, dans huit jours.** Communiqué BCEAO du 25 juin 2026 : les
  banques, établissements de monnaie électronique et établissements de
  paiement doivent être connectés à PI-SPI au 30/09/2026 ; les institutions de
  microfinance au 30/06/2027. Au 24 juin, 80 participants étaient connectés et
  74 institutions en tests réels.
  [bceao.int](https://www.bceao.int/fr/communique-presse/prolongation-du-delai-de-connexion-a-pi-spi)
  → Les portefeuilles de nos marchands en zone UEMOA vont devenir
  interopérables à l'encaissement. Notre modèle « un portefeuille = une
  intégration » va cesser d'être le bon ; il faudra raisonner « un identifiant
  de paiement instantané ».

### Concurrence

- **Brésil : Bling augmente son entrée de gamme et compte désormais les
  commandes venues de son API.** Le plan Cobalto est passé de 55 à 60 R$ par
  mois en août 2026 (jour exact non précisé par la source), et les plans
  comptent maintenant aussi les commandes importées par API, sur une moyenne
  mobile de trois mois. L'article décrit des petits détaillants qui cherchent
  des solutions moins chères. Publié le 10/09/2026.
  [paranaportal.com](https://www.paranaportal.com/geral/com-o-reajuste-do-bling-pequenos-lojistas-buscam-alternativas-mais-simples-e-baratas-para-vendas-estoque-e-emissao-de-notas-veja-as-opcoes/)
  → Leçon de tarification, pas menace : facturer au volume de commandes fait
  fuir les plus petits, ceux qu'on vise. Un prix plat et lisible est un
  argument, pas une concession.

### Technologie

- **Cloudflare : on peut enfin limiter un jeton à un seul Worker.** Annoncé le
  15 septembre 2026, disponible immédiatement pour tous les comptes. Quatre
  rôles (lecture des métadonnées, lecture du contenu, éditeur, administrateur)
  peuvent être restreints à un Worker précis au lieu du compte entier. Les
  routes et domaines personnalisés demandent en plus une permission au niveau
  de la zone.
  [blog.cloudflare.com](https://blog.cloudflare.com/workers-granular-authorization/)
  → Le déploiement automatique pourrait recevoir un jeton qui ne peut toucher
  que `staging-finjaro`. Aujourd'hui, une fuite de ce jeton atteindrait
  `finjaro.net`, donc les applications Android et iOS qui chargent ce domaine.
  C'est petit à faire et ça ferme une porte réelle.

- **Capacitor 9 entre en préversion.** La `9.0.0-alpha.7` est sortie le
  18 septembre 2026. Les nouveautés touchent précisément l'affichage Android :
  prise en charge du bord-à-bord dans l'outil de migration, marges par défaut
  des barres système passées à `native`, Cordova devenu optionnel. La branche
  stable reste 8.5.2, celle qu'on utilise.
  [github.com/ionic-team/capacitor](https://github.com/ionic-team/capacitor/releases)
  → Rien à faire maintenant. Quand on migrera, ça touchera les marges et les
  barres système — exactement l'endroit où un recadrage coupe un visuel sur
  grand écran. À essayer sur plusieurs largeurs, pas seulement sur 390 px.

- **Cloudflare : Python devient officiellement supporté sur les Workers.**
  Disponibilité générale le 21 septembre 2026, après deux ans de préversion.
  Les bibliothèques Python d'images et d'IA tournent nativement, avec accès à
  D1, R2 et Workers AI.
  [blog.cloudflare.com](https://blog.cloudflare.com/python-workers-ga/)
  → Ouvre une porte sans rien casser : un futur traitement de photo de reçu
  pourrait vivre là plutôt que dans une fonction edge Supabase, qui touche
  préproduction et production d'un seul coup.

- **WhatsApp — ma correction du 19/09 est confirmée, à la source.** La page
  Meta dédiée aux messages hors modèle dit : « Effective October 1, 2026, Meta
  will charge for service messages, which have not been charged since November
  2024 », et « By market, rates for service messages are the same as the rates
  for utility and authentication messages ».
  [developers.facebook.com](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages)
  → Toujours sans effet sur nous aujourd'hui : nos boutons ouvrent des liens
  `wa.me`, donc des conversations ordinaires, pas l'API Business. Ça
  compterait le jour où on enverrait des rappels automatiques.
  **Non retenu, faute de confirmation sur une page Meta :** le millier de
  messages gratuits par mois et par numéro, et l'arrêt de livraison au
  1er octobre pour les comptes sans moyen de paiement. Ces deux points ne
  viennent que de blogs d'intégrateurs.

### Ce qui n'a pas pu être établi

- **Rien de neuf sur le mobile money cette semaine** : ni tarif marchand, ni
  version d'API, ni dépréciation chez MTN MoMo, Orange Money, Wave, Moov ou
  Airtel. Les portails développeurs n'exposent pas de journal des changements
  daté et interrogeable.
- **Cameroun, Sénégal, Gabon, Bénin, Togo, Mali** : aucune source datée du
  15–22 septembre. Des chantiers existent (eBilling camerounais, agrément des
  dispositifs de facturation au Gabon via la loi de finances rectificative,
  facture certifiée au Togo), mais rien d'ouvrable et de daté. Pour le Gabon
  en particulier : aucune liste d'éditeurs agréés, aucune procédure publiée,
  aucune date d'ouverture de guichet. Toujours non trouvé — c'est la troisième
  note consécutive où ce point reste ouvert.
- **QR code interopérable CEMAC** : des résultats évoquent un lancement le
  29 juillet 2026 à Douala, mais les pages renvoient une erreur 403. Non
  vérifié, donc non retenu.
- **France, nouvelles mentions obligatoires B2B** : un article non daté évoque
  quatre mentions supplémentaires au 1er septembre 2026 (SIREN du client,
  adresse de livraison distincte, nature des opérations, option TVA sur les
  débits). Cohérent avec la réforme mais **non daté** — à confirmer sur
  impots.gouv.fr avant d'en faire une règle dans le produit. Ça concerne
  directement les mentions de facture posées hier.
- **Aucun concurrent** n'a publié quoi que ce soit de daté dans la fenêtre, ni
  en Afrique francophone, ni au Nigeria, au Kenya, en Inde ou au Brésil. Odoo
  20 est annoncé par des blogs pour l'Odoo Experience du 24–26 septembre ; la
  page officielle des notes de version ne liste que la 19.4 de juillet 2026,
  donc non retenu.
- **Lecture de reçus par photo et reconnaissance vocale** : rien de neuf dans
  la fenêtre qui tourne sur un téléphone Android d'entrée de gamme.
- **Chrome 154**, annoncé par des sources secondaires pour le 22 septembre
  avec HTTPS obligatoire par défaut : notes officielles en 404, non confirmé.
  À revoir la semaine prochaine — ça toucherait tout site public.

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
