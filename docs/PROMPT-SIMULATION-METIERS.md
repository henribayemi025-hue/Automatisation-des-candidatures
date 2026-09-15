# Prompt figé — simulation des métiers, résistance dans le temps, revue d'experts

Demandé par Beau le 15/09. Ce fichier est le prompt lui-même : il se colle tel
quel à une session Claude qui travaille sur **Finjaro Accounting**. Il ne
réexplique pas le produit — cela vit déjà dans `PROMPT-FINJARO-ACCOUNTING.md`,
`SECTEURS.md` et `FEUILLE-DE-ROUTE.md`, à lire d'abord.

Pourquoi deux passes plutôt qu'une équipe d'experts par métier : une équipe
design collée à chaque métier écrirait vingt et une fois la même remarque, et
les doublons noieraient les trois trouvailles propres à un seul métier. Une
entreprise ne met pas un designer par département ; elle a une équipe design
qui sert tous les départements, et c'est ce qui lui permet de dire « ce
problème, je le vois partout ». Les deux seuls experts qui restent attachés à
un métier sont la comptabilité métier et la fiscalité, parce que là le métier
change réellement la réponse.

---

## Le prompt

Tu travailles sur **Finjaro Accounting**. Lis d'abord
`docs/PROMPT-FINJARO-ACCOUNTING.md`, `docs/SECTEURS.md` et
`docs/FEUILLE-DE-ROUTE.md` : le produit et les règles y sont déjà écrits, ne
les réinvente pas.

### Règles absolues

- Toute écriture de données va sur le projet de test **`qiyvoaljqmbfldephobp`**.
  **Jamais sur la production `bokwivwizghdlaedczbw`**, qui est partagée avec la
  place de marché, un `auth.users` commun et deux ou trois applications
  tierces. N'utilise que les objets préfixés `finia_`.
- **Tu ne modifies aucun taux de taxe ni aucune règle comptable de ta propre
  initiative.** Si tu penses qu'un taux ou un traitement est faux, tu le
  **signales** — le comptable tranche. Un chiffre fiscal non certain ne se
  pré-remplit pas.
- Les données simulées restent **étiquetées comme simulation**. Elles ne
  servent jamais à décrire l'activité réelle de Finjaro.
- Aucune notification, aucun e-mail envoyé. Aucune pull request. Aucun texte
  visible qui enferme le produit dans un pays.

---

### Passe 1 — Vingt et une entreprises vivent pour de vrai

Un agent par entreprise. Chaque agent joue son métier **comme le patron le
vivrait** : ouverture de caisse, ventes de la journée (espèces, mobile money, à
crédit), achats fournisseur réglés en plusieurs fois, dépenses, casse, retours,
paie, clôture du soir. Puis il fait vivre l'entreprise sur **un jour, une
semaine, un mois, un trimestre, une année, puis dix années consécutives**.

**Commerce et production (11)**

1. Boutique de quartier — crédit client, mobile money, SMT puis Système Normal
2. Supérette ou supermarché — plusieurs caisses, codes EAN, inventaires tournants
3. Restaurant, snack, traiteur — recettes, tables, pourboires, événements
4. Jus et boissons — production par assemblage, péremption courte
5. Pharmacie — lots, dates de péremption, ordonnances, tiers payant
6. Électronique et téléphonie — numéros de série, garanties, reprises
7. Salon de beauté avec revente de produits — mi-service, mi-négoce
8. Vendeur ambulant, activité sans local — pas de stock tenu, tout au comptant
9. Import-export et négoce — devises, douane, marchandises en transit
10. PME en France — PCG, TVA, paie, exercice complet
11. Reprise d'une entreprise existante — bilan d'ouverture, rattrapage d'historique

**Services (10 formes, qui couvrent les 48 métiers de la place de marché)**

Les métiers de services ne se rangent pas par nom mais par **forme
comptable** : un coiffeur, une masseuse et une femme de ménage se
comptabilisent pareil ; un professeur de langues et une salle de sport aussi,
et ces deux groupes n'ont rien à voir entre eux.

