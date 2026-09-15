-- Finjaro Accounting — socle du schéma finia_ (espaces, membres, journal d'événements).
--
-- Relevé de la production (bokwivwizghdlaedczbw) le 15/09/2026, en lecture seule,
-- et écrit pour être rejouable : chaque objet est créé « s'il n'existe pas »,
-- chaque fonction « ou remplacée », chaque politique retirée puis recréée à
-- l'identique. Rejouée sur la production, cette migration ne change rien.
-- Aucune suppression, aucun renommage, aucune colonne retirée.
--
-- Le projet de test qiyvoaljqmbfldephobp reçoit d'abord ce socle pour y rejouer
-- les scénarios de rôles et de simultanéité (docs/PROMPT-SIMULATION-METIERS.md).
-- Il partage l'auth.users du projet où il est appliqué : rien ici ne touche à
-- auth.users, aux fonctions edge ni au Site URL.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Espaces de travail
-- ---------------------------------------------------------------------------
create table if not exists public.finia_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Mon entreprise',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  snapshot_seq bigint not null default 0
);
alter table public.finia_workspaces add column if not exists snapshot_seq bigint not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'finia_workspaces_owner_unique') then
    alter table public.finia_workspaces add constraint finia_workspaces_owner_unique unique (owner_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Membres (invitations, rôles)
-- ---------------------------------------------------------------------------
create table if not exists public.finia_members (
  workspace_id uuid not null references public.finia_workspaces (id) on delete cascade,
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  role text not null default 'cashier' check (role in ('owner', 'manager', 'cashier', 'accountant')),
  display_name text,
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, email)
);
create index if not exists finia_members_email_idx on public.finia_members (lower(email));
create index if not exists finia_members_user_idx on public.finia_members (user_id);

-- ---------------------------------------------------------------------------
-- Journal d'événements (ajout seul)
-- ---------------------------------------------------------------------------
create sequence if not exists public.finia_events_seq_seq;
create table if not exists public.finia_events (
  id uuid primary key,
  workspace_id uuid not null references public.finia_workspaces (id) on delete cascade,
  seq bigint not null default nextval('public.finia_events_seq_seq'),
  actor_id uuid references auth.users (id),
  actor_name text not null default '',
  at timestamptz not null default now(),
  type text not null,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists finia_events_ws_seq_idx on public.finia_events (workspace_id, seq);

-- ---------------------------------------------------------------------------
-- Fonctions d'appartenance (SECURITY DEFINER : lisent les tables sans passer
-- par les politiques, pour éviter la récursion)
-- ---------------------------------------------------------------------------
create or replace function public.finia_is_owner(ws uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.finia_workspaces w where w.id = ws and w.owner_id = auth.uid());
$$;

create or replace function public.finia_is_member(ws uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.finia_workspaces w where w.id = ws and w.owner_id = auth.uid()
  ) or exists (
    select 1 from public.finia_members m
    where m.workspace_id = ws
      and m.status = 'active'
      and (m.user_id = auth.uid() or lower(m.email) = lower(coalesce(auth.email(), '')))
  );
$$;

-- Garde des membres : le propriétaire gère les membres de SON espace ; un
-- invité n'accepte que l'invitation qui lui est adressée, sans changer
-- d'espace, d'adresse ni de rôle (migration 20260915131114).
create or replace function public.finia_members_guard()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if public.finia_is_owner(old.workspace_id) and public.finia_is_owner(new.workspace_id) then
    return new;
  end if;
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
drop trigger if exists finia_members_guard on public.finia_members;
create trigger finia_members_guard before update on public.finia_members
  for each row execute function public.finia_members_guard();

-- ---------------------------------------------------------------------------
-- Règles d'accès
-- ---------------------------------------------------------------------------
alter table public.finia_workspaces enable row level security;
alter table public.finia_members enable row level security;
alter table public.finia_events enable row level security;

drop policy if exists finia_owner_select on public.finia_workspaces;
create policy finia_owner_select on public.finia_workspaces for select using (auth.uid() = owner_id);
drop policy if exists finia_member_select on public.finia_workspaces;
create policy finia_member_select on public.finia_workspaces for select using (public.finia_is_member(id));
drop policy if exists finia_owner_insert on public.finia_workspaces;
create policy finia_owner_insert on public.finia_workspaces for insert with check (auth.uid() = owner_id);
drop policy if exists finia_owner_update on public.finia_workspaces;
create policy finia_owner_update on public.finia_workspaces for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists finia_owner_delete on public.finia_workspaces;
create policy finia_owner_delete on public.finia_workspaces for delete using (auth.uid() = owner_id);

drop policy if exists finia_members_select on public.finia_members;
create policy finia_members_select on public.finia_members for select
  using (public.finia_is_member(workspace_id) or lower(email) = lower(coalesce(auth.email(), '')));
drop policy if exists finia_members_owner_insert on public.finia_members;
create policy finia_members_owner_insert on public.finia_members for insert with check (public.finia_is_owner(workspace_id));
drop policy if exists finia_members_owner_update on public.finia_members;
create policy finia_members_owner_update on public.finia_members for update using (public.finia_is_owner(workspace_id));
drop policy if exists finia_members_self_accept on public.finia_members;
create policy finia_members_self_accept on public.finia_members for update
  using (lower(email) = lower(coalesce(auth.email(), '')))
  with check (lower(email) = lower(coalesce(auth.email(), '')));
drop policy if exists finia_members_owner_delete on public.finia_members;
create policy finia_members_owner_delete on public.finia_members for delete using (public.finia_is_owner(workspace_id));

-- Journal : lecture par les membres, ajout par les membres, jamais de
-- modification ni de suppression (aucune politique UPDATE/DELETE).
drop policy if exists finia_events_select on public.finia_events;
create policy finia_events_select on public.finia_events for select using (public.finia_is_member(workspace_id));
drop policy if exists finia_events_insert on public.finia_events;
create policy finia_events_insert on public.finia_events for insert
  with check (public.finia_is_member(workspace_id) and actor_id = auth.uid());

-- Temps réel : les appareils s'abonnent aux insertions du journal.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'finia_events') then
    alter publication supabase_realtime add table public.finia_events;
  end if;
end $$;
