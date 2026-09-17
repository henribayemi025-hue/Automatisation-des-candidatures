# Ouvrir le réseau de nos sessions — mode d'emploi pour Beau

Aujourd'hui nos sessions cherchent sur le web (recherche et lecture de pages publiques), mais **ne peuvent pas joindre directement** `accounting.finjaro.net`, `finjaro.net`, ni les projets Supabase. C'est un réglage de l'environnement, pas une limite de nos outils : le niveau d'accès réseau est sur **Trusted** (une liste de domaines de confiance : dépôts de paquets, GitHub, SDK).

## Ce qu'il faut faire, en cinq gestes

1. Ouvrir **claude.ai/code**.
2. Au-dessus de la zone de message, cliquer le **bouton nuage** qui porte le nom de l'environnement (« Default » chez nous). Il n'y a pas de page de réglages séparée.
3. Survoler l'environnement et cliquer l'**icône d'engrenage** qui apparaît à droite.
4. Dans **Network access**, choisir **Custom**, puis cocher **« Also include default list of common package managers »** (pour garder GitHub, npm et le reste).
5. Dans **Allowed domains**, une ligne par domaine :

```
accounting.finjaro.net
finjaro.net
*.finjaro.net
*.supabase.co
*.workers.dev
```

Enregistrer. **Les sessions déjà en cours gardent l'ancien réglage** : le nouveau s'applique aux sessions démarrées ensuite (et à chaque réveil de routine).

## Ce que ça nous donne

- Vérifier un déploiement au lieu de le supposer : ouvrir la vraie page, se connecter, dérouler un parcours de caisse dans un vrai navigateur.
- Rejouer sur le projet de test les scénarios à plusieurs caissiers, la liaison place de marché → comptabilité, la connexion Google.
- Contrôler qu'une correction est bien en ligne après un déploiement Cloudflare.

## Ce que ça ne change pas

- Nous n'obtenons aucun accès nouveau à la production : les mêmes règles s'appliquent (rien en base, en fonction edge ou en production sans ton mot).
- Ce n'est pas « accès à tout » : seuls les domaines listés s'ouvrent. Tu peux mettre **Full** (tout internet) si tu préfères, mais **Custom** suffit et reste propre.

## Sources

- [Cloud environments — Access levels](https://code.claude.com/docs/en/cloud-environments#access-levels) : les quatre niveaux (None, Trusted, Full, Custom).
- [Allow specific domains](https://code.claude.com/docs/en/cloud-environments#allow-specific-domains) : la liste, le `*.` pour les sous-domaines, la case pour garder la liste par défaut.
- [Configure your environment](https://code.claude.com/docs/en/cloud-environments#configure-your-environment) : le bouton nuage et l'engrenage.
