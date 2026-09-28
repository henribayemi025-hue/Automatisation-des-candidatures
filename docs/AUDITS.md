# Audits hebdomadaires — Finjaro Accounting

Un audit chaque lundi (charte `docs/CHARTE-EQUIPE.md`) : sécurité, code,
comptabilité. Faits seulement — ce qui a été vérifié, ce qui a cassé, ce qui
est corrigé ou reste à décider.

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

### Ce qui reste à décider par Beau

- Le projet de test étant en pause, je ne peux toujours pas rejouer les
  scénarios de rôles (caissier, intrus, membre retiré) sans que Beau libère
  un créneau de projet actif (mettre Athlo en pause, ou passer sur un plan
  payant) — décision qui n'est pas la mienne.
- Les deux défauts « payé par » sur les achats et « prestation qui
  décrémente le stock » sont documentés depuis la passe 1 (avant cette
  semaine) et méritent une vraie décision de priorité, pas une correction
  à la volée dans un audit.
