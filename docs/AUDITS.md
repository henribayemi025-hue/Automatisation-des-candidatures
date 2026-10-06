# Audits hebdomadaires — Finjaro Accounting

Un audit chaque lundi (charte `docs/CHARTE-EQUIPE.md`) : sécurité, code,
comptabilité. Faits seulement — ce qui a été vérifié, ce qui a cassé, ce qui
est corrigé ou reste à décider.

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
