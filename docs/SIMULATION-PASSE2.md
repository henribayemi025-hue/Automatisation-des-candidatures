# Simulation métiers — passe 2 : revue d'experts

Rédigée le 2026-09-15 après la passe 1 (`docs/SIMULATION-PASSE1.md`) et la
passe intermédiaire (`docs/SIMULATION-VOLUME.md`). Chaque expert a lu les
deux rapports, le code (`src/`), les règles d'accès de la base (lecture seule
sur la production) et les documents précédents (`docs/SECURITE-2026-09-15.md`,
`docs/A-VERIFIER.md`).

Format de chaque point : ce qui se passe · comment le reproduire · la
preuve · la correction proposée. Dix points au plus par liste, du plus grave
au moins grave. **G** = général (tous les métiers), **M** = propre à un métier.

Le tableau unique de décision est dans `docs/SIMULATION-DECISIONS.md`.

---

## 1. Design et simplicité

Sous-spécialités : lisibilité, écran large, accessibilité, impression des tickets.

1. **G — Le mode Simple cache la comptabilité mais pas ses conséquences.** Un mécanicien en mode Simple voit « Vendre, caisse, stock, dettes, dépenses, résultats » ; il ne voit ni le journal ni la clôture, mais l'accueil lui affiche un résultat qui inclut les pièges de la passe 1 (acomptes, dépôts, abonnements comptés en produit). Reproduire : Réglages → Mode simple → vendre un carnet de dix séances → lire « résultat » sur l'accueil. Preuve : passe 1, coach (7 à 17 millions de faux bénéfice par an). Correction : en mode Simple, l'accueil dit « encaissé » et « dépensé », pas « résultat », tant que l'exercice n'est pas clôturé par un comptable.
2. **G — Rien ne dit que le cache local est plein.** Passé ~5 Mo (un trimestre de boutique), `saveCache` avale l'erreur ; l'application redevient « en ligne seulement » sans un mot. Reproduire : passe intermédiaire, colonne « État JSON ». Correction : afficher l'état du stockage dans la barre hors ligne et proposer l'instantané léger (voir Hors ligne, point 1).
3. **G — Le point de vente ne prévient pas d'un stock à zéro ou négatif.** Le ticket passe, le stock descend sous zéro, la fiche article seule le montre. Reproduire : vendre 4 unités d'un article qui en a 3. Preuve : passe 1, supérette, salon, garage. Correction : badge « plus que 3 » dans la recherche, confirmation explicite avant de passer sous zéro, jamais de refus silencieux.
4. **G — Une prestation a une case « stock ».** Dans un salon ou un garage avec stock activé pour les pièces, la fiche « Coupe homme » affiche un stock de −678 au bout d'un an. Reproduire : passe 1, salon. Correction : case « c'est une prestation » sur la fiche article, qui retire la quantité de la fiche et de la vente.
5. **G — Le retour d'un article n'a pas de bouton.** La commerçante cherche « retour » ou « avoir » et ne trouve rien ; l'extourne d'écriture est réservée au mode Expert et ne remet pas l'article en stock. Correction : bouton « Reprendre un article » sur le ticket, qui crée un avoir, remet le stock et sort le coût.
6. **G — Écran large : les tableaux de la passe 1 ne sont pas le problème, la densité l'est.** Sur 1 280 px, journal et grand livre affichent 20 lignes pour 200 000 disponibles, sans pagination ni tri par colonne ; le tri se fait sur la totalité à chaque rendu (88 ms à 214 000 écritures, mesuré). Correction : pagination côté page et tri incrémental.
7. **G — Accessibilité : les montants en gris clair sur crème.** `text-muted` sur `bg-base` dans les cartes d'accueil (contraste mesuré à l'œil, non chiffré ici). Correction : mesurer le contraste avec un outil et remonter à 4,5:1 sur tout ce qui est un chiffre.
8. **G — Le ticket imprimé change de numéro après synchronisation.** Deux caisses hors ligne impriment toutes deux « FA-00001 » ; après rechargement l'un s'appelle « FA-00001-B ». Preuve : passe intermédiaire, section deux appareils. Correction : voir Hors ligne, point 3.
9. **M (restaurant, jus) — Pas de fiche technique.** Un plat est un article avec un coût fixe ; la matière achetée n'est pas décomposée, la marge réelle par plat est inconnue. Correction : composition simple (article = liste d'ingrédients × quantité) en mode Expert, facultative.
10. **G — Le manuel ne couvre pas ces cas.** `docs/MANUEL.md` explique la clôture et la balance, pas « que faire d'un acompte », « d'une caution », « d'un abonnement ». Correction : une section « cas particuliers » par forme de service, après les décisions.

