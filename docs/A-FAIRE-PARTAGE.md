# Ce qui reste à faire — tableau partagé entre les deux sessions

Beau (15/09): « j'aimerais que vous deux vous remplissiez tout ce qu'il y a à
faire, d'abord à part, ensuite dans le même ».

Deux sessions Claude travaillent sur l'environnement Finjaro:

- **Alpha** — la place de marché (`henribeaubayemi`), la base Supabase, la
  console d'équipe, les applications mobiles.
- **Claudinette (bêta)** — Finjaro Accounting
  (`Automatisation-des-candidatures`).

Chacune remplit **sa** section. La troisième est commune: on n'y écrit rien
sans le dire à l'autre, parce que ça touche les deux applications.

**Règle de tenue:** un point réglé passe en ✅ avec la date, il ne s'efface
pas. C'est ce qui permet à quelqu'un qui arrive de comprendre l'historique des
décisions.

---

## Partie commune — ne rien y toucher seul

Tout ce qui suit concerne les DEUX applications. Voir la section « Ce qui est
PARTAGÉ » du `CLAUDE.md` de chaque dépôt avant d'y toucher.

| Sujet | État | Qui |
| --- | --- | --- |
| Site URL Supabase = `https://finjaro.net` | ✅ ne bouge jamais (15/09) | — |
| Redirect URLs: les 6 adresses déclarées | ✅ 15/09 | Beau |
| Migrations additives uniquement | règle permanente | les deux |
| Fonctions edge = préproduction ET production d'un coup | règle permanente | les deux |
| `profiles.is_test` / `compte_reel()` dans tout chiffre affiché | règle permanente | les deux |
| Un seul compte utilisateur pour tout l'environnement | acquis | — |

**Tranché le 15/09 — UNE SEULE application sur les magasins**

Pas de `net.finjaro.accounting`. Accounting s'ouvre **dans l'application
Finjaro existante**, via le sélecteur à six points.

Ce n'est pas un compromis, c'est déjà l'état des lieux: `allowNavigation` de
`capacitor.config.json` contient `*.finjaro.net`, donc
`accounting.finjaro.net` s'affiche à l'intérieur de l'application **sans
aucun nouveau build**.

Les raisons, pour que personne ne rouvre le débat sans elles:

- Une deuxième fiche = une deuxième validation Apple ET Google. On sait ce que
  ça coûte: refus du 14/08, vidéo à filmer en une prise, compte de
  démonstration à préparer. Ce temps est celui de Beau, pas celui d'une
  session.
- Une application à zéro téléchargement et zéro avis, sur un magasin, a l'air
  abandonnée. C'est l'inverse de ce qu'on veut montrer.
- Accounting n'est pas un produit étranger: c'est la caisse et le stock de la
  vendeuse qui a **déjà** une boutique sur Finjaro. L'espace vendeur existe
  déjà dans l'application.
- Le sens du choix compte. Partir d'une application et en détacher une plus
  tard est facile; partir de deux et fusionner ne l'est pas — on ne retire pas
  proprement une fiche d'un magasin, et on a divisé ses téléchargements.

**Quand rouvrir la question:** le jour où Accounting aura ses propres
utilisateurs, des commerçants venus pour la comptabilité et indifférents à la
place de marché. À ce moment-là une fiche dédiée se justifie, se fait en une
journée, et le compte partagé fonctionne déjà.

**À décider ensemble, pas encore tranché:**

- Que se passe-t-il quand une vendeuse existe dans les deux outils: mêmes
  données de boutique, ou cloisonnées ?

---

## Alpha — place de marché, base, mobile

### Bloqué sur une action de Beau

- Déposer le `.aab` Android sur Play Console.
- Envoyer iOS 1.0.1 build 13 en vérification.
- Corriger les textes « camerounaise » dans les deux fiches magasins.
- Créer l'application Meta pour l'API WhatsApp Business.
- Supprimer ses 3 vidéos Beauty hairs (62 Mo, déjà invisibles du public).
- Ouvrir les accès d'Henri: Claude Code, GitHub en lecture, rôle Supabase en
  lecture seule (script prêt dans `docs/ACCES-ANALYSTE-LECTURE-SEULE.md`).

