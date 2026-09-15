-- Rôles côté base pour le journal d'événements.
--
-- Ligne 8 du tableau docs/SIMULATION-DECISIONS.md : les rôles (propriétaire,
-- gérant, caissier, comptable) ne vivaient que dans les menus ; en base, tout
-- membre actif pouvait insérer n'importe quel type d'événement (vider
-- l'espace, clôturer, changer la devise ou un salaire). Vérifié sur le projet
-- de test (docs/SIMULATION-TEST-PROJET.md, scénario A).
--
-- Cette migration ajoute une fonction qui dit quel rôle peut émettre quel
-- type d'événement, et la met dans la règle d'insertion. La grille reprend
-- celle des menus (canAccess dans src/lib/collab.tsx) :
--   caissier   : vendre, caisse, clients, stock, achats, messages
--   comptable  : tout sauf réglages, équipe et remise à zéro
--   gérant, propriétaire : tout
-- Un type inconnu (ajouté plus tard dans l'application) reste réservé au
-- propriétaire et au gérant : mieux vaut un refus visible qu'une brèche.
--
-- Additive : rien de supprimé ni renommé. La politique est recréée à
-- l'identique plus la condition de rôle. Rejouable.

create or replace function public.finia_role_of(ws uuid)
returns text
language sql stable security definer
set search_path to 'public'
as $$
  select case
    when exists (select 1 from public.finia_workspaces w where w.id = ws and w.owner_id = auth.uid()) then 'owner'
    else (
      select m.role from public.finia_members m
      where m.workspace_id = ws and m.status = 'active'
        and (m.user_id = auth.uid() or lower(m.email) = lower(coalesce(auth.email(), '')))
      order by case m.role when 'owner' then 0 when 'manager' then 1 when 'accountant' then 2 else 3 end
      limit 1
    )
  end;
$$;

create or replace function public.finia_can_emit(ws uuid, event_type text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select case public.finia_role_of(ws)
    when 'owner' then true
    when 'manager' then true
    when 'accountant' then event_type not in ('company.update', 'workspace.reset', 'workspace.restore')
    when 'cashier' then event_type in (
      'sale.record', 'quote.confirm', 'session.open', 'session.close', 'debt.pay',
      'customer.save', 'customer.archive', 'supplier.save', 'supplier.archive',
      'product.save', 'product.archive', 'stock.adjust', 'purchase.record', 'purchase.receive',
      'message.post', 'project.assign'
    )
    else false
  end;
$$;

drop policy if exists finia_events_insert on public.finia_events;
create policy finia_events_insert on public.finia_events for insert
  with check (
    public.finia_is_member(workspace_id)
    and actor_id = auth.uid()
    and public.finia_can_emit(workspace_id, type)
  );
