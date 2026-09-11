# Feuille de route — d'après les 100 points et les remarques de Beau

État au 11/09/2026. Trois colonnes : **fait** (en ligne), **prochain** (une à
deux semaines de travail), **plus tard** (demande un partenaire, une
certification ou une infrastructure).

## Interface et tableau de bord

| Point | État |
| --- | --- |
| Accueil dense façon terminal financier, typographie de chiffres alignée, sans carte décorative | fait |
| MTD / YTD / 30 jours, comparaison M-1 et N-1 sur chaque indicateur | fait |
| Courbes miniatures dans les cartes, clic vers l'écran de détail | fait |
| Texte long qui défile au lieu d'être coupé | fait |
| Graphique recettes / dépenses / trésorerie avec légende et totaux | fait |
| Menu à six points comme lanceur d'applications, menu latéral pour la comptabilité | fait |
| Mode simple / mode expert (vocabulaire courant ou technique) | fait |
| Formats de nombres et devises par langue (Intl) | fait |
| Discussion : canaux à gauche, fil au centre, chiffres du projet à droite | fait |
| Mode sombre certifié contrastes | plus tard |
| Onglets internes pour comparer deux écrans | plus tard |
| Éditeur de mise en page des factures PDF (logo, mentions) | prochain |
| Appels audio / vidéo dans la discussion (WebRTC) | prochain |

## Point de vente et opérations

| Point | État |
| --- | --- |
| Client passager par défaut, fiche client seulement si utile | fait |
| Scanner de codes-barres clavier reconnu partout, retour sonore | fait |
| Recherche d'un ticket par numéro, montant, article, client, caissier | fait |
| Ticket en attente pendant qu'on sert le suivant | fait |
| Ouverture, clôture, écart de caisse comptabilisé | fait |
| Vente à crédit, acompte, reste dû, relance WhatsApp | fait |
| Casse et démarque en charge | fait |
| Devis avec acompte transformé en facture | fait |
| Retours et remboursements avec avoir | prochain |
| Fiches recettes (nomenclature) : un plat vendu décrémente ses ingrédients, marge réelle par plat | prochain |
| Paiement mixte (espèces + mobile money) sur un ticket | prochain |
| Plusieurs caisses et sessions par caissier | prochain |
| Articles au poids, étiquettes et codes internes | prochain |
| Promotions conditionnelles, seuils de remise avec code superviseur | plus tard |
| Vente hors ligne et resynchronisation sans conflit | plus tard |
| Tables et additions ouvertes, partage d'addition, envoi en cuisine, pourboires, cartes cadeaux, pointage du personnel | plus tard |

## Comptabilité et fiscalité

| Point | État |
| --- | --- |
| Partie double vérifiée à chaque écriture | fait |
| Écritures inaltérables, correction par extourne, historique complet | fait |
| SYSCOHADA, PCG, plan générique ; profils fiscaux par pays ; 106 devises | fait |
| Reprise d'un bilan existant (soldes d'ouverture ou balance importée) | fait |
| Comptabilité analytique de premier niveau : projets | fait |
| Rôle comptable en lecture, invitation par e-mail | fait |
| Import de relevés (texte, CSV) avec poste de dépense proposé | fait |
| Clôture d'exercice et à-nouveaux automatiques | prochain |
| Immobilisations et plan d'amortissement | prochain |
| Taux de TVA par article ; ventilation 17,5 % / centimes au Cameroun | prochain |
| Export FEC (France) | prochain |
| Rapprochement bancaire assisté | prochain |
| Paiements mixtes ventilés par compte de trésorerie | prochain |
| SMT / Système normal, TAFIRE, DSF ; liasse fiscale ; Factur-X ; retenue à la source ; provisions ; FIFO / CUMP au choix ; brouillons d'écritures | plus tard |

## Technique et intégrations

| Point | État |
| --- | --- |
| Base partagée avec Finjaro, sécurité par ligne (RLS), un espace par entreprise | fait |
| Synchronisation en direct entre membres, journal d'événements | fait |
| Photos du fil dans un espace privé, liens signés | fait |
| Assistant sur serveur, clé protégée, limite par utilisateur | fait |
| Mobile money — encaissement instantané par SMS reçu (numéro marchand personnel, sans API opérateur) | prochain |
| Mobile money — intégration API marchand (MTN/Orange, webhooks, idempotence) : demande un compte marchand pro | plus tard |
| WhatsApp Business (réception des messages, modèles approuvés) | plus tard |
| Double authentification pour gérants et comptables | prochain |
| API ouverte, connecteurs Odoo / SAP, consolidation multi-sociétés | plus tard |
| Imprimantes de tickets (WebUSB / Bluetooth) | prochain |

## Intelligence artificielle

| Point | État |
| --- | --- |
| Explique chaque écran, répond avec les vrais chiffres, dans la langue de la personne | fait |
| Lit une facture ou un reçu en photo et propose la dépense | fait |
| Crée des produits à partir d'une liste dictée ou photographiée | fait |
| Poste de dépense deviné d'après le libellé du relevé | fait |
| Rappel après trois jours sans saisie | fait |
| Lecture d'un bilan PDF avec contrôle actif = passif | prochain |
| Question en langage courant → tableau (requêtes) | prochain |
| Dictée vocale des ventes, note vocale WhatsApp | plus tard |
| Alertes prédictives de rupture, relances rédigées selon le retard | plus tard |
| Remplissage prédictif après inactivité, détection d'anomalies en caisse | plus tard |
| Indice de confiance sur les écritures automatiques | plus tard |
