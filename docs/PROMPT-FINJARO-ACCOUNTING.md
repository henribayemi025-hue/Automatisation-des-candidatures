# Prompt — Finjaro Accounting

Tu travailles sur **Finjaro Accounting**, une application de gestion et de comptabilité pour petites entreprises, construite par Beau (Henri Bayemi), fondateur de Finjaro. Voici tout ce qu'il faut savoir avant de toucher au code ou d'en parler.

## 1. Qui est Beau, et comment travailler avec lui

- Fondateur, francophone, **il ne code pas**, il a un emploi à côté. Il dicte souvent ses messages à la voix : le texte arrive déformé, lire l'intention, pas la lettre.
- Il veut des réponses **courtes**. Pas de longs rapports, pas de jargon.
- Lui dire qu'une chose est faite alors qu'elle ne l'est pas lui coûte du temps qu'il n'a pas. Vérifier avant d'annoncer.
- Quand il écrit « rappel », relire docs/A-VERIFIER.md et lui redonner ce qu'il doit tester.
- Ne jamais ouvrir de pull request sans qu'il l'ait demandé.

## 2. Ce qu'est le produit

Finjaro Accounting permet à quelqu'un qui tient une boutique, un restaurant, un salon, un garage, une pharmacie, un commerce d'import-export ou une activité de services de **tenir sa caisse, son stock, son personnel et sa comptabilité sans être comptable**. Une seule action (vendre, acheter, payer) met à jour la caisse, le stock et les écritures en partie double.

Ce n'est pas un logiciel « pour comptables » : le comptable est un lecteur (journal, balance, bilan, FEC), l'utilisateur est le commerçant.

Ambition : une place de marché et des outils **mondiaux**. Le Cameroun est le marché de démarrage, pas l'identité du produit.

## 3. Règles absolues

- **Aucun texte visible n'enferme le produit dans un pays.** Pas de « le marché camerounais », pas de « partout au pays ».
- **Aucune devise par défaut qui suppose un pays.** La devise vient du pays choisi par l'utilisateur ; jamais de retour sur FCFA pour un pays inconnu.
- **Pas de mention publique de « diaspora ».**
- **Aucun chiffre inventé ou exagéré** (nombre de clients, de ventes, de téléchargements). Pas mesuré, pas écrit. Idem pour les taux fiscaux : ne pas pré-remplir un taux qu'on n'est pas certain de connaître ; renvoyer au fiscaliste.
- **Aucune photo d'article prise sur le web.**
- Style visuel : crème, terracotta, laiton, grands titres (« vintage »). Ne pas le raboter. Quand Beau parle de design, il parle de détails (icônes, couleurs, libellés), pas d'une refonte.
- Une capture à 390 px ne suffit pas à valider un visuel : vérifier aussi en large.

## 4. Où est le code, où ça tourne

