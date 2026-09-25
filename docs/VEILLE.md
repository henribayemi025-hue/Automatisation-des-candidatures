# Veille — innovation, concurrence, règles, IA

Une note par jour, la plus récente en tête. Trois agents fouillent le web en
parallèle (concurrence ; règles et paiements ; technologie et IA), je trie, je
garde ce qui est nouveau et utile.

**Règle qui ne se discute pas : aucun chiffre inventé.** Un taux, un seuil, un
prix ou une date qui ne figure pas dans une source réellement lue n'est pas
écrit ici. Quand l'information manque, c'est écrit « non trouvé ». Sur un sujet
fiscal, un chiffre faux ferait prendre un risque réel à un commerçant.

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
