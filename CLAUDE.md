# Finjaro Accounting — à lire avant de toucher au code

Ce fichier existe parce que cette application ne vit pas seule.

Finjaro Accounting est la caisse, le stock, les factures et la comptabilité
d'une boutique. Elle est la **deuxième** application de l'environnement
Finjaro — et elle partage l'essentiel avec la première.

Beau est le fondateur. Il est francophone, **il ne code pas**, il a un emploi
à côté, et il dicte souvent ses messages à la voix: lire l'intention, pas la
lettre. Lui annoncer qu'une chose est faite alors qu'elle ne l'est pas lui
coûte du temps qu'il n'a pas.

## Finjaro est une place de marché MONDIALE

Le Cameroun est une **stratégie de démarrage**, pas l'identité du produit.
Aucun texte visible ne doit enfermer Finjaro dans un pays, et aucune devise
« par défaut » ne doit supposer un pays. La règle vaut pour toutes les
applications de l'environnement, celle-ci comprise.

## Mise en ligne

- Travail et production sur **`main`**.
- Cloudflare déploie tout seul à chaque poussée, via sa propre intégration
  Git. **Une CI verte ne prouve PAS qu'une version est en ligne** — pour
  savoir ce qui tourne, on ouvre le site et on regarde.
- **Ne jamais ouvrir de pull request sans que Beau l'ait demandé.**

## Ce qui est PARTAGÉ entre les applications Finjaro — lire avant de toucher

Finjaro n'est plus une application mais un **environnement**: plusieurs
applications, **un seul projet Supabase**, **un seul `auth.users`**.

| Application | Adresse | Dépôt |
| --- | --- | --- |
| Finjaro (place de marché) | `https://finjaro.net` | `henribayemi025-hue/henribeaubayemi` |
| Finjaro Accounting | `https://accounting.finjaro.net` | `henribayemi025-hue/Automatisation-des-candidatures` |
| Console Finjaro (équipe) | `https://finjaro-admin.finjaro.workers.dev` | place de marché |

Projet Supabase commun: **`bokwivwizghdlaedczbw`** (production, eu-west-3).
Projet de test: `qiyvoaljqmbfldephobp`.

Chaque application est correcte chez elle et peut casser l'autre **sans le
savoir**, parce qu'on ne voit qu'un dépôt à la fois. D'où les règles
ci-dessous. Elles ne sont pas des préférences: ce sont des pannes déjà
évitées de justesse.

### Le Site URL de Supabase ne se change JAMAIS

`Authentication → URL Configuration → Site URL` reste
**`https://finjaro.net`**, quoi qu'on développe.

Ce réglage est **global au projet**, pas propre à une application. Il sert de
base aux liens des e-mails d'authentification. Or `signUp()` de la place de
marché ne passe **aucun `emailRedirectTo`** (voir `src/hooks/useAuth.jsx`):
le lien de confirmation de chaque nouvelle inscription est donc construit à
partir du Site URL.

Le mettre sur une autre application ferait atterrir **toute personne qui
s'inscrit sur finjaro.net** dans un outil qui n'est pas le sien, sans pouvoir
valider son compte. Les inscriptions sont aujourd'hui la seule chose qui
fonctionne vraiment sur Finjaro — c'est exactement ce qu'il ne faut pas
casser.

Proposé le 15/09 par une session travaillant sur Accounting, refusé pour
cette raison. Sans angle mort: depuis ce dépôt-là, la proposition paraissait
logique.

### Pour qu'une application revienne chez elle après connexion

On **AJOUTE** son adresse dans `Redirect URLs`, on ne déplace rien:

```
https://finjaro.net/**
https://accounting.finjaro.net/**
https://finjaro-admin.finjaro.workers.dev/**
https://staging-finjaro.finjaro.workers.dev/**
```

Le `/**` est nécessaire: on revient sur la page exacte, pas sur la racine.
Et le code appelant doit passer `redirectTo`. Supabase **ignore en silence**
une adresse absente de cette liste et retombe sur le Site URL — c'est ce qui
faisait rebondir Accounting vers finjaro.net, sans le moindre message
d'erreur.