## 2. Sécurité et argent

1. **G — Un caissier peut tout écrire, y compris effacer l'espace.** Les rôles (`cashier`, `accountant`, `manager`, `owner`) ne vivent que dans l'interface (`canAccess`, Layout). La règle d'accès de `finia_events` autorise l'insertion de n'importe quel type d'événement à tout membre actif : `workspace.reset` (état vidé), `year.close`, `entry.manual`, `company.update` (devise, taux de taxe), `employee.save` (salaires), `product.save` (prix). Reproduire : depuis un compte caissier, `supabase.from('finia_events').insert({type:'workspace.reset', …})` dans la console du navigateur. Preuve : politique `finia_events_insert` = `finia_is_member(workspace_id) AND actor_id = auth.uid()`, sans condition sur le rôle ni le type (lue en production, lecture seule). Gravité réelle, vérifiée sur le projet de test (`docs/SIMULATION-TEST-PROJET.md`) : le journal est en ajout seul (0 ligne modifiable ou effaçable par un caissier), seul le propriétaire peut supprimer l'espace, l'usurpation d'auteur et le changement de son propre rôle sont refusés. Un caissier malveillant ne détruit donc rien définitivement : tout reste inscrit et annulable. Reste à corriger : vérification côté base du couple rôle × type d'événement (fonction `finia_can_emit(role, type)` dans la politique), migration additive.
2. **G — Le journal est inaltérable mais l'espace est supprimable.** `finia_owner_delete` autorise le propriétaire à supprimer l'espace ; `finia_events` est en `ON DELETE CASCADE` : tout le journal disparaît d'un coup. Reproduire : DELETE sur `finia_workspaces` avec le compte propriétaire. Correction : suppression logique (colonne `deleted_at`), jamais physique.
3. **G — Un caissier voit tout ce que voit la gérante.** La règle SELECT est la même pour tous les membres : salaires, marges, dettes, résultat sont dans l'état que chaque appareil reconstruit. Le menu cache les écrans, pas les données (visibles dans `localStorage` et dans la réponse réseau). Correction : c'est structurel au modèle « chaque appareil rejoue tout » ; à court terme, dire la vérité dans l'écran Équipe (« le caissier peut lire toutes les données de l'espace ») ; à long terme, projection par rôle côté serveur.
4. **G — Ce qu'un caissier malveillant peut faire aujourd'hui** : vendre puis extourner l'écriture de vente (mode Expert caché, mais l'événement passe), passer un écart de caisse « manquant » à son avantage à chaque fermeture de session, saisir une dépense fictive en espèces, modifier le prix d'un article avant de le vendre à un complice. Toutes ces actions sont tracées dans le journal (bien), aucune n'est empêchée ni signalée (mal). Correction : point 1 pour les interdire, et une alerte à la gérante sur les extournes, écarts de caisse et changements de prix du jour.
5. **G — Le code d'ouverture protège l'écran, pas les données.** Déjà documenté (`LockCard`) : l'état est en clair dans le navigateur. Correction : aucune côté application ; le verrou du téléphone, dit clairement, reste la seule protection.
6. **G — Déconnexion = perte des ventes non envoyées.** `signOut` purge `finia.outbox.*` (correctif de sécurité du 15/09) sans regarder si la file est vide. Reproduire : couper le réseau, vendre, se déconnecter, se reconnecter. Correction : refuser la déconnexion tant que la file n'est pas vide, ou la garder chiffrée par le code d'ouverture.
7. **G — La clé Supabase et l'URL sont dans le worker en clair** (`src/worker.js`) : c'est la clé publiable, ce qui est normal ; la clé Gemini est bien côté serveur. Rien à corriger, à garder ainsi.
8. **G — Le compactage est réservé au propriétaire, donc il n'a pas lieu sans lui.** Si la gérante n'ouvre pas l'application pendant un mois, aucun instantané n'est pris et chaque caissier rejoue tous les événements à l'ouverture (13 minutes pour 300 événements à 214 000 écritures, mesuré). Correction : compactage côté serveur (fonction planifiée), ou autorisé au gérant.

## 3. Hors ligne et synchronisation

C'est le point le plus grave du produit. Tout ce qui suit est mesuré ou lu dans `src/lib/collab.tsx` et `store.tsx`.

