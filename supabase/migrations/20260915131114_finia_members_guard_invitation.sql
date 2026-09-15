-- Finjaro Accounting — fermer l'entrée dans l'espace comptable d'un autre.
-- Appliquée en production le 15/09/2026 avec l'accord de Beau.
-- Contexte et preuves : docs/SECURITE-2026-09-15.md, point 1.
--
-- La règle finia_members_self_accept, faite pour accepter une invitation, ne
-- contrôle que l'adresse e-mail : ni workspace_id ni role. En PostgreSQL,
-- USING porte sur la ligne d'avant et WITH CHECK sur la ligne d'après, et
-- aucune des deux ne peut comparer l'ancienne à la nouvelle. Un utilisateur
-- pouvait donc créer une ligne de membre chez lui (autorisé, il en est
-- propriétaire), puis la déplacer vers l'espace de quelqu'un d'autre.
--
-- Ce que PostgreSQL ne sait pas exprimer dans une politique, un déclencheur le
-- sait : lui voit OLD et NEW. Migration additive, sur une table d'Accounting
-- seule : la place de marché n'est pas concernée.

create or replace function public.finia_members_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Le propriétaire gère les membres de SON espace : inviter, changer un rôle,
  -- retirer. Il faut être propriétaire de l'espace de départ ET d'arrivée,
  -- sinon déplacer une ligne resterait un moyen d'entrer ailleurs.
  if public.finia_is_owner(old.workspace_id) and public.finia_is_owner(new.workspace_id) then
    return new;
  end if;

  -- Sinon, on accepte une invitation qui nous est adressée : on ne change que
  -- soi-même. L'espace, l'adresse et le rôle restent ceux que le propriétaire
  -- a inscrits.
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'Accepter une invitation ne permet pas de changer d''espace de travail';
  end if;
  if lower(new.email) is distinct from lower(old.email) then
    raise exception 'Accepter une invitation ne permet pas de changer d''adresse';
  end if;
  if new.role is distinct from old.role then
    raise exception 'Accepter une invitation ne permet pas de changer de rôle';
  end if;

  return new;
end
$$;

comment on function public.finia_members_guard() is
  'Garde-fou de finia_members : accepter une invitation ne change que soi-même, jamais l''espace, l''adresse ni le rôle. Voir docs/SECURITE-2026-09-15.md du dépôt Accounting.';

drop trigger if exists finia_members_guard on public.finia_members;

create trigger finia_members_guard
before update on public.finia_members
for each row
execute function public.finia_members_guard();
