-- Migration: 0001_auth_foundation
-- Phase 1 foundation for Congregación El Limón.
-- Scope: auth roles, single-congregation data model, profiles linked to
-- auth.users, admin/viewer role model, RLS enabled and safe, no anonymous reads.
--
-- Design notes:
-- * Role lives on `congregation_memberships`, not on `profiles`. This keeps the
--   user-to-congregation link and its role in one row and preps multi-congregation
--   without reshaping data later. `docs/ARCHITECTURE.md` sketches role on
--   `profiles`; this migration intentionally deviates per the explicit foundation
--   requirement for a membership table.
-- * RLS helper functions are SECURITY DEFINER only where needed to avoid infinite
--   recursion on `congregation_memberships` policies. They read solely the current
--   user's own rows (via auth.uid()), have a pinned empty search_path, and are
--   granted to `authenticated` only.
-- * No seed data. Bootstrapping the first congregation + first admin membership is
--   a service-role/server-side operation (see comment at end).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'viewer');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Shared helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- congregations: single-congregation core (multi-congregation ready).
create table if not exists public.congregations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  display_name  text not null,
  short_name    text not null,
  accent_color  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- profiles: app user record, one-to-one with auth.users.
-- Role is NOT stored here; it lives on congregation_memberships.
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- congregation_memberships: links a user to a congregation with a role.
create table if not exists public.congregation_memberships (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             public.app_role not null default 'viewer',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (congregation_id, user_id)
);

create index if not exists congregation_memberships_user_id_idx
  on public.congregation_memberships (user_id);
create index if not exists congregation_memberships_congregation_id_idx
  on public.congregation_memberships (congregation_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists set_congregations_updated_at on public.congregations;
create trigger set_congregations_updated_at
  before update on public.congregations
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_congregation_memberships_updated_at on public.congregation_memberships;
create trigger set_congregation_memberships_updated_at
  before update on public.congregation_memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile when an auth user is created (invite flow).
-- Membership/role is assigned separately by an admin; this never grants a role.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- SECURITY DEFINER to bypass RLS on congregation_memberships and avoid recursive
-- policy evaluation. Each only inspects the current user's own membership rows.
-- ---------------------------------------------------------------------------

-- True if the current user has any membership in the target congregation.
create or replace function public.is_congregation_member(target_congregation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.congregation_memberships m
    where m.congregation_id = target_congregation_id
      and m.user_id = (select auth.uid())
  );
$$;

-- True if the current user is an admin in the target congregation.
create or replace function public.is_congregation_admin(target_congregation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.congregation_memberships m
    where m.congregation_id = target_congregation_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  );
$$;

-- True if the current user is an admin of some congregation the target user
-- also belongs to. Used so admins can read/manage co-members' profiles.
create or replace function public.is_admin_over_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.congregation_memberships me
    join public.congregation_memberships them
      on them.congregation_id = me.congregation_id
    where me.user_id = (select auth.uid())
      and me.role = 'admin'
      and them.user_id = target_user_id
  );
$$;

-- Least privilege: these helpers are only for authenticated policy checks.
revoke execute on function public.is_congregation_member(uuid) from public, anon;
revoke execute on function public.is_congregation_admin(uuid) from public, anon;
revoke execute on function public.is_admin_over_user(uuid) from public, anon;
grant execute on function public.is_congregation_member(uuid) to authenticated;
grant execute on function public.is_congregation_admin(uuid) to authenticated;
grant execute on function public.is_admin_over_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS (deny-by-default; anon has no policies -> reads nothing)
-- ---------------------------------------------------------------------------
alter table public.congregations enable row level security;
alter table public.profiles enable row level security;
alter table public.congregation_memberships enable row level security;

-- ---------------------------------------------------------------------------
-- Policies: congregations
-- ---------------------------------------------------------------------------
-- Members (admin or viewer) can read their own congregation.
drop policy if exists congregations_select_members on public.congregations;
create policy congregations_select_members
  on public.congregations
  for select
  to authenticated
  using (public.is_congregation_member(id));

-- Admins can update their own congregation.
drop policy if exists congregations_update_admin on public.congregations;
create policy congregations_update_admin
  on public.congregations
  for update
  to authenticated
  using (public.is_congregation_admin(id))
  with check (public.is_congregation_admin(id));

-- No INSERT/DELETE policies: congregation creation/removal is a service-role
-- (server-side) bootstrap operation only.

-- ---------------------------------------------------------------------------
-- Policies: profiles
-- ---------------------------------------------------------------------------
-- A user can read their own profile; an admin can read co-members' profiles.
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
  on public.profiles
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin_over_user(user_id)
  );

-- A user can insert only their own profile row (safety net; normally created by
-- the on_auth_user_created trigger).
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- A user can update only their own profile. Role is not here, so this cannot
-- escalate privileges.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Policies: congregation_memberships
-- ---------------------------------------------------------------------------
-- A user can read their own membership; admins can read all memberships in
-- their congregation.
drop policy if exists memberships_select_self_or_admin on public.congregation_memberships;
create policy memberships_select_self_or_admin
  on public.congregation_memberships
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_congregation_admin(congregation_id)
  );

-- Admins can add members to their congregation.
drop policy if exists memberships_insert_admin on public.congregation_memberships;
create policy memberships_insert_admin
  on public.congregation_memberships
  for insert
  to authenticated
  with check (public.is_congregation_admin(congregation_id));

-- Admins can update memberships in their congregation (e.g. change role).
drop policy if exists memberships_update_admin on public.congregation_memberships;
create policy memberships_update_admin
  on public.congregation_memberships
  for update
  to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

-- Admins can remove members from their congregation.
drop policy if exists memberships_delete_admin on public.congregation_memberships;
create policy memberships_delete_admin
  on public.congregation_memberships
  for delete
  to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- Bootstrapping (manual, service-role only — NOT executed here)
-- ---------------------------------------------------------------------------
-- The first congregation and first admin membership must be created with the
-- service-role key (bypasses RLS), because no admin exists yet to satisfy the
-- policies above. Example (run server-side only, replace placeholders):
--
--   insert into public.congregations (name, display_name, short_name)
--   values ('El Limon', 'Congregación El Limón', 'El Limón')
--   returning id;
--
--   insert into public.congregation_memberships (congregation_id, user_id, role)
--   values ('<congregation_id>', '<auth_user_id>', 'admin');