Une entrée ne se retire que lorsque plus aucune application ne sert à cette
adresse.

### Les autres réglages communs

- **Migrations additives**, toujours. On ajoute; on ne supprime pas une
  colonne, on ne renomme pas, on ne supprime pas un compte. Le projet est
  aussi partagé avec deux ou trois applications tierces sur le même
  `auth.users`.
- **Les fonctions edge sont communes** à la préproduction et à la production:
  en déployer une touche les deux d'un coup.
- **Les tables ne se mélangent pas.** Celles d'Accounting ne sont pas celles
  de la place de marché, et inversement. On ne lit pas celles de l'autre sans
  que Beau l'ait décidé.
- **`profiles.is_test` et `compte_reel()`** valent pour tout l'environnement:
  aucun chiffre montré à quelqu'un ne doit inclure les comptes de test.

### En cas de doute

Un changement qui touche l'authentification, le Site URL, les redirections,
`auth.users`, une fonction edge ou une migration **concerne les deux
applications**. On le dit à Beau avant, en nommant l'autre application qui
peut être affectée. Il n'a pas à arbitrer entre deux avis qui s'ignorent.

## Ne pas interrompre Beau pour avancer

Dit par Beau le 21/09, deux fois: « ne me demande plus de permission, fais »,
puis « je ne veux plus que tu me demandes les infos avant d'avancer ».

Ce que ça veut dire concrètement:

- **Aucune question préalable pour choisir entre deux façons de faire.** On
  tranche, on fait, et on dit en une ligne ce qu'on a décidé et pourquoi. Si
  le choix était serré, on le signale après coup — pas avant.
- **Aucune demande d'information qu'on peut aller chercher soi-même**: dans le
  code, dans la base en lecture, dans le navigateur, dans les mesures. Beau
  n'est pas la documentation du projet.
- **Aucune demande de confirmation** pour ce qui est réversible: un fichier,
  un commit, une poussée sur `main`, une vérification en lecture.

Ce qui continue de passer par lui, sans exception — ce n'est pas de la
politesse, c'est que la base est partagée et qu'une erreur touche les autres
applications:

- une migration, une fonction edge, l'authentification, le Site URL, les
  redirections;
- toute donnée existante réécrite ou effacée;
- une pull request (jamais sans qu'il l'ait demandée).

Le fichier `.claude/settings.json` traduit exactement cette frontière: ce qui
est sans risque est autorisé d'avance, le reste demande encore.

**Si l'information manque vraiment**, on fait l'hypothèse la plus probable, on
livre, et on écrit l'hypothèse en clair dans la réponse. Se tromper et le dire
lui coûte moins cher qu'attendre.

## Trois lignes, pas trois écrans

Dit par Beau le 22/09 : « je suis fatigué de vos longues réponses, soyez brefs
dans vos réponses, ça me fatigue de lire tout ça ».

Il ne code pas, il a un travail à côté, il lit sur un téléphone. Une réponse
de deux écrans lui coûte du temps qu'il n'a pas — et il finit par ne plus lire,
ce qui est pire que de ne rien écrire.

La règle :

- **Ce qu'on écrit à Beau** : la décision ou le résultat d'abord, trois lignes.
  Pas de raisonnement déroulé, pas de justification, pas de liste de ce qui a
  été vérifié. S'il veut le détail, il demande.
- **Ce qui a besoin d'être long** va dans le dépôt : le message de commit, la
  note de veille, le compte rendu de réunion. Il y est s'il le cherche.
- **Entre Claudinette et Alpha aussi.** Nos échanges du 22/09 faisaient deux
  écrans chacun. Ce qui compte tient en un quart.
- **Les chiffres restent vérifiés.** Être bref ne veut pas dire affirmer sans
  avoir regardé ; ça veut dire ne pas raconter comment on a regardé.
