-- Finjaro Accounting — audit d'Alpha du 01/10, lot A1 (base) et A4.
--
-- PAS ENCORE APPLIQUÉE : à relire par Alpha, puis appliquer sur le mot de
-- Beau (base partagée). Additif : des fonctions remplacées ou ajoutées et deux
-- règles recréées à l'identique, seule la reconnaissance par adresse change.
-- finia_members compte 0 ligne le 01/10 : personne n'est touché aujourd'hui.
--
-- 1. A-M1 — n'accepter que les adresses CONFIRMÉES.
--    finia_is_member, finia_role_of et deux règles de finia_members
--    reconnaissaient une invitation par la seule adresse du jeton (auth.email()).
--    Une adresse jamais confirmée (22 comptes du projet sont dans ce cas et se
--    sont déjà connectés) suffisait donc : quelqu'un qui crée un compte avec
--    l'adresse d'une personne invitée, sans pouvoir ouvrir sa boîte, entrait
--    dans l'espace. On ne reconnaît plus que l'adresse confirmée
--    (auth.users.email_confirmed_at). Les comptes Google et ceux créés par
--    numéro de téléphone (accounting-inscription-tel) sont confirmés d'office.
--    Le rattachement par user_id, posé à l'acceptation, n'est pas touché.
--
-- 2. A-M3 — limite d'appels de l'assistant partagée entre toutes les instances
--    du worker : finia_quota_assistant() compte 60 appels par heure et par
--    personne connectée avec check_rate_limit (qui reste réservé au serveur).
--    Le worker l'appelle déjà (commit 3fd58fc) et retombe sur son compteur
--    local tant qu'elle n'existe pas.
--
-- 3. A4 — les deux tâches planifiées d'Accounting lisent leur jeton dans le
--    coffre (public.app_secret) au lieu de la table app_secrets.

-- 1. Adresse confirmée ---------------------------------------------------------

create or replace function public.finia_email_confirme()
returns text
language sql
stable
security definer
set search_path to ''
as $function$
  select lower(u.email)
  from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$function$;
-- Ouverte à anon comme les autres lectures de rôle : les règles de
-- finia_members l'appellent aussi pour un visiteur, qui doit recevoir « rien »
-- et non une erreur de droits. Sans session, elle renvoie null.
revoke execute on function public.finia_email_confirme() from public;
grant execute on function public.finia_email_confirme() to anon, authenticated;

create or replace function public.finia_is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.finia_workspaces w where w.id = ws and w.owner_id = auth.uid()
  ) or exists (
    select 1 from public.finia_members m
    where m.workspace_id = ws
      and m.status = 'active'
      and (m.user_id = auth.uid() or lower(m.email) = coalesce(public.finia_email_confirme(), ''))
  );
$function$;

create or replace function public.finia_role_of(ws uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when exists (select 1 from public.finia_workspaces w where w.id = ws and w.owner_id = auth.uid()) then 'owner'
    else (
      select m.role from public.finia_members m
      where m.workspace_id = ws and m.status = 'active'
        and (m.user_id = auth.uid() or lower(m.email) = coalesce(public.finia_email_confirme(), ''))
      order by case m.role when 'owner' then 0 when 'manager' then 1 when 'accountant' then 2 else 3 end
      limit 1
    )
  end;
$function$;

drop policy if exists finia_members_select on public.finia_members;
create policy finia_members_select on public.finia_members
  for select
  using (public.finia_is_member(workspace_id) or lower(email) = coalesce(public.finia_email_confirme(), ''));

drop policy if exists finia_members_self_accept on public.finia_members;
create policy finia_members_self_accept on public.finia_members
  for update
  using (lower(email) = coalesce(public.finia_email_confirme(), ''))
  with check (lower(email) = coalesce(public.finia_email_confirme(), ''));

-- 2. Quota de l'assistant -------------------------------------------------------

create or replace function public.finia_quota_assistant()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then return false; end if;
  return public.check_rate_limit('assistant-accounting:' || auth.uid()::text, 60, 3600);
end
$function$;
revoke execute on function public.finia_quota_assistant() from public, anon;
grant execute on function public.finia_quota_assistant() to authenticated;

-- 3. Jetons depuis le coffre ------------------------------------------------------

create or replace function public.lancer_accounting_rappels(p_mode text)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare jeton text;
begin
  jeton := public.app_secret('accounting_rappels');
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/accounting-rappels',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 120000
  );
end $function$;
revoke execute on function public.lancer_accounting_rappels(text) from public, anon, authenticated;

create or replace function public.lancer_finia_apprentissage()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare jeton text;
begin
  jeton := public.app_secret('finia_apprentissage');
  if jeton is null then return; end if;
  if not exists (select 1 from public.ia_apprentissage where traite_le is null) then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/finia-apprentissage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end $function$;
revoke execute on function public.lancer_finia_apprentissage() from public, anon, authenticated;
