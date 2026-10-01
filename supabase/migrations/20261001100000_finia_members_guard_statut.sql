-- Finjaro Accounting — fermer la réactivation d'un membre retiré (01/10).
--
-- APPLIQUÉE le 01/10 par Alpha, sur le oui de Beau (nom : finia_members_guard_statut).
-- Vérifiée avant/après dans une transaction annulée : retiré → actif et
-- rattachement à un autre compte REFUSÉS ; acceptation normale ACCEPTÉE.
--
-- Relevé par Alpha (audit complet du 01/10, M-6) et vérifié en lisant la
-- règle et le déclencheur : la règle `finia_members_self_accept` laisse la
-- personne dont l'adresse figure sur la ligne la modifier. Le déclencheur
-- `finia_members_guard` bloque déjà le changement d'espace, d'adresse et de
-- rôle, mais PAS le statut ni l'identifiant :
--   - un membre retiré par le propriétaire (status = 'removed') pouvait se
--     remettre lui-même en 'active' et retrouver l'accès aux comptes ;
--   - user_id pouvait recevoir l'identifiant de n'importe qui, ce qui ouvrait
--     l'espace à une tierce personne avec le rôle du membre.
--
-- Correctif : hors propriétaire, une ligne retirée ne change plus de statut,
-- user_id ne peut désigner que soi-même, et invited_by ne bouge pas. Le
-- parcours normal (accepter une invitation : statut 'active', son propre
-- user_id, son nom) reste permis.
--
-- Additif : on remplace seulement le corps de la fonction du déclencheur.

create or replace function public.finia_members_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Une fonction serveur (service_role) n'a pas d'utilisateur : auth.uid() y
  -- est vide. Elle est de confiance ; sans ce passage, toute correction
  -- d'administration tomberait sur les exceptions ci-dessous (relu par Alpha).
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

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
  -- Retiré par le propriétaire : seul le propriétaire peut réinviter.
  if old.status = 'removed' and new.status is distinct from old.status then
    raise exception 'Vous avez été retiré de cet espace : seul son propriétaire peut vous réinviter';
  end if;
  -- On ne se rattache qu'à soi-même.
  if new.user_id is distinct from old.user_id and new.user_id is distinct from auth.uid() then
    raise exception 'Accepter une invitation ne permet de se rattacher qu''à son propre compte';
  end if;
  if new.invited_by is distinct from old.invited_by then
    raise exception 'Accepter une invitation ne permet pas de changer qui a invité';
  end if;

  return new;
end
$function$;

revoke execute on function public.finia_members_guard() from public, anon, authenticated;