1. **G — Une vente met 3,7 s à 214 000 écritures, et l'ouverture 13 minutes.** `applyEvent` copie tout l'état à chaque événement ; l'ouverture rejoue les événements postérieurs au dernier instantané avec la même copie. Preuve : passe intermédiaire (3 670 ms par vente, 804 s pour 300 événements ; 0,8 ms par vente au premier jour, 57 ms après 5 000 ventes). Correction : (a) copier seulement ce qui change (structure persistante ou mutation contrôlée derrière `applyEvent`), (b) instantané par exercice clos, l'état courant ne portant que l'exercice ouvert.
2. **G — Le même événement peut être compté deux fois sur l'appareil qui l'a émis.** L'événement est appliqué localement, envoyé, et la garde `applied` n'est remplie qu'à la réponse du serveur ; le canal temps réel peut livrer l'insertion avant cette réponse. `applyEvent` n'est pas idempotent (2 ventes pour 1, mesuré). Reproduire : réseau lent, vendre, observer le total du jour. Correction : inscrire l'identifiant dans `applied` avant l'envoi, et rendre `applyEvent` idempotent sur l'identifiant d'événement.
3. **G — Deux journaux différents jusqu'au prochain rechargement.** Deux appareils hors ligne numérotent tous deux « FA-00001 » ; à la reconnexion, chacun applique les événements de l'autre après les siens, et le suffixe « -B » tombe sur une vente différente selon l'appareil (empreintes de journal différentes, mesuré). Le rechargement depuis le cloud rétablit l'ordre du serveur, mais seulement à un retour de réseau, un focus ou une visibilité. Correction : numéro de ticket = préfixe d'appareil + compteur local (jamais réattribué), et rejeu ordonné par `seq` à chaque réception au lieu d'un rejeu à l'arrivée.
4. **G — Un événement renvoyé après une réponse perdue reste bloqué pour toujours.** `finia_events.id` est clé primaire ; la seconde insertion échoue ; `pushEvent` renvoie faux ; l'événement reste dans la file ; le voyant reste « en attente ». Correction : traiter le conflit de clé comme un succès (l'événement est bien là).
5. **G — Le stock n'a pas de plancher et le coût sort deux fois.** Deux caisses vendent le même dernier carton : −1, deux sorties de coût, aucun signal. Correction : à la synchronisation, marquer la vente qui a fait passer sous zéro et proposer un ajustement à la gérante ; en caisse, afficher la quantité restante vue par l'appareil.
6. **G — Le cache local dépasse le quota en un trimestre.** 5 Mo courants ; 16 Mo à un an pour une boutique, 194 Mo à douze ans. `saveCache` ignore l'erreur : l'appareil ne fonctionne plus hors ligne. Correction : IndexedDB pour l'état (centaines de Mo possibles) et instantané par exercice (point 1 b).
7. **G — Le propriétaire renvoie l'état complet tous les 300 événements.** 16 Mo à un an de boutique, plus de 80 Mo pour une supérette, sur un réseau mobile, toutes les quelques heures. Correction : instantané différentiel ou côté serveur.
8. **G — Une file locale peut contenir des événements qui ne seront jamais acceptés.** Si l'espace a été réinitialisé ou si le membre a été retiré entre-temps, l'insertion échoue à chaque essai, sans message. Correction : après trois refus, montrer l'événement à la personne avec « renvoyer / abandonner / exporter ».
9. **G — Une clôture pendant une vente passe et fausse l'exercice clos.** Le ticket validé après la clôture, daté de l'exercice clos, est accepté (mesuré : compte de résultat de l'exercice clos +8 676 après clôture, résultat enregistré inchangé). Correction : refuser toute écriture datée dans un exercice clos (sauf réouverture explicite), dans `post()`.

## 4. Assistant et IA

1. **G — Deux assistants, deux vérités.** Le moteur local (`assistant.ts`) calcule sur les données ; l'IA (`worker.js`, Gemini) reçoit un résumé (40 premiers articles, 5 dernières ventes, 10 dettes) formaté en texte et peut affirmer un montant hors de ce résumé. Rien ne l'en empêche : le système d'invite lui demande de rester dans le contexte, sans vérification après coup. Reproduire : demander « combien m'a rapporté l'article n° 45 ce mois » avec 60 articles. Correction : l'IA ne répond un montant que s'il vient du résumé (vérification par recherche exacte du chiffre dans le contexte avant affichage ; sinon elle renvoie vers le moteur local).
2. **G — L'IA voit un résultat qui est faux dans les formes de service.** Le résumé lui donne « résultat net du mois » calculé par le moteur, pièges compris (passe 1). Elle le commente avec assurance. Correction : point 1 de Design (dire « encaissé », pas « résultat », tant que non clôturé), et le même mot dans le contexte envoyé.
3. **G — La période « cette année » du moteur local commence toujours le 1er janvier** (`resolvePeriod` : `getFullYear()-01-01`), même pour un exercice avril→mars (Royaume-Uni) ou juillet→juin (Éthiopie). Reproduire : entreprise au Royaume-Uni, demander « mes ventes cette année » un 15 mai. Correction : utiliser `fiscalYearStart` de l'entreprise.
4. **G — Coût et limites.** Modèles `gemini-2.5-flash` puis `gemini-3.5-flash`, limitation par utilisateur en mémoire du worker (perdue à chaque redémarrage), délai 30 s. Le coût par question n'est pas mesuré ici (pas de réseau sortant). Correction : compteur de questions par espace et par jour, visible dans Réglages, et plafond.
5. **G — Le résumé envoyé contient les noms des clients débiteurs et les salaires ne sont pas dedans** (vérifié dans `aiContext`). Les dettes clients avec noms partent vers un service tiers. Correction : le dire dans l'écran de l'assistant, et proposer un interrupteur « ne pas envoyer les noms ».
6. **G — Hors ligne, l'IA se tait et le moteur local répond : bien.** Le message de repli est clair. Rien à corriger.

## 5. International

1. **G — Aucune devise par défaut n'est supposée : vérifié.** `currency('')` affiche le code tel quel, l'entreprise démarre avec `currency: ''`, la démo est explicite. Conforme au CLAUDE.md. Rien à corriger.
2. **G — 49 pays, 3 référentiels : ce qui manque vraiment avec GENERIC.** Le plan GENERIC a 41 comptes numérotés 1000-4xxx. Pour un commerçant au Nigeria, au Royaume-Uni, au Canada ou aux États-Unis, ce qui manque n'est pas d'abord la numérotation, ce sont : (a) **plusieurs taxes sur une même vente** (Canada : TPS fédérale + TVQ/TVH provinciale ; États-Unis : taxe d'État + comté + ville ; Inde : CGST + SGST) ; le modèle n'a qu'un taux (`vatRateBp`), Canada est saisi à 5 % seul et les États-Unis à 0 ; (b) **taux réduits par article** (Royaume-Uni 0 % sur l'alimentaire, 5 % sur l'énergie ; France 5,5 %/10 %) : un seul taux par entreprise ; (c) **taxe non incluse dans le prix affiché** (Amérique du Nord) : `pricesIncludeTax` existe, bien ; (d) **exercice décalé** : bien géré, vérifié en passe 1 (04-06, 03-01, 07-08) ; (e) **export vers le comptable local** : le FEC est un format français, sans équivalent Sage/QuickBooks/Xero ; (f) **libellés des comptes GENERIC en français** dans un pays anglophone. Correction, par ordre : taux de taxe par article (petit modèle : `vatRateBp` sur l'article, défaut de l'entreprise), puis taxes multiples, puis export CSV générique « date, compte, libellé, débit, crédit ».
3. **G — Les codes de compte SYSCOHADA sur trois chiffres.** Le comptable a demandé « précédé des 0000 » (comptes à sept ou huit chiffres dans les logiciels camerounais). Le plan a 101, 121, 571… Un import dans un logiciel de cabinet demandera une table de correspondance. Correction : option « codes étendus » à l'export FEC (101 → 10100000).
4. **G — Deux langues, format de date lié à la langue.** `locale()` renvoie `fr-FR` ou `en-GB` : un utilisateur anglophone au Canada ou aux États-Unis voit des dates jour/mois/année et des séparateurs britanniques. Correction : format de date et de nombre par pays de l'entreprise, indépendant de la langue.
5. **G — Devises sans décimales.** XAF, XOF, GNF, UGX, JPY… sont bien à 0 décimale ; les montants sont en unités mineures partout : vérifié sur douze devises en passe 1. Rien à corriger.
6. **M (import-export) — Achat en devise étrangère : bien converti, mais pas de gain ni perte de change** au règlement (le taux est celui du jour de la commande, `ForeignAmount.rate`, la dette est en devise de l'entreprise). Correction : ligne d'écart de change au règlement (compte financier), mode Expert.
7. **G — Pas de mention publique de « diaspora », aucun texte n'enferme dans un pays** : vérifié par recherche dans `src/` (voir `docs/A-VERIFIER.md`). Rien à corriger.

---

## 6. Comptabilité métier — une liste par entreprise

Les numéros renvoient aux formes de la passe 1. Les montants sont ceux mesurés.

**1. Boutique de quartier.** (a) Retour d'article impossible (M/G). (b) Achat payé depuis la caisse quel que soit le moyen réel (G). (c) Écriture acceptée dans un exercice clos (G). Rien d'autre à signaler sur dix ans : balance, bilan, RAN, FEC justes.

**2. Supérette, deux caisses.** (a) Double vente hors ligne : stock −2, coût sorti deux fois, sans signal. (b) Volume : 90 000 écritures par an, 83 Mo de cache à un an, 476 Mo à cinq ans ; la simulation n'a pas tenu dix ans. (c) Pas de taux réduit par article (alimentaire vs alcool). (d) Les écarts de caisse de fin de session passent en charges/produits divers sans rapprochement par caissière.

**3. Restaurant.** (a) Pas de fiche technique : coût matière fixe par plat, marge réelle inconnue ; les pertes (invendus) se saisissent à la main par ajustement. (b) Achats quotidiens payés en caisse : conforme à l'usage, mais impossible autrement. (c) Dérive de 2 000 à 2 500 entre valeur du stock et compte de stock au bout de cinq ans (arrondi du coût moyen), mineure.

**4. Production de jus.** (a) Ni lot ni péremption : la casse se constate après coup. (b) Pas de nomenclature (fruits → bouteilles) : le coût de production est saisi comme coût d'achat. (c) Dérive de stock de 1 % à un an (arrondi), mineure.

**5. Pharmacie.** (a) Ni lot, ni péremption, ni traçabilité (rappel de lot impossible). (b) Marge réglementée non modélisée (prix administrés). (c) Tiers payant assurance = « vente à crédit au nom de l'assureur » : pas de bordereau par assureur ni de lien patient–assureur. (d) Volume : 518 000 écritures sur dix ans, 485 Mo.

**6. Électronique.** (a) Pas de numéro de série par unité : garantie et SAV sans rattachement. (b) Retour sous garantie : aucun événement (ni avoir, ni remplacement, ni provision pour garantie).

**7. Salon mixte.** (a) Prestations à stock négatif dès le premier jour quand le stock est activé pour les crèmes (−678 sur « Coupe homme » à un an). (b) Pas de commission par coiffeuse sur la prestation (paie à la journée seulement).

**8. Ambulant.** Rien à signaler sur dix ans : sans stock suivi, la comptabilité de caisse tient (238 000 écritures, 205 Mo de cache).

**9. Import-export.** (a) Frais d'approche bien intégrés au coût du stock, coût moyen recalculé : conforme. (b) Pas d'écart de change au règlement. (c) Conteneur payé depuis la caisse (7,2 millions) : la gérante doit d'abord « retirer » vers la caisse dans l'application, geste artificiel.

**10. PME France (PCG).** (a) Un seul taux de TVA (20 %) pour toute l'épicerie : le 5,5 % alimentaire est impossible → TVA collectée déclarée fausse dès le premier ticket. (b) FEC : conforme en structure (relu sans perte sur dix exercices) ; à vérifier avec un outil de contrôle de la DGFiP (non disponible hors ligne). (c) Numéros de ticket avec suffixe « -B » après synchronisation : non séquentiels, point d'attention pour la norme de caisse.

**11. Reprise d'entreprise.** (a) Les créances reprises en à-nouveaux (411) ne sont pas des dettes clients dans l'application : pas de relance ni d'encaissement par « régler ». (b) La camionnette reprise n'est pas une immobilisation : pas de dotation. (c) RAN juste après la reprise (vérifié sur dix ans, avec la reprise directe).

**S1. Coach.** Carnets prépayés en produit le jour de la vente : 7 à 17 millions (centimes ZAR) par exercice de produits constatés d'avance manquants ; exercice mars→février bien clôturé.

**S2. Plombier.** (a) Acompte sur devis : aucun écran ; en écriture manuelle, le compte clients devient créditeur et le devis converti encaisse le total (double encaissement si non corrigé). (b) Prestations à stock négatif. (c) Exercice avril→mars : clôture juste.

**S3. Conseil.** Forfait de trois mois facturé le 20 décembre : 2,5 mois de produit sur l'exercice suivant comptés dans l'exercice (6 millions XAF) ; ni avancement ni facture à établir.

**S4. Sonorisation.** Dotation aux amortissements non automatique : si elle n'est pas lancée, résultat surestimé de 1,2 million par sono et par an. Le mécanisme (asset.save, depreciation.run, asset.dispose) est juste quand il est utilisé.

**S5. École.** Inscriptions annuelles encaissées en juin, exercice clos le 7 juillet : 64 à 127 millions (centimes ETB) en produit avant le premier cours. Exercice éthiopien bien clôturé.

**S6. Location.** Dépôts de garantie en produit (130 à 157 millions XOF par an), restitutions en charges diverses ; aucune dette envers les clients au bilan.

**S7. Agence de voyages.** Billets vendus pour les compagnies en chiffre d'affaires (440 à 496 millions, centimes MAD, par an) ; TVA collectée calculée sur le prix du billet ; reversement en charge : le CA affiché est celui d'un grossiste.

**S8. Garage.** (a) Travaux en cours à la clôture : facture passée en produit pour un travail à moitié fait ; travaux faits non facturés absents. (b) Pièce apportée par le client : rien ne la distingue (bien confié). (c) Prestations à stock négatif.

**S9. Cabinet dentaire.** (a) Traitements en trois séances encaissés en décembre : 20 à 22 millions RWF par an de produit constaté d'avance manquant. (b) Consommables à prix 0 : jamais sortis du stock (stock gants = 50 à un an) → stock au bilan gonfle. (c) Consultation gratuite = écriture vide + trou de numérotation FEC. (d) Tiers payant sans bordereau.

**S10. Élevage.** Stock vivant : poussin au bilan à son prix d'achat, aliment en charge immédiate ; ponte entrée par ajustement en produit ; à la clôture la bande en cours vaut 564 000 au bilan pour 2 564 000 dépensés. Faux bénéfice net mesuré 0,3 à 0,5 million XOF par an (sens variable selon la date).

## 7. Fiscalité et régimes — une liste par entreprise

**Tous (G).** (a) Aucun seuil modélisé : ni SMT / Système Normal (SYSCOHADA), ni franchise de TVA, ni passage IGS → réel. L'application ne prévient jamais qu'un chiffre d'affaires a franchi un seuil. (b) Pas de DSF : bilan, compte de résultat et balance à six colonnes existent, la liasse au format de l'administration n'existe pas. (c) Précompte sur achat (IGS) : bien retenu et porté en 4492, vérifié en passe 1 sur la boutique. (d) Exercices décalés : Royaume-Uni 04-06, Afrique du Sud 03-01, Éthiopie 07-08, tous clôturés juste sur dix ans ; **le point dur annoncé (« c'est là que les clôtures cassent ») ne s'est pas produit**. La seule faille est l'écriture acceptée après clôture (Hors ligne, point 9).

**1, 3, 4, 7 (IGS, Cameroun).** Pas de calcul de l'impôt synthétique lui-même (montant forfaitaire par tranche de CA) ; la commerçante ne sait pas ce qu'elle doit.

**2, 5, 6, 11 (réel, Cameroun).** TVA à 19,25 % juste ; pas de déclaration mensuelle préremplie au format de la DGI ; pas d'acompte d'IS (1,1 % ou 2,2 % du CA mensuel) ni de retenue à la source sur les loyers.

**10 (France).** Un seul taux de TVA : déclaration fausse pour une épicerie ; pas de CA3 ; FEC présent.

**S1 (Afrique du Sud).** VAT 15 % juste ; exercice mars→février juste ; pas de seuil d'assujettissement (1 million ZAR).

**S2 (Royaume-Uni).** VAT 20 % unique (0 % alimentaire, 5 % énergie absents) ; exercice 6 avril juste ; Making Tax Digital (déclaration par API) absent.

**S3 (Côte d'Ivoire), S6 (Mali), S8 (Togo), S10 (Côte d'Ivoire).** SYSCOHADA juste ; taux TVA par pays justes (18 %) ; pas de régime d'entreprenant / synthétique par pays.

**S4 (Sénégal).** TVA 18 % juste ; amortissement linéaire seul (dégressif absent, dit clairement dans le code).

**S5 (Éthiopie).** VAT 15 %, exercice 8 juillet : justes.

**S7 (Maroc).** TVA 20 % sur le billet entier : base en général fausse pour une agence (la commission seule, ou la marge, est taxable ; à confirmer par un fiscaliste marocain) ; pas de régime d'auto-entrepreneur.

**S9 (Rwanda).** VAT 18 % juste ; actes de santé souvent exonérés : le taux unique s'applique à tout.
