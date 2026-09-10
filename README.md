# Finia Accounting

Gestion commerciale et comptabilité en partie double pour les petites entreprises.
Fonctionne entièrement dans le navigateur (les données restent en local).

## Modules

**Gestion** — tableau de bord, point de vente, sessions de caisse (fond, écart, clôture),
produits (PMP, seuils de réappro, export CSV), achats & réceptions fournisseurs,
stock & mouvements tracés, ventes, devis convertibles, clients & fournisseurs.

**Finance** — créances clients et dettes fournisseurs avec règlements partiels,
dépenses par poste de charge, analyse (marges par produit, tendances, catégories),
rapports imprimables en PDF.

**Comptabilité (type Sage)** — plan comptable SYSCOHADA / PCG / générique,
journal des écritures en partie double (saisie manuelle + génération automatique
depuis chaque opération), extourne, grand livre, balance générale,
bilan & compte de résultat, livre de caisse.

**Contrôle** — module d'audit (contrôles d'équilibre, rapprochements
métier/comptabilité, score de conformité), piste d'audit horodatée de toutes
les opérations.

**Finia IA** — assistant qui répond en langage naturel sur les chiffres réels
(CA, marges, créances, stock, anomalies), calculé localement.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production dans dist/
```

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Recharts.
Palette « Terre & Or » (crème, terracotta, laiton).
Montants stockés en unités mineures entières (pas de flottants).
Multi-devises (XAF, EUR, USD, …) sans devise imposée par défaut.
