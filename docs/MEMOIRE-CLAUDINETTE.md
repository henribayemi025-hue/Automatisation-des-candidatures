# Mémoire de la session Accounting

Écrit pour qu'une nouvelle session reprenne le travail sans que Beau réexplique
tout. La conversation a déjà été coupée pour longueur deux fois le 18/09.
Idée d'Alpha, qui a fait le même document de son côté.

**À lire en premier** : le `CLAUDE.md` du dépôt de la place de marché
(`henribeaubayemi`) contient les règles qui ne se discutent pas. Elles
s'appliquent ici aussi.

---

## Qui est qui

- **Beau** (Henri Bayemi) : fondateur, francophone, **il ne code pas**, il a un
  emploi à côté. Il dicte souvent à la voix, donc le texte arrive déformé : lire
  l'intention, pas la lettre. Il veut des réponses **courtes et bien
  présentées** — « quand c'est long je lis pas tout ». Lui annoncer qu'une chose
  est faite alors qu'elle ne l'est pas lui coûte du temps qu'il n'a pas.
- **Alpha** : la session Claude qui tient la place de marché (dépôt
  `henribeaubayemi`). On se parle directement, plusieurs fois par jour.
- **Moi, Claudinette** : cette session, Finjaro Accounting (dépôt
  `automatisation-des-candidatures`, branche `main`).

## Les deux applications

| | Place de marché | Accounting |
|---|---|---|
| Adresse | finjaro.net | accounting.finjaro.net |
| Dépôt | `henribeaubayemi` | `automatisation-des-candidatures` |
| Branche en ligne | `claude/finjaro-marketplace-build-xsripr` | `main` |

Cloudflare déploie tout seul à chaque poussée. **Une CI verte ne prouve pas
qu'une version est en ligne.** Les applications Android et iOS chargent le site
(`server.url` dans `capacitor.config.json`), donc une mise en ligne web atteint
les téléphones **sans repasser par les magasins**.

## La base, partagée

Projet Supabase **`bokwivwizghdlaedczbw`**, commun aux deux applications et à
deux ou trois applications tierces, avec le même `auth.users`. Projet d'essai :
**`qiyvoaljqmbfldephobp`**.

- Migrations **additives seulement**. Pas de suppression, pas de renommage.
- Les fonctions edge sont **communes à staging et à la production**.
- Mes tables : `finia_workspaces`, `finia_members`, `finia_events` (journal en
  ajout seul), `finia_fx_rates`, `finia_liaison_log`. Les cinq ont la sécurité
  au niveau ligne active, vérifié le 18/09.

## Comment le moteur marche

L'état est reconstruit en **rejouant un journal d'événements** (`applyEvent`
dans `src/lib/reducer.ts`). Chaque geste métier est un événement JSON,
**définitif** : on ne peut ni l'effacer ni le corriger, seulement en ajouter un
autre. Conséquence pratique : **tout ce qui écrit un événement doit être un
geste voulu**, jamais une frappe au clavier.

`post()` refuse une écriture déséquilibrée, et refuse une écriture datée dans un
exercice clôturé.

## La règle de mise en ligne, écrite avec Alpha

1. Correction qui ne touche qu'une application et ne change aucune donnée
   existante → on pousse, et on le note dans `docs/A-FAIRE-PARTAGE.md` le jour
   même.
2. Base partagée, auth, Site URL, redirections, fonctions edge, ou l'autre
   application → **Beau, toujours**.
3. Donnée existante réécrite ou supprimée → **Beau, toujours**.

Le 18/09 Beau a dit : « ne me demande plus de permission, fais ». Cela allège le
cas 1, **pas les cas 2 et 3**.

## Ce qu'on a appris à la dure

- **« Ça compile » n'est pas un test.** Alpha a annoncé une mesure posée qui
  enregistrait zéro ligne pendant deux jours.
- **« Ça passe les contrôles » n'est pas un test non plus.** Mes vingt-et-un
  scripts passaient sur une application qui affichait le mauvais chiffre, et sur
  une redirection annulée 900 ms plus tard par la visite guidée.
- **Donc : piloter l'application avant de pousser.** `npx vite preview --port
  4173` puis Chromium sur `localhost` — pas de proxy, donc pas le problème de
  certificat qui bloque les adresses publiques. Viewport 390 × 844, locale
  `fr-FR`, `executablePath: '/opt/pw-browsers/chromium'`.
- **Aucun chiffre sans provenance.** Alpha et moi nous reprenons mutuellement.
  J'ai publié un chiffre de contacts qui ne mesurait rien ; elle a écrit
  « mesuré » sur des données écrites à la main. Écrire « non mesuré » coûte
  toujours moins cher.

## Les chiffres réels au 18/09

Comptés, pas estimés.

- **Accounting** : 7 espaces, **aucune vente jamais enregistrée**, personne
  revenu un deuxième jour. Deux espaces n'ont jamais fini l'installation.
- **Place de marché** : 299 appareils ont ouvert le site en 30 jours, 92 ont
  ouvert un article, 1 a mis au panier. Côté vendeuses : 82 inscriptions,
  57 boutiques, 38 avec un article, 2 avec une commande.
- **Boutiques par pays** : Cameroun 50, France 7, Canada 2, Togo 1, Côte
  d'Ivoire 1, Allemagne 1.

**La cible**, formulée par Alpha et retenue : pas « la première vente » (qu'une
vente d'exemple suffirait à produire) mais **une première journée tenue** —
caisse ouverte, vraie vente, caisse fermée avec l'écart.

## Ce qui est en ligne depuis le 18/09

- Un seul événement par champ de réglage (avant : un par frappe).
- Vente rapide : encaisser un montant sans créer de fiche article.
- Après l'installation, on ouvre la caisse et non le tableau de bord.
- La visite guidée ne ramène plus de force à l'accueil.
- Abonnements payés d'avance : la recette suit les mois servis (compte 477),
  y compris sur les chiffres de l'accueil.
- Un plat vendu sort ses ingrédients, pas le plat.

## Ce qui reste, par ordre

1. **Rendez-vous** pour les salons : le geste qu'une coiffeuse fait dix fois par
   jour, et qui n'existe pas. Elle vit donc dans son carnet.
2. **Lots et dates de péremption** pour les pharmacies : éliminatoire pour ce
   métier.
3. **Ordre de réparation** pour les garages : à vérifier en le faisant avant
   d'affirmer qu'il manque.
4. Décisions en attente de Beau dans `docs/IDEES.md` : la mention disant que nos
   reçus ne sont pas des factures conformes, l'agrément gabonais, et
   l'enregistrement de la version du système sur les appareils.

## Les documents à lire

| Fichier | Ce qu'il contient |
|---|---|
| `docs/A-FAIRE-PARTAGE.md` | le tableau commun avec Alpha |
| `docs/REUNIONS.md` | les comptes rendus quotidiens |
| `docs/VEILLE.md` | concurrence, règles, technologie |
| `docs/IDEES.md` | ce qui attend une décision de Beau |
| `docs/CHARTE-EQUIPE.md` | les rôles et la règle de mise en ligne |
| `docs/SIMULATION-DECISIONS.md` | les 42 lignes de la simulation des 21 métiers |
| `scripts/*-check.ts` | 22 scripts de contrôle, à lancer avant de pousser |

## Comment on se parle, Alpha et moi

`create_trigger` avec `persistent_session_id` et sans cron, puis `fire_trigger`.
`SendMessage` n'atteint pas l'autre session. Une réunion quotidienne et une
veille quotidienne se déclenchent toutes seules, même quand Beau n'est pas là.