- Dépôt : `henribayemi025-hue/automatisation-des-candidatures`, branche **`main`** (le nom du dépôt est historique, ne pas s'en étonner).
- **Cloudflare déploie tout seul** à chaque poussée sur `main` : https://accounting.finjaro.net. La CI GitHub ne fait que compiler ; une CI verte ne prouve pas qu'une version est en ligne.
- **Ne pas toucher** au dépôt de la place de marché (`henribeaubayemi`, finjaro.net, branches `staging` et `claude/finjaro-marketplace-build-xsripr`). Beau l'a dit explicitement : « tu t'occupes juste de Finjaro Accounting ».
- Supabase : projet **partagé** `bokwivwizghdlaedczbw` avec d'autres applications sur le même `auth.users`. Migrations **additives** seulement, objets préfixés `finia_*`, jamais de suppression de colonne ni de compte. Les fonctions edge sont communes à staging et production.

## 5. Pile technique

- React 18 + TypeScript + Vite + Tailwind (jetons CSS en variables, mode sombre via `.dark`), HashRouter.
- **Application installable et hors réseau** : `public/manifest.webmanifest`, icônes dans `public/icons/`, service worker produit par `scripts/build-sw.mjs` après `vite build` (il connaît les noms de fichiers empreintés, et son contenu change à chaque version, ce qui déclenche la proposition de mise à jour). État exposé par `src/lib/offline.tsx` (`online`, `updateReady`, `canInstall`, `isInstalled`), bandeaux dans `src/components/OfflineBar.tsx`. Rien ne s'enregistre en développement.
- Tests navigateur avec Playwright (`/opt/pw-browsers/chromium`, `locale: 'fr-FR'`). Le bac à sable n'atteint ni Supabase, ni Google, ni Gemini : tester en mode local / démonstration.
- Scripts de vérification : `npx vite-node scripts/<nom>.ts` — demo-check (args : date, pays), tax-check, party-check, closing-check, fec-check, payroll-check, import-check, cash-check, regime-check, identity-check, oauth-check, service-check. **Tous doivent être verts avant de pousser.** `npx tsc --noEmit -p .` aussi.
- Auth Supabase en flux PKCE (obligatoire avec HashRouter). Connexion par téléphone = e-mail synthétique `chiffres@tel.finjaro.net`. Connexion Google : Beau doit ajouter l'URL de redirection dans Supabase, sinon ça rebondit.

## 6. Architecture des données

- **Event sourcing** : `applyEvent(db, ev)` dans `src/lib/reducer.ts` est pur et déterministe (identifiants, numéros, dates viennent de l'événement). `store.tsx` pré-génère les identifiants et dispatche ; `collab.tsx` synchronise via Supabase (`finia_events`).
- `post()` refuse toute écriture déséquilibrée. Montants en unités mineures (centimes, francs).
- Plan comptable : clés abstraites (`CASH`, `SALES`, `VAT_COLLECTED`, `TAX_PREPAID`, `EQUIP_TOOLS`, `DEP_TOOLS`…) traduites en numéros par référentiel dans `src/lib/chart.ts` : SYSCOHADA, PCG français, GENERIC. Les anciens instantanés sont complétés au chargement (`mergeAccounts`).
- `ledger.ts` : `trialBalance` (3 colonnes), `trialBalance6` (ouverture / mouvements / clôture en débit et crédit), `incomeStatement` (exclut le journal de clôture `CL`), `balanceSheet` (comptes soustractifs via `sheetValue`), `runAuditChecks`, `balanceOf`.
- i18n : `t('texte français', vars)` ; dictionnaire anglais `src/lib/lang/en.ts` (une clé dupliquée casse la compilation). `LangProvider` monté dans `main.tsx`.
- Profils métier `src/lib/sector.ts` : mots (article / prestation / plat / marchandise), suivi de stock ou non (`tracksStock`), exemples, dépenses courantes. Une prestation ne touche ni au stock ni au coût des marchandises.
- Démonstration `src/lib/demo.ts` : trois mois d'activité, jeu d'articles **par métier**, apport initial daté avant toute dépense sur caisse, mobile et banque. Entrée par `/demo/:pays/:metier`.

## 7. Les écrans (32)

Accueil (six chiffres comparés à la période d'avant, puis onglets courbe / meilleures ventes / à traiter) · Vendre (point de vente : scan, panier, client passager, remise, paiement, crédit, devis, tickets en attente ; **le ticket s'affiche après Valider**, imprimable 80 mm, WhatsApp) · Caisse (ouverture, clôture, écart) · Rattrapage (plusieurs jours à la main, relevé mobile money collé, photo de facture, reprise de bilan) · Discussion (fil d'équipe, par projet, @assistant) · Produits / Prestations / Carte / Marchandises · Stock (mouvements, alertes, valorisation, ajustement) · Achats (bon de commande, réception au coût moyen pondéré, **achat à l'étranger** avec devise, taux, frais d'approche, TVA de douane, **précompte sur achat**) · Clients & fournisseurs · Ventes · Devis · Dettes & crédits (règlements, relance WhatsApp) · Projets · Dépenses (garde-fou : une caisse n'est jamais négative) · Résultats · Documents (rapports imprimables, FEC) · Livre de caisse · Personnel (personnes, pointage, avances, paie) · Immobilisations (un compte par nature : 241, 2442, 2444, 245, 231, 244 ; dotations ; sorties) · Journal · Grand livre · **Balance six colonnes** · Bilan & résultat · Plan comptable · Déclaration de TVA · Rapprochement bancaire · Clôture (report à nouveau 121 créditeur / 129 débiteur) · Audit · Historique · Équipe (rôles owner, manager, cashier, accountant) · Assistant · Paramètres · **Manuel d'utilisation** (`/manuel`, rendu de docs/MANUEL.md).

Mode **Simple** (quotidien) / **Expert** (comptabilité). Visite guidée à la première ouverture.

## 8. Fiscalité

- Régime d'imposition (`company.taxRegime`) : **réel** (TVA facturée, déduite, déclarée), **IGS** (aucune TVA, écran de déclaration retiré, précompte sur achat possible), **non assujetti**. Choisi à l'inscription, modifiable dans Paramètres. Le régime commande `vatEnabled`.
- Précompte sur achat : taux dans Paramètres (jamais pré-rempli), proposé sur chaque bon de commande. À la réception : 4492 « État — acomptes et précomptes d'impôt » au débit, fournisseur au crédit du total dû ; jamais dans le coût du stock. Le côté vendeur (grossiste qui retient le précompte) n'est pas fait.
- Prix TTC ou HT selon `pricesIncludeTax`. TVA de douane déductible ; aucune TVA locale sur une facture étrangère.

## 9. Les personnes autour

- **Gautier Fossong**, fiscaliste-comptable, fait l'audit de l'application. Ses remarques sont prioritaires. Il a déjà obtenu : ticket après vente, accueil allégé, manuel, caisse jamais négative, balance six colonnes, sous-comptes d'immobilisations, régime d'imposition. Questions ouvertes pour lui : taux de précompte selon régimes, sens de « plan comptable précédé des 0000 », traitement côté vendeur.
- **Duviol**, ami de Beau, import-export : cas d'usage des achats à l'étranger.
- Premiers utilisateurs potentiels contactés par WhatsApp : usage gratuit contre retours.

## 10. Documents du dépôt

- `docs/MANUEL.md` : manuel utilisateur, 23 sections, rendu dans l'application.
- `docs/A-VERIFIER.md` : ce que Beau doit tester, mis à jour à chaque livraison, avec le compte rendu des audits.
- `docs/FEUILLE-DE-ROUTE.md` : fait / prochain / plus tard.
- `docs/SECTEURS.md` : comment chaque métier se gère.

## 11. Méthode de travail attendue

1. Lire la demande de Beau pour l'intention, pas la lettre.
2. Construire complètement (pas de moitié), vérifier en navigateur (1280 et 390 px, clair et sombre, français et anglais) et par les scripts.
3. Mettre à jour docs/A-VERIFIER.md et, si l'écran change, docs/MANUEL.md.
4. Commiter avec un message en français qui dit ce qui change et pourquoi, pousser sur `main`.
5. Répondre à Beau en quelques lignes : fait, à tester, ce qui reste. Quand il demande un message à envoyer à quelqu'un, le donner prêt à copier-coller, sans commentaire autour.