### En attente d'une décision de Beau

- **Bilan hebdo aux vendeuses** — envoi automatique DÉSACTIVÉ le 15/09 à sa
  demande (« demande-moi avant d'envoyer »). Deux formes proposées: n'écrire
  qu'aux boutiques ayant réellement quelque chose (4 sur 42 cette semaine), ou
  transformer le bilan en conseil utile envoyé à toutes. **Ne pas réactiver le
  cron 15 sans son accord.**
- Mobile Money MTN + Orange: pas commencé.
- Série vidéo « transformation vendeuse ».

### À faire, sans blocage

- **Le bilan hebdo ne filtre pas les comptes de test.** Le 14/09 il a annoncé
  « 1 conversation sans réponse » à Décoration évents et Crea Lab — les trois
  conversations en attente venaient toutes des comptes de Beau. À corriger
  avec `compte_reel()` quelle que soit la forme retenue.
- L'événement `comment` se déclenche à l'OUVERTURE du panneau, pas à la
  publication d'un commentaire. Les chiffres qui en découlent sont faux.
- Les tickets Finia (`contacter_finjaro`) n'arrivent que comme pastille dans
  l'admin, sans e-mail ni notification vers Beau.
- « Prix sur demande »: 204 articles sur 409, dont 185 chez 4 boutiques. Beau
  doit d'abord appeler ByFlora kids et MTGBA — **ne rien changer avant**.
- Guider les vendeuses sur la qualité des photos à l'envoi, et signaler celles
  qui portent le filigrane d'une autre marque (question juridique autant
  qu'esthétique).

### Réglé récemment

- ✅ 12/09 — Messages: une seule boîte (boutiques + personnes), Finia ne
  couvre plus le bouton d'envoi, pastille de non-lus.
- ✅ 12/09 — Compression des vidéos avant envoi (89 % de moins, MP4 garanti).
- ✅ 13/09 — Articles et boutiques de test invisibles du public
  (migrations 0125, 0126).
- ✅ 15/09 — Fil personnel: photo en plein écran et transfert d'un message.
- ✅ 15/09 — Les fonctions edge ne confondent plus « secret illisible » et
  « appelant non autorisé » (un passage sur deux échouait en silence).

---

## Claudinette — Finjaro Accounting

### Historique

- ✅ 15/09 — Nouveau domaine `https://accounting.finjaro.net` en service.
- ✅ 15/09 — `CLAUDE.md` créé à la racine du dépôt (il n'y en avait aucun).
- ⚠️ 15/09 — Proposition de changer le Site URL Supabase **refusée**: elle
  aurait cassé la confirmation d'inscription sur finjaro.net. La bonne
  correction était d'ajouter l'adresse dans Redirect URLs. Angle mort, pas
  erreur de compétence — d'où le `CLAUDE.md`. Le conseil faux avait été écrit
  dans `docs/A-VERIFIER.md`: corrigé le jour même, avec la raison, pour que
  personne ne l'applique plus tard.
- ❌ 15/09 — **Pas d'application Android ni iPhone pour Accounting.** Décision
  de Beau, raisons dans la partie commune. Accounting s'ouvre dans
  l'application Finjaro existante. Ce n'est pas à refaire, c'est déjà en
  service.

### Accounting comme écran de l'application Finjaro

Cinq points ouverts par Beau le 15/09. Accounting n'est plus seulement un site
qu'on ouvre au navigateur: c'est un écran DANS une application installée.

- ✅ 15/09 — **Bord-à-bord Android 15.** L'en-tête, le tiroir de navigation et
  le bouton flottant de l'assistant réservent la place des barres système
  (`env(safe-area-inset-*)`, classes `.safe-top`, `.safe-side`, `.safe-bottom`,
  `.safe-fab` dans `src/index.css`). Vérifié avec une encoche simulée de
  48 px: le contenu de l'en-tête descend, rien ne passe sous la caméra. Ces
  règles valent 0 dans un navigateur d'ordinateur, donc sans effet ailleurs.
- ✅ 15/09 — **Bouton retour d'Android.** Il ferme ce qui est ouvert par-dessus
  l'écran au lieu de quitter Accounting: fenêtres de saisie, menu du
  téléphone, recherche globale. Crochet `useBackToClose`
  (`src/lib/backclose.ts`), branché sur `Modal` et sur les trois panneaux de
  `Layout`. Fermer à la croix retire l'étape d'historique, pour qu'un retour
  ne soit pas avalé dans le vide. Vérifié sur un téléphone simulé.
- ✅ 15/09 — **Retour à la place de marché.** Le sélecteur à six points
  utilisait `target="_blank"`, ce qui éjecte vers le navigateur du téléphone
  hors de l'application. Il navigue maintenant dans la même fenêtre dès que
  l'application occupe sa propre fenêtre (application Finjaro, ou Accounting
  installée depuis le navigateur), et garde le nouvel onglet dans un
  navigateur ordinaire. Détection dans `src/lib/shell.ts`.
- ⏳ **Session partagée entre Finjaro et Accounting — décision de Beau
  attendue.** Ça ne marche pas aujourd'hui, et ce n'est pas un réglage oublié:
  Supabase range la session dans le `localStorage`, qui est **propre à une
  adresse**. `finjaro.net` et `accounting.finjaro.net` étant deux adresses
  différentes, la session ne suit pas. Une vendeuse déjà connectée à Finjaro
  doit se reconnecter en arrivant sur Accounting, alors que c'est le même
  compte. Correction possible: ranger la session dans un **cookie de domaine
  `.finjaro.net`**, lisible par les deux. **Touche les DEUX applications** —
  la place de marché doit adopter le même rangement, sinon chacune garde la
  sienne. À ne pas faire sans l'accord de Beau et sans qu'Alpha fasse le même
  changement en même temps. À peser: un cookie partagé élargit la surface
  exposée à tous les sous-domaines de finjaro.net.
- ⏳ **Connexion Google depuis la fenêtre intégrée — à vérifier sur un vrai
  téléphone.** Côté Accounting tout est en place: flux PKCE (le jeton passe
  par `?code=`, pas par l'ancre du routeur), `redirectTo` construit sur
  l'adresse courante, et `https://accounting.finjaro.net/**` déclaré dans les
  Redirect URLs. Côté application, `allowNavigation` contient `*.finjaro.net`
  et `accounts.google.com`, et `overrideUserAgent` évite le refus
  `disallowed_useragent`: ces trois lignes sont dans le dépôt de la place de
  marché, je ne peux pas les vérifier d'ici. **Si ça casse, regarder ces trois
  lignes en premier** (§2 de `docs/BUILDS-MOBILES-FINJARO.md`). Le piège
  précis: si la page Google part dans Chrome, la session naît dans Chrome et
  l'application reste déconnectée — c'est le symptôme du 08/08.

### Signalé à Beau, en attente de sa décision

- ⏳ **L'inscription depuis Accounting envoie un lien de confirmation qui mène
  à finjaro.net.** `signUp()` d'Accounting ne passe aucun `emailRedirectTo`
  (`src/lib/collab.tsx`), exactement comme celui de la place de marché: le
  lien est donc construit sur le Site URL, qui reste `https://finjaro.net` et
  doit le rester. Quelqu'un qui crée son compte dans Accounting confirme donc
  son adresse et atterrit sur la place de marché, pas dans sa comptabilité.
  Correction proposée: passer `emailRedirectTo: 'https://accounting.finjaro.net/'`
  **dans le seul appel d'Accounting**. L'adresse est déjà déclarée dans les
  Redirect URLs. **Quelle autre application est touchée: aucune** — c'est un
  paramètre par appel, il ne modifie aucun réglage commun, et le `signUp()` de
  la place de marché n'est pas touché. Signalé le 15/09, pas appliqué:
  l'authentification ne se change pas sans l'accord de Beau.

### Sécurité — audit du 15/09, rapport complet dans `docs/SECURITE-2026-09-15.md`

Chaque manœuvre offensive a été jouée dans une transaction **annulée**, et
l'annulation vérifiée après coup (0 membre, 4 espaces, 12 événements avant
comme après). Rien n'a été corrigé en production.

- ✅ **15/09 — CORRIGÉ : un utilisateur pouvait entrer dans l'espace comptable d'un autre.**
  `finia_members_self_accept` ne contrôle que l'adresse e-mail : ni
  `workspace_id` ni `role`. Une utilisatrice réelle simulée est passée de
  « 0 événement lisible, 1 espace visible » à « 10 événements lisibles,
  2 espaces visibles, rôle owner » en deux instructions SQL. Aucun déclencheur
  sur la table, et `authenticated` peut modifier toutes les colonnes.
  Corrigé le jour même avec l'accord de Beau : migration additive
  `20260915131114_finia_members_guard_invitation`, un déclencheur qui voit OLD
  et NEW là où une politique RLS ne le peut pas. Sans effet sur la place de
  marché, `finia_members` est une table d'Accounting seule. Rejeu de l'attaque :
  refusée. Parcours légitime complet (inviter, changer un rôle, accepter) :
  passe. Base inchangée après essais. **L'écran Équipe peut être ouvert.**
- 🔴 **Sans compte, tout est perdu et rien n'est récupérable.** Le mode local
  que l'application propose activement ne range les chiffres que dans
  `localStorage` : 552 578 octets mesurés, 263 ventes, 576 écritures. Vider le
  cache ou changer de téléphone efface tout, définitivement. Avec un compte, en
  revanche, rien n'est perdu : `finia_events` plus l'instantané reconstruisent
  tout. Proposé : avertir à l'écran, offrir un export, proposer le compte au-delà
  d'un seuil. **En attente de l'accord de Beau.**
- 🟠 **Le journal est inviolable, l'instantané ne l'est pas.** `finia_events`
  n'a ni règle `UPDATE` ni règle `DELETE` : un événement écrit ne peut être ni
  modifié ni effacé, par personne. Mais `loadWorkspace` part de
  `finia_workspaces.data` et n'ajoute que les événements postérieurs à
  `snapshot_seq` — deux colonnes que le propriétaire peut réécrire. Les preuves
  survivent en base ; l'écran, lui, montrerait les chiffres réécrits. À écrire
  dans la documentation du fiscaliste : **le registre opposable est
  `finia_events`, pas l'écran.**
- 🟠 **Un téléphone perdu donne tout.** Cache en clair (noms et téléphones des
  clients, salaires), plus `finia.auth` qui contient le jeton de
  rafraîchissement. Proposé : verrou d'ouverture, et purge du cache à la
  déconnexion.
- ✅ **La clé du site est bien la clé publiable.** Aucune trace de
  `service_role` dans aucun commit, aucun JWT en dur dans l'historique complet,
  aucun fichier de secret jamais suivi par git.
- ✅ **Un membre retiré perd l'accès immédiatement**, même session ouverte :
  `finia_is_member` exige une ligne `status = 'active'`. Réserve à connaître :
  le cache déjà téléchargé reste sur son appareil.
- ✅ **On ne peut pas s'inviter chez autrui** : l'insertion exige d'être
  propriétaire, et on n'accepte qu'une ligne portant sa propre adresse.
- ℹ️ **Deux appareils hors réseau convergent** vers le même état (ordre par
  `seq` du serveur, moteur déterministe, identifiant en clé primaire). Mais
  aucun conflit métier n'est détecté : le stock peut passer sous zéro. L'écran
  Audit le signale après coup.

### Reste à faire, sans blocage

- Logo: les icônes actuelles sont un dessin provisoire fait faute de mieux.
  Beau prépare le vrai. Un SVG, ou un PNG large à fond transparent, et je
  régénère toutes les tailles.
- Passage de mise en page sur téléphone, à faire APRÈS que Beau ait testé
  lui-même: corriger ce qu'il voit, pas ce que je devine.
- Questions ouvertes pour le fiscaliste Gautier Fossong: taux du précompte sur
  achat selon les régimes, sens de « plan comptable précédé des 0000 »,
  traitement du précompte côté vendeur (grossiste qui le retient sur ses
  ventes).
