-- Finjaro Accounting — e-mails aux utilisateurs (Beau, 29/09).
--
-- Additif : une fonction et deux tâches planifiées, rien d'autre. Même schéma
-- que les tâches de la place de marché (lancer_legion_former) : la tâche lit
-- un jeton dans app_secrets et appelle la fonction edge accounting-rappels.
--
-- À poser À PART, jamais dans ce fichier (un secret commité reste dans
-- l'historique pour toujours) :
--   insert into public.app_secrets(name, value)
--   values ('accounting_rappels', encode(gen_random_bytes(32), 'hex'));
-- Et déployer la fonction avec verify_jwt = false (elle vérifie le jeton).
--
-- Horaires (UTC) : 18:00 = 19 h au Cameroun, 20 h à Paris ; la semaine part
-- le lundi à 08:00 UTC (9 h au Cameroun).

create or replace function public.lancer_accounting_rappels(p_mode text)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'accounting_rappels';
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/accounting-rappels',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 120000
  );
end $function$;
revoke execute on function public.lancer_accounting_rappels(text) from public, anon, authenticated;

select cron.schedule('accounting-rappel-soir', '0 18 * * *', $$select public.lancer_accounting_rappels('soir')$$);
select cron.schedule('accounting-nouvelles-semaine', '0 8 * * 1', $$select public.lancer_accounting_rappels('semaine')$$);
