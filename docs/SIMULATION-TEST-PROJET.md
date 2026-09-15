# Simulation — projet de test qiyvoaljqmbfldephobp : schéma, comptes, rôles (faits)

Fait le 15/09/2026 à la demande de Beau. **Rien n'a touché la production.**

## Ce qui a été posé sur le projet de test

- Migration `supabase/migrations/20260915180000_finia_schema_baseline.sql` : les trois tables `finia_workspaces`, `finia_members`, `finia_events`, les fonctions `finia_is_owner`, `finia_is_member`, `finia_members_guard`, les douze règles d'accès, l'abonnement temps réel. Relevée de la production en lecture seule, écrite pour être rejouable telle quelle en production (chaque objet « s'il n'existe pas », rien de supprimé ni renommé) : rejouée là-bas, elle ne changerait rien. Le projet de test contenait déjà 23 tables de la place de marché ; il en a 26.
- 24 comptes de test dans `auth.users` du projet de test (aucun n'existait) : `gerante@test.finjaro.local` (propriétaire), `gerant-adjoint@` (manager), `comptable@` (accountant), `caissier-01@` à `caissier-20@` (cashier), `intrus@` (connecté, membre de rien). Mot de passe commun : `Test-Finia-2026!`. Métadonnée `simulation: true` sur chacun.
- Un espace « Supérette de simulation (test) » dont les 22 autres comptes sont membres actifs.

## Scénarios de rôles rejoués en base (règles d'accès réelles, jeton simulé)

| # | Qui | Geste | Résultat |
|---|---|---|---|
| A | caissier-01 | insère `workspace.reset`, `year.close`, `company.update` (devise → USD), `employee.save` | **acceptés**, séquences 1 à 4 |
| C | caissier-01 | modifie une ligne du journal, en efface une autre | 0 ligne modifiée, 0 effacée (aucune règle UPDATE/DELETE) |
| D | caissier-01 | efface l'espace | 0 espace effacé |
| D' | caissier-01 | se donne le rôle « manager » | **refusé** par la garde (« Accepter une invitation ne permet pas de changer de rôle ») |
| C'' | caissier-01 | lit le journal et la liste des membres | 4 lignes, 22 membres : tout est lisible |
| E | intrus (connecté, non membre) | lit | 0 ligne, 0 espace, 0 membre |
| E' | intrus | insère une vente | **refusé** (règle d'accès) |
| F | caissier-01 | signe une écriture au nom de la gérante (`actor_id` de la gérante) | **refusé** |
| G | 20 caissiers × 50 tickets | 1 000 insertions une par une sous règles d'accès | 1 000 événements, 1 000 séquences distinctes, croissantes, 20 auteurs ; trous de séquence normaux (essais refusés) |
| H | comptable | passe une écriture manuelle, lit le journal | accepté |
| I | caissier-02 mis « retiré » | lit | 0 ligne, 0 espace |

## Ce que ça change dans le tableau de décision

Le journal est bien en ajout seul et seul le propriétaire supprime l'espace : un caissier malveillant peut **écrire** n'importe quel type d'événement (ligne 3 du tableau), mais ne **détruit** rien définitivement, tout reste inscrit et annulable. La ligne passe de « bloquant » à « majeur », comme demandé.

## Non fait ici

Les 5 puis 20 caissiers **depuis l'application** (temps réel, canal, doublons sur réseau lent) demandent des navigateurs qui atteignent le projet de test ; la machine de simulation n'a pas de réseau sortant. Les comptes et l'espace sont prêts pour le faire depuis un poste connecté (`VITE_SUPABASE_URL` / clé publiable du projet de test).
