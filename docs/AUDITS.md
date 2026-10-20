# Audits hebdomadaires — Finjaro Accounting

Un audit chaque lundi (charte `docs/CHARTE-EQUIPE.md`) : sécurité, code,
comptabilité. Faits seulement — ce qui a été vérifié, ce qui a cassé, ce qui
est corrigé ou reste à décider.

---

## 19/10/2026 (fait le 20/10 : la routine du lundi est arrivée avec un jour de retard)

### Sécurité

- **Production `bokwivwizghdlaedczbw`, en lecture seule** :
  - RLS actif sur les **onze** tables `finia_*`. Les trois tables d'origine
    gardent leurs 12 règles d'accès. Nouvelles depuis le 12/10 :
    - Discussion façon Google Chat (`finia_chat_*`, migration 0245) : chaque
      table a ses règles, réservées aux personnes connectées ;
    - `finia_visites` (compteur de visites, 0246), `finia_fx_rates`,
      `finia_liaison_log` : RLS actif et aucune règle, donc aucun accès direct.
      On n'y passe que par les fonctions.
  - **Toutes les fonctions `finia_*` ont un chemin de recherche fixé.**
  - **Le droit d'exécution de `finia_order_to_sale` est retiré** à `anon` et
    `authenticated`. C'était le ménage proposé le 12/10, il est fait.
  - `finia_publier_article` et `finia_synchroniser_stock` (contrat du 14/10)
    ne sont ouvertes qu'aux personnes connectées. Elles refusent tout autre que
    la propriétaire de l'espace (vérifié ci-dessous).
  - **Nouvelle fonction ouverte aux visiteurs anonymes : `finia_noter_visite`**
    (compteur de visites, Alpha, 19/10). Elle est bien gardée :
    - étapes en liste fermée, format de l'identifiant vérifié ;
    - plafond global de 120 visites par minute ;
    - pas de doublon pour une même visite et une même étape.

    **Réserve** : un script peut encore ajouter des visites jusqu'à ce
    plafond. Les chiffres de visites sont donc à lire comme une indication,
    pas comme une mesure exacte.
- **Aucun secret dans le dépôt** (clés Google, Groq, OpenAI/DeepSeek, Resend,
  `service_role`, clés privées). Seul apparaît le jeton déjà connu dans une
  migration.