| Forme | Métiers de Finjaro | Le piège comptable propre à cette forme |
| --- | --- | --- |
| Prestation à la personne | beauté à domicile, coiffure, maquillage, massage, ménage, garde d'enfants | Pas de stock mais des consommables, déplacements, pourboires, rendez-vous non honoré |
| Intervention technique avec pièces | mécanique auto, électricité-plomberie, BTP-bricolage, réparation électronique, technicien, peintre | Devis → pièces + main d'œuvre, acompte, garantie, chantier à cheval sur deux exercices |
| Mission longue | juridique-admin, comptable, marketing, design graphique, community manager, informatique, formateur, écrivain | Acomptes et travaux en cours, facturation à l'avancement, retenue à la source |
| Projet avec matériel | photo-vidéo, vidéaste, studio, créateur de contenu, musicien-DJ, événementiel, artiste | Matériel amorti, acompte + solde, location de matériel, droits d'usage |
| Cours et abonnements | cours, cours de langues, enseignant, loisirs-sport | Produits constatés d'avance : un carnet de 10 séances encaissé et non consommé est une **dette**, pas une recette |
| Location de biens | location immobilière, location de véhicules | Le dépôt de garantie n'est **pas** un produit ; loyers d'avance ; amortissement du bien loué |
| Transport et voyage | chauffeur, livraison-déménagement, voyage-tourisme | Encaissement pour le compte d'un tiers : l'agence encaisse 500 000 dont 450 000 ne lui appartiennent pas |
| Atelier sur bien confié | pressing, couture-retouches, imprimerie | Le bien du client n'est **pas** mon stock : bon de dépôt, retrait, perte ou casse |
| Santé réglementée | médecin, santé à domicile, nutritionniste | Actes, tiers payant, confidentialité renforcée des données |
| Personnel posté et production vivante | sécurité, élevage-agriculture | Heures de nuit et postes dans la paie ; stock vivant qui naît, grandit et meurt ; saisonnalité |

Traiteur et pâtisserie rejoignent la forme « restaurant ». « Services
spécialisés » et « autre » restent le fourre-tout et ne sont pas simulés.

**Consigne supplémentaire aux dix agents de services :**

> Ton entreprise doit rencontrer explicitement le piège comptable de sa forme
> (encaissement d'avance, dépôt de garantie, bien confié, encaissement pour
> autrui, stock vivant). Vérifie ce que l'application en fait aujourd'hui. Si
> elle le traite comme une recette ordinaire, c'est un **faux bénéfice** dans
> le résultat de l'année : signale-le comme bloquant, avec le montant exact de
> l'erreur.

C'est là que se trouvent les vraies trouvailles : cinq de ces dix pièges font
apparaître un bénéfice qui n'existe pas, et un commerçant qui paie ses impôts
là-dessus paie sur de l'argent qui n'est pas à lui.

**Ce que chaque agent vérifie à chaque horizon.** Pas un avis : des vérités
comptables, qui passent ou ne passent pas.

- La balance est équilibrée (débit = crédit) après chaque opération.
- Le solde de caisse théorique correspond au compte réel ; l'écart est expliqué.
- Le stock ne devient jamais négatif, et sa valeur correspond aux mouvements.
- La clôture d'exercice passe, et le **report à nouveau** de l'année N se
  retrouve exactement en ouverture de N+1, dix fois de suite.
- La taxe déclarée correspond aux ventes de la période.
- Le bilan boucle (actif = passif) et le compte de résultat est cohérent avec
  le journal.
- Le FEC s'exporte et se relit sans perte.

Tout ce qui est vérifié devient un **script rejouable** dans `scripts/`, sur le
modèle des `*-check.ts` existants — pas un récit qu'on ne pourra jamais
refaire.

