# Finjaro Accounting

Gestion commerciale et comptabilité en partie double pour les boutiques et petites
entreprises, dans l'environnement d'applications Finjaro. Conçue pour être utilisable
par un mécanicien ou une commerçante, et complète pour un comptable.

En ligne : https://automatisation-des-candidatures.finjaro.workers.dev

## Ce que fait l'application

**Démarrage guidé** — métier, entreprise, devise (jamais imposée), objectifs ; l'écran
s'adapte : mode **Simple** (vocabulaire courant, comptabilité en coulisses) ou mode
**Expert** (journal, grand livre, balance, bilan, plan comptable, audit).

**Au quotidien** — vendre (point de vente), caisse (fond, clôture, écart), produits
(avec saisie type tableur), stock et mouvements tracés, achats et réceptions, ventes,
devis, clients et fournisseurs, dettes et crédits, dépenses, résultats, documents à
imprimer, livre de caisse.

**Comptabilité** — chaque opération génère automatiquement son écriture en partie
double (SYSCOHADA, PCG ou générique). Journal, grand livre, balance, bilan et compte
de résultat, extourne, module d'audit (contrôles automatiques et rapprochements).

**À plusieurs, en direct** — comptes utilisateurs (email ou Google, le même compte que
sur Finjaro), espace de travail partagé, invitation par email avec rôles (gérant,
caissier, comptable), personnes connectées visibles en haut, historique de qui a fait
quoi. Chaque action est un événement ajouté au journal `finia_events` : rien n'est
jamais écrasé, deux appareils convergent vers le même état, le travail hors ligne est
mis en file puis envoyé.

**Assistant partout** — bouton flottant sur chaque écran : explique à quoi sert
l'écran, quand l'utiliser, un exemple concret, et répond aux questions avec les vrais
chiffres (« qui me doit de l'argent ? », « quelle est ma marge ? »).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production dans dist/
```

## Base de données

Projet Supabase partagé de l'environnement Finjaro. Cette application n'utilise que
les objets préfixés `finia_` (`finia_workspaces`, `finia_members`, `finia_events`),
toujours en ajout, jamais en modification des tables de la marketplace.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Supabase (auth, Postgres,
temps réel). Palette « Terre & Or » de Finjaro. Montants en unités mineures entières.