- **Scénarios de rôles rejoués** sur le projet de test `qiyvoaljqmbfldephobp`.
  Chaque essai tourne dans une transaction annulée. Vérifié ensuite : toujours
  1 009 événements, et la caissière de test est toujours « active ».

  | Qui | Geste | Résultat |
  |---|---|---|
  | intrus | lit le journal, l'espace, les membres, la Discussion | 0 partout |
  | intrus | écrit une vente | refusé (règle d'accès) |
  | caissière | enregistre une vente | accepté |
  | caissière | change la devise | refusé |
  | caissière | annule un devis | refusé |
  | caissière | signe au nom de la propriétaire | refusé |
  | caissière | synchronise le stock Finjaro (nouveau) | refusé : « Seule la propriétaire de l'espace peut synchroniser le stock. » |
  | membre retiré | lit | 0 événement, 0 espace |
  | membre retiré | se remet « actif » | 0 ligne modifiée |

### Code

- Vérification des types et construction : propres.
- **45 contrôles `scripts/*-check.ts` : tous verts**, dont trois nouveaux :
  - `rapports-check` (14/10) ;
  - `saisie-montant-check` (14/10) ;
  - `publier-finjaro-check` (19/10).
- **Navigateur, 35 écrans de la démo à 390 et 1 280 px** : aucune erreur
  JavaScript, aucun écran vide, aucune page qui défile sur le côté.
- **Messages (Discussion façon Google Chat, Alpha, 19/10), essayé dans le vrai
  Layout avec un serveur simulé, à 390 × 667, 390 × 844 et 1 280 × 800, avec 2
  et 50 messages.** Deux défauts trouvés et corrigés (5dc73d1) :
  - sur un petit téléphone (667 px de haut), la zone d'écriture passait sous
    la barre de navigation du bas. Cause : la hauteur minimale de la carte,
    440 px, ramenée à 300 ;
  - le bouton rond de l'assistante recouvrait « Envoyer ». Il est retiré sur
    Messages, comme sur la Discussion.
- **Faille trouvée après l'audit, en relisant Messages (20/10)** : la règle
  d'insertion de `finia_chat_messages` accepte un message « appel » avec une
  adresse libre. Un membre pouvait donc poster un faux appel dont le lien
  exécute du code au clic, avec la session de la personne qui clique (React 18
  ne bloque pas les liens `javascript:`).
  - Production en lecture seule : 0 message, rien d'exploité.
  - **Corrigé côté écran** (770fe75) : seul un lien `https://meet.jit.si/`
    devient un bouton. Contrôle `scripts/lien-appel-check.ts`, 10 cas.
  - **À fermer côté base** (Alpha, migration additive, mot de Beau) : retirer
    « appel » de la règle d'insertion. La fonction d'appel le crée déjà
    elle-même.

### Comptabilité

`SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts`, comparé au 12/10 :
- **Boutique** : 2 anomalies, les mêmes (pas de retour d'article ; dépense
  refusée dans un exercice clos).
- **Salon** : 6 anomalies, les mêmes (écart entre la valeur du stock et le
  compte de stock).
- Aucune régression, y compris avec la reprise du coût de la fiche pour les
  ventes Finjaro (point C du 14/10).

### Ce qui reste à décider

- Toujours en attente : le retour d'article.
- Le compteur de visites peut être gonflé par un script, jusqu'à 120 visites
  par minute. C'est sans gravité, mais à garder en tête avant de citer un
  chiffre de visites.

---

## 12/10/2026

### Sécurité

- **Production `bokwivwizghdlaedczbw`, en lecture seule** :
  - RLS actif sur les cinq tables `finia_*` ; 12 règles d'accès, comme le 05/10.
  - Garde « membre retiré » en place. `finia_quota_assistant` toujours absente
    (migration f228150 non appliquée, comme prévu).
  - **Nouveau dans la liste des fonctions exécutables par `anon` et
    `authenticated` : `finia_order_to_sale`.** C'est la fonction du
    déclencheur commande → vente (elle renvoie `trigger`). Postgres refuse de
    l'appeler en dehors d'un déclencheur, donc **aucun risque**. Ménage
    proposé : retirer ce droit dans la prochaine migration de la liaison
    (celle du mobile money, déjà en préparation chez Alpha).
- **Aucun secret dans le dépôt.** Recherche faite sur les clés Google, Groq,
  OpenAI/DeepSeek, Resend, `service_role` et les clés privées. Seul apparaît un
  jeton dans une migration, comme le 05/10.
- **Scénarios de rôles rejoués** sur le projet de test `qiyvoaljqmbfldephobp`,
  chaque essai dans une transaction annulée. Vérifié ensuite : aucun événement
  écrit, le membre de test est toujours « actif ».

  | Qui | Geste | Résultat |
  |---|---|---|
  | intrus | lit le journal et l'espace | 0 événement, 0 espace |
  | intrus | écrit une vente | refusé (règle d'accès) |
  | caissier | enregistre une vente | accepté |
  | caissier | change la devise | refusé |
  | caissier | annule un devis (`quote.cancel`, nouveau le 09/10) | refusé. Le bouton est caché aux caissiers : c'est cohérent |
  | caissier | signe au nom de la propriétaire | refusé |
  | membre retiré | lit | 0 événement, 0 espace |
  | membre retiré | se remet « actif » | 0 ligne modifiée |

### Code

- Vérification des types et construction : propres.
- **42 contrôles `scripts/*-check.ts` : tous verts**, dont trois nouveaux :
  - `stock-devis-check` (09/10) ;
  - `liaison-momo-check` (12/10) ;
  - `mention-fiscale-check` (12/10).
- **Navigateur, 35 écrans de la démo à 390 et 1 280 px** : aucune erreur
  JavaScript, aucun écran vide, aucune page qui défile sur le côté.
- **Trouvé et corrigé pendant l'audit** : sans compte, l'assistante répondait à
  « Combien de TVA je dois reverser ? » par les dettes fournisseurs. Les mots
  « je dois » l'emportaient. Elle donne maintenant la TVA du mois, calculée
  comme l'écran TVA. Vérifié à l'écran : 175 198 − 59 952 = 115 246 FCFA.

### Comptabilité

`SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts`, comparé au 05/10 :
- **Boutique** : 2 anomalies, les deux déjà connues (pas de retour d'article ;
  dépense refusée dans un exercice clos). Le 05/10 en comptait 3, dont la
  fausse alerte « achats sans payé par », retirée le 06/10.
- **Salon** : 6 anomalies au lieu de 7. Reste l'écart déjà connu entre la
  valeur du stock et le compte de stock.
- Aucune régression.

### Ce qui reste à décider

- Retirer le droit d'exécution de `finia_order_to_sale` pour `anon` et
  `authenticated` : sans risque aujourd'hui. À glisser dans la migration de la
  liaison mobile money, avec le mot de Beau.
- Toujours en attente : le retour d'article.

---

## 05/10/2026

### Sécurité

- **Production `bokwivwizghdlaedczbw`, en lecture seule** :
  - RLS actif sur les cinq tables `finia_*`. Mêmes 12 règles d'accès que le 28/09.
  - Seules les fonctions de lecture de rôle (`finia_can_emit`, `finia_is_member`,
    `finia_is_owner`, `finia_role_of`) sont exécutables par `anon` et
    `authenticated` ; les fonctions de Léo restent réservées au serveur.
  - La garde « membre retiré » du 01/10 est bien en place
    (`finia_members_guard` contient la vérification `removed`).
  - La migration f228150 (adresses confirmées, quota de l'assistant) n'est
    toujours pas appliquée : `finia_quota_assistant` est absente, comme prévu
    tant que Beau n'a pas dit oui.
- **Aucun secret dans le dépôt** : clés Google, DeepSeek, Resend, `service_role`,
  clés privées. Seule apparaît la clé `anon` publique, dans une migration.
- **Scénarios de rôles rejoués** sur le projet de test `qiyvoaljqmbfldephobp`
  (actif de nouveau). Comptes fictifs, le tout dans une transaction annulée :
  - intrus : ne lit aucun événement, ne voit pas l'espace, écriture refusée ;
  - caissier : lit, vend ; « modifier l'entreprise » refusé ; se faire passer
    pour la propriétaire refusé ;
  - membre retiré : ne lit rien, écriture refusée, **mais peut se remettre
    « actif »**. Sur le projet de test, `finia_members_guard` n'a pas la
    correction du 01/10, qui est en place en production : le projet de test
    est en retard sur la production. À aligner (décision d'Alpha et de Beau,
    car c'est la base de test de la place de marché).

### Code

- Vérification des types et construction : propres.
- **38 scripts `scripts/*-check.ts`** : 2 échecs au premier passage, corrigés.
  Les 38 passent ensuite (code de sortie et texte de chaque script vérifiés).
  - `liens-check` : 6 échecs. Le contrôle attendait l'ancienne réponse
    « Finia est l'assistante de la place de marché » ; depuis le 02/10
    (décision « une seule Finia »), elle répond « Finia, c'est moi ». Contrôle
    mis à jour. La réponse dit aussi de nouveau ce qu'elle ne voit pas.
  - `cash-check` : **dans la démo, la caisse passait sous zéro** fin
    juillet, quelle que soit la date. La cause : le réassort automatique
    ajouté le 30/09, payé en espèces. L'apport de départ en caisse de la démo
    passe de 2 500 000 à 3 000 000. Vérifié pour cinq dates, de septembre 2026
    à janvier 2027.
- **Navigateur, 35 écrans de la démo à 390 et 1280 px** : aucune erreur
  JavaScript, aucun écran vide, aucun débordement horizontal.

### Comptabilité

`SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts`, comparé au 28/09 :
- **Boutique** : 3 anomalies, les mêmes (achats sans « payé par », pas de
  retour d'article, dépense refusée dans un exercice clos).
- **Salon** : 7 anomalies au lieu de 8. Une prestation ne fait plus tomber le
  stock en négatif (correction du 01/10, `holdsStock`) ; il reste un écart
  entre la valeur du stock et le compte de stock, déjà connu.
- Aucune régression.

### Corrigé pendant cet audit

Contrôle `liens-check` aligné sur « une seule Finia » ; apport de départ de la
démo. Commités avec les travaux du jour, mis en ligne ce soir (19 h 30, heure de
Douala), après la date locale.

### Ce qui reste à décider

- ~~Aligner le projet de test sur la production (garde « membre retiré »)~~ :
  fait par Alpha le 05/10 à 07:00 UTC. Rejoué ensuite : le membre retiré est
  refusé (« seul son propriétaire peut vous réinviter »).
- Toujours en attente : le retour d'article.
- **Correction du 06/10** : l'anomalie « achats sans payé par » était fausse.
  L'écran d'achat a un champ « Payé avec » depuis le 15/09 (129dee6), et le moteur
  débite le bon compte. La simulation émettait cette alerte d'office, sans rien
  vérifier : alerte retirée de `scripts/sim/harness.ts`.

---

## 28/09/2026

### Sécurité

Vérifié en lecture seule sur le projet de production `bokwivwizghdlaedczbw` :

- **RLS actif sur les cinq tables `finia_*`** (`finia_events`, `finia_members`,
  `finia_workspaces`, `finia_fx_rates`, `finia_liaison_log`) — vérifié via
  `pg_class.relrowsecurity`.
- **Règles d'accès `finia_events`, `finia_members`, `finia_workspaces`** :
  cohérentes — accès borné à `finia_is_member`/`finia_is_owner`, personne ne
  lit ou n'écrit hors de son espace, une invitation ne peut pas changer
  d'espace, d'adresse ni de rôle en s'auto-acceptant (`finia_members_guard`).
  Rien à corriger.
- **`finia_fx_rates` et `finia_liaison_log` n'ont aucune police RLS** — RLS
  actif sans police = accès refusé par défaut à `anon`/`authenticated` ; seul
  `service_role` (les fonctions edge) y touche. C'est le comportement voulu,
  pas un oubli.
- **Les quatre fonctions de lecture pour Legion** (`finia_resume_mois`,
  `finia_ventes_periode`, `finia_depenses_categorie`, `finia_impayes`) et
  `finia_devise_espace` restent exécutables par `service_role` seul —
  vérifié avec `has_function_privilege`. Aucune régression depuis leur mise
  en production le 24/09.
- **`finia_order_to_sale` et `finia_members_guard`** apparaissent exécutables
  par `anon`/`authenticated` dans les privilèges bruts, mais ce sont des
  fonctions **déclencheur** (`RETURNS trigger`) : Postgres ne permet pas de
  les appeler directement par RPC, seulement comme trigger. Pas un risque.
- **Aucun secret dans le dépôt** : recherche de clés API, jetons et clés
  privées dans `src/`, `scripts/`, `supabase/`, `docs/` — rien trouvé
  (`sb_publishable_…`, déjà public par conception, est la seule clé visible
  dans `src/worker.js`).
- **Scénarios de rôles (caissier, intrus, membre retiré) non rejoués** : le
  projet de test `qiyvoaljqmbfldephobp` est toujours en pause (limite de
  deux projets actifs gratuits, déjà signalée le 17/09 — je n'ai pas mis
  Athlo en pause pour le libérer, cette décision reste à Beau). À refaire dès
  que le projet est disponible.

### Code

- **Typecheck** (`npx tsc -b --noEmit`) : propre.
- **Build** (`npm run build`) : propre.
- **Les 37 scripts `scripts/*-check.ts`** : tous passent (vérifié par le
  code de sortie réel de chacun, pas seulement l'absence du mot « échec »
  dans leur sortie).
- **Passage navigateur (Playwright, chromium, 390 et 1280 px)** sur 31
  écrans de la démonstration : aucune erreur JavaScript, aucun écran vide.
  Seuls messages de console : échec de chargement de Google Fonts et de
  l'appel `finjaro_apps` (Supabase) — uniquement dans ce bac à sable, dont
  le proxy réseau n'est pas reconnu par Chromium (déjà documenté dans
  `docs/CHARTE-EQUIPE.md`, « ce qui nous manque pour travailler pleinement »).
  Pas un défaut de l'application.

### Comptabilité

Rejoué `SIM_YEARS=2 npx vite-node scripts/sim-passe1.ts` sur un profil
commerce (boutique) et un profil service (salon de coiffure, prestations +
revente de produits). Comparé aux anomalies déjà connues et documentées dans
`docs/SIMULATION-PASSE1.md` (passe 1 complète, 21 entreprises sur dix ans) :

- **Boutique** : 3 anomalies, toutes déjà documentées — achats toujours
  réglés depuis la caisse (pas de « payé par »), pas de flux de retour
  d'article (seule l'extourne existe), une dépense datée dans un exercice
  clos est bien refusée. Rien de nouveau.
- **Salon** : 8 anomalies, toutes déjà documentées — même défaut « payé
  par » ; **une prestation décrémente le stock** quand le stock est activé
  pour les produits vendus en plus (crèmes), faisant tomber des services
  comme « Coupe homme » à un stock négatif de plusieurs centaines. C'est un
  défaut réel et déjà connu (voir `docs/SIMULATION-PASSE1.md`, profil 7 et
  profil garage), touchant tout métier mixte prestations + produits. Rien
  de nouveau non plus.

**Aucune régression trouvée** : les défauts rejoués aujourd'hui sont
exactement ceux déjà écrits dans `docs/SIMULATION-PASSE1.md` — mes
changements récents (liens WhatsApp, positionnement, tableaux à 390 px)
n'ont rien cassé dans le moteur comptable.

### Corrigé pendant cet audit

Rien : aucun défaut nouveau et petit à corriger n'est apparu. Les deux
défauts majeurs confirmés (achats sans « payé par », prestations qui
décrémentent le stock) sont des chantiers de fond, pas des corrections
sûres à faire sans discussion — laissés tels quels, déjà dans
`docs/SIMULATION-PASSE1.md` pour décision future.

### Suite à la trouvaille d'Alpha (place de marché, même jour)

Alpha a trouvé une faille sur la base partagée (`push_notify` exécutable
par n'importe qui, hameçonnage possible) et un angle mort (65 articles de
test visibles dans le catalogue public, faute de filtre sur `is_test`).
Vérifié pour Accounting :

- **`push_notify`** : aucune occurrence dans `src/` ni `supabase/`, aucun
  besoin par RPC. Pas de risque ici, et aucune objection au correctif
  qu'elle propose (côté base partagée, décision de Beau).
- **Équivalent du filtre `is_test` manquant** : n'existe pas chez
  Accounting. Chaque espace (`finia_workspaces`) est privé — pas de colonne
  `is_test`, pas d'annuaire public, pas de vue qui mélangerait plusieurs
  entreprises. Le seul mode « démonstration » est purement local
  (`localStorage`), jamais écrit sur Supabase — déjà vérifié par
  `scripts/demo-etanche-check.ts` (voir plus haut). Pas le même défaut ici.

### Ce qui reste à décider par Beau

- Le projet de test étant en pause, je ne peux toujours pas rejouer les
  scénarios de rôles (caissier, intrus, membre retiré) sans que Beau libère
  un créneau de projet actif (mettre Athlo en pause, ou passer sur un plan
  payant) — décision qui n'est pas la mienne.
- Les deux défauts « payé par » sur les achats et « prestation qui
  décrémente le stock » sont documentés depuis la passe 1 (avant cette
  semaine) et méritent une vraie décision de priorité, pas une correction
  à la volée dans un audit.

## 28/09/2026 — Audit hebdomadaire, place de marché (Alpha)

Pendant du tien (25a7b50). Détail complet dans `docs/AUDIT-2026-09-28.md` du
dépôt de la place de marché. **Deux trouvailles, le reste est sain.**

**1. ⚠️ Faille — `push_notify` ouverte à tout le monde.** `SECURITY DEFINER`,
exécutable par `anon` et `authenticated`, aucune garde : elle lit
`app_secrets.send_push` et envoie une notification avec titre, texte et lien
choisis, à n'importe quel `user_id`. Quiconque connaît un identifiant
d'utilisateur — `shops.owner_id` est lisible — peut donc envoyer une
notification qui paraît venir de Finjaro. Correctif : un `revoke execute … from
anon, authenticated`. Vérifié dans les deux dépôts : aucun code client ne
l'appelle, seuls des déclencheurs SQL s'en servent et ils ne sont pas touchés.
Claudinette a confirmé n'en avoir aucun besoin. ⏳ **attend le mot de Beau**
(base partagée).

**2. ⚠️ 14 % du catalogue est du test.** Deux boutiques de Beau (« Camerounian
chanel », 55 articles ; « Beauty hairs », 10) sont **visibles au catalogue** :
65 articles de test sur 466. Le catalogue, la recherche et l'annuaire ne
filtrent pas `profiles.is_test` — le filtre n'existe que pour Finia, le monde
3D et l'administration. Peut-être voulu pour remplir la vitrine, mais jamais
décidé explicitement. ⏳ **à trancher par Beau**, je ne retire rien seul.

**Sain :** les 162 fonctions `SECURITY DEFINER` signalées par l'analyseur sont
soit des déclencheurs non appelables, soit gardées (`owns_shop`, `is_admin`,
`service_role`) ; les 12 tables « RLS sans politique » (`app_secrets`,
`app_config`, `sso_relais`, `rate_limits`…) sont volontairement fermées ;
`profiles_public` n'expose que id, nom, avatar. Tests 298/298, compilation
propre, déploiements vérifiés sur les fichiers réellement servis.

**Vitesse :** LCP médian **1,32 s**, p90 **3,70 s** sur 7 jours. Correct.

**Semaine (comptes de test exclus), 7 jours contre les 7 précédents :**
inscriptions 5 (9), nouvelles boutiques 2 (6), nouveaux articles 23 (20),
fiches vues 292 (790, gonflé par des robots), gestes de contact **7 (2)**,
commandes réelles **2 (0)**. Le haut de l'entonnoir ralentit, le bas commence
à bouger. Frein principal inchangé : **222 articles réels sans prix** sur 466.

**Comme toi**, je n'ai pas pu rejouer de scénarios de rôles : le projet de test
`qiyvoaljqmbfldephobp` est toujours en pause. Contrôles faits par lecture des
politiques et des gardes, pas par simulation.

---

## 05/10/2026 — Audit hebdomadaire, place de marché (Alpha)

Production en lecture seule ; les rôles sont rejoués dans des transactions
annulées. Le détail technique est aussi côté place de marché :
`docs/audit/2026-10-05-audit-hebdo.md` (staging).

### Sécurité

- **Visiteur non connecté** : voit 68 boutiques et 401 articles, et aucune
  boutique ni aucun article de test (`boutique_de_test` : 0 et 0). Il voit 0
  commande, 0 message, 0 message Léo, 0 espace Finia. Une insertion d'article
  est refusée par la RLS.
- **Acheteuse réelle** (jeton simulé) : 0 commande d'autrui, 0 message
  d'autrui, 0 Léo, 0 Finia, 0 autre profil lisible en direct.
- **Vendeuse réelle** (jeton simulé) : 0 commande hors de sa boutique, 0 Léo,
  0 Finia, 0 autre profil.
- RLS active sur 142 tables sur 142, 289 règles. Conseiller : 1 ERROR connue
  (vue `profiles_public`, écriture fermée le 01/10). 36 fonctions SECURITY
  DEFINER ouvertes aux visiteurs, toutes dans la liste blanche de 0229.
  HaveIBeenPwned toujours désactivé (M-3, interrupteur de Beau).
- Base de test : `finia_members_guard` alignée sur la production (empreinte
  identique). Il manque `profiles.is_test` dans la base de test : elle est en
  retard d'au moins une migration de la place de marché.

### Code et santé

- 373 tests sur 373, compilation sans erreur.
- **LCP « Poor » pour 24 % des visites** (Cloudflare, P75 3,9 s, surtout les
  fiches produit). Cause n°1 trouvée : 64 photos « AVIF » qui sont en réalité
  des PNG sans compression (jusqu'à 2,5 Mo la photo, 490 Ko la vignette, au
  lieu de 46 et 14 Ko). L'envoi est corrigé sur staging. La recompression des
  64 photos attend le mot de Beau.
- RPC les plus appelées : 15 à 42 ms en moyenne, pointes à 1,3 s
  (pg_stat_statements).
- 🔴 Depuis la panne des crédits Google (402, 03/10), les agents de Léo passent
  par OpenAI et leur coût n'est **pas compté** dans `ai_usage` (rien depuis le
  03/10 08h47). Le plafond du mois est aveugle. Correctif en attente du mot de
  Beau (fonction commune).
- 🟠 legion-visuel et legion-portrait n'appellent que des modèles d'image
  arrêtés par Google. Correctif en attente.

### Chiffres (7 derniers jours / 7 jours d'avant, comptes de test exclus)

| | Cette semaine | Semaine d'avant |
| --- | --- | --- |
| Inscriptions | 7 | 3 |
| Boutiques créées | 3 | 2 |
| Articles ajoutés | 11 | 12 |
| Fiches vues | 821 (≈ 206 hors pic) | 286 |
| Clics de contact | 0 | 7 |
| Ajouts au panier | 1 | 5 |
| Commandes | 0 | 2 |
| Appareils inscrits aux notifications | 2 | 4 |

Lecture : le **pic des fiches vues** (02/10 : 225, 03/10 : 390) a l'allure
d'un robot. C'est une vue par fiche sur presque toutes les fiches, avec un
identifiant nouveau à chaque vue. Sans ce pic, les vues baissent (≈ 206 contre
286), et les gestes d'achat aussi (0 contact, 1 panier, 0 commande). La seule
vraie commande ouverte (27/09, sans compte, au statut « priced ») n'a jamais
été signalée à l'acheteur : remontée à Beau.

## 12/10/2026 — Audit hebdomadaire, place de marché (Alpha)

Production en lecture seule ; les rôles sont rejoués dans des blocs annulés
(rien n'est écrit). Comptes de test exclus (`compte_reel`). Fenêtres glissantes
de 7 jours : les chiffres diffèrent donc un peu du rapport du lundi au dimanche
remis à Beau (`docs/rapports/2026-10-12-semaine.md`, côté place de marché).

### Sécurité

- **Visiteur non connecté** : voit 69 boutiques et 402 articles, et aucune
  boutique ni aucun article de test (0 et 0). Il voit 0 commande, 0 profil,
  0 message Léo, 0 espace Finia. Une insertion d'article est refusée.
- **Acheteuse réelle** (jeton simulé) : 0 commande d'autrui, 0 conversation
  d'autrui, 0 message d'autrui, 0 Léo, 0 Finia, 0 autre profil lisible.
- **Vendeuse réelle** (jeton simulé) : 0 commande ni conversation hors de sa
  boutique, 0 Léo, 0 Finia, 0 autre profil.
- RLS active sur 147 tables sur 147 (142 sur 142 il y a une semaine), 291
  règles. Conseiller de sécurité : mêmes lignes que le 05/10 (1 ERROR,
  `profiles_public` en SECURITY DEFINER ; 4 WARN dont HaveIBeenPwned toujours
  désactivé, interrupteur de Beau). 36 fonctions SECURITY DEFINER ouvertes aux
  visiteurs, même nombre que le 05/10 ; leur appartenance à la liste blanche de
  0229 n'a pas été revérifiée une à une cette semaine.
- Le statut de paiement d'une commande ne se modifie que depuis le serveur
  (`lock_order_financials` : service_role ou réglage interne). Vérifié en
  essayant une modification depuis le projet de test.

### Code et santé

- 587 tests sur 587, compilation sans erreur (staging, 12/10).
- **Pas remesuré cette semaine** : le LCP de Cloudflare (24 % « Poor » au
  05/10) — le connecteur Cloudflare n'est pas autorisé dans cette session ; et
  les RPC les plus lentes.
- 🔴 Les agents de Léo tournent sur des moteurs gratuits, moins bons :
  DeepSeek et Kimi ont coupé (solde épuisé, 12/10 à 02 h 01 UTC) et le Gemini
  payant l'était au dernier contrôle. Recharger est une dépense : décision de
  Beau.
- 🟠 Le faux site `finjaro.com` (autre entreprise) revient dans les sources de
  plusieurs agents : consigne « finjaro.net est notre seul site » à poser.
- 248 livrables d'agents attendent une relecture (9 marqués « fait »).

### Chiffres (7 derniers jours / 7 jours d'avant, comptes de test exclus)

| | Cette semaine | Semaine d'avant |
| --- | --- | --- |
| Inscriptions | 1 | 6 |
| Boutiques créées | 1 | 2 |
| Articles ajoutés | 2 | 5 |
| Fiches vues | 555 (367 fiches différentes) | 820 |
| Intentions de contact | 2 | 0 |
| Ajouts au panier | 0 | 1 |
| Commandes | 0 | 0 |
| Appareils inscrits aux notifications (web / mobile) | 0 / 1 | 0 / 1 |

Lecture : la place de marché a presque cessé de bouger (1 inscription, 0
panier, 0 commande). La dernière commande remonte au 27/09. Le pic de fiches
vues du 02-03/10 est sorti de la fenêtre. Ce qu'on fait pour inverser la
tendance est dans le rapport du lundi : prospection par e-mail (0 réponse
positive à ce jour), mise en ligne de finjaro.net attendue (rien depuis le
08/10 à 14 h 59).