**Livrable de la passe 1 :** par entreprise, ce qui casse, à quel horizon, avec
le scénario exact pour le reproduire. Des **faits**, pas de recommandations.

---

### Passe 2 — L'équipe d'experts passe sur les vingt et une entreprises

Chaque expert lit **tout** et rend **une seule liste de points**, en disant
pour chacun s'il est **général** (tous les métiers) ou **propre à un métier**.

**Transversaux, une seule liste chacun :**

1. **Design et simplicité** — le mode Simple est-il tenable pour un mécanicien
   qui n'a jamais fait de comptabilité ? Où décroche-t-il ? Vérifier aussi en
   écran large, pas seulement à 390 px.
2. **Sécurité et argent** — qui peut lire ou écrire quoi, cloisonnement entre
   espaces de travail, rôles gérant/caissier/comptable, journal inaltérable,
   ce qu'un caissier malveillant peut faire.
3. **Hors ligne et synchronisation** — perte de données, doublons, conflits
   entre appareils. C'est le point le plus grave du produit : une vente perdue
   est pire qu'un écran lent.
4. **Assistant et IA** — justesse des réponses sur de vrais chiffres, coût,
   garde-fous ; il ne doit jamais affirmer un montant faux.
5. **International** — devises, langues, formats de date et de nombre. La
   devise ne retombe jamais sur le FCFA par défaut. Point dur connu :
   `countries.ts` propose **49 pays mais seulement 3 référentiels** —
   SYSCOHADA (16 pays), PCG (France, Belgique, Luxembourg) et **GENERIC pour
   les 30 autres**, dont le Nigeria, le Royaume-Uni, le Canada et les
   États-Unis. Que manque-t-il concrètement à un commerçant dans ces pays ?

**Attachés au métier, une liste par entreprise :**

6. **Comptabilité métier** — la compta d'une pharmacie n'est pas celle d'un
   restaurant ni celle d'une agence de voyage.
7. **Fiscalité et régimes** — seuils, SMT et Système Normal, DSF, et les
   exercices qui ne commencent pas en janvier : Royaume-Uni 06/04, Afrique du
   Sud 01/03, Éthiopie 08/07. C'est là que les clôtures cassent.

Un expert transversal peut se **subdiviser en sous-spécialités** quand le sujet
est large (le design en lisibilité, écran large, accessibilité, impression des
tickets). C'est la profondeur qui augmente, jamais le nombre de rapports.

**Format imposé pour chaque point :** ce qui se passe, comment le reproduire,
la preuve (chiffre ou capture), la correction proposée. Dix points maximum par
liste, classés du plus grave au moins grave.

---

### Passe intermédiaire — Volume, simultanéité, réseau

À mener entre les deux passes, sur le projet de test.

Une entreprise à dix ans d'activité (≈ 200 000 écritures), un catalogue de
20 000 références, 5 puis 20 caissiers simultanés sur le même espace de
travail, une clôture lancée pendant qu'une vente est en cours.

Mesures chiffrées : temps d'ouverture du journal, du grand livre, de la
balance, du bilan ; temps d'une vente en caisse ; comportement en réseau lent
et hors ligne.

Et le point critique : deux appareils travaillent **sans réseau** sur le même
espace, puis se reconnectent. Vérifier qu'**aucune opération n'est perdue,
aucune n'est comptée deux fois**, et que les deux appareils finissent sur le
même état.

---

### Le seul livrable final

Un tableau unique, une ligne par problème, trié du pire au moins grave. Une
quarantaine de lignes attendues, pas soixante-dix listes séparées.

| # | Problème (une phrase) | Métier(s) | Domaine | Gravité | Effort | Décision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | La clôture perd le report à nouveau au 3ᵉ exercice | tous | Comptabilité | Bloquant | 1 j | ☐ |

Beau coche ce qui est traité. Le détail va dans `docs/`, les contrôles dans
`scripts/`, et la réponse à l'écran tient en une page de français simple, sans
jargon.
