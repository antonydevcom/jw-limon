-- Migration: 0003_extend_core
-- Extends congregations with meeting schedule configuration.
-- Extends profiles with theme preference.
-- Adds schedule_periods: the versioned unit for every format type.

-- ---------------------------------------------------------------------------
-- Extend congregations
-- ---------------------------------------------------------------------------
alter table public.congregations
  add column if not exists midweek_day   smallint,   -- 0 = Sun … 6 = Sat (2 = Tue typical)
  add column if not exists midweek_time  time,
  add column if not exists weekend_day   smallint,   -- 0 = Sun typical
  add column if not exists weekend_time  time,
  add column if not exists settings      jsonb not null default '{}';

-- ---------------------------------------------------------------------------
-- Extend profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists theme_preference text
    check (theme_preference in ('system', 'light', 'dark'));

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'schedule_template_key') then
    create type public.schedule_template_key as enum (
      'midweek',
      'weekend',
      'readers',
      'duties',
      'cleaning',
      'hospitality'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'schedule_status') then
    create type public.schedule_status as enum ('draft', 'published', 'archived');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- schedule_periods
-- One row per format type per period (month or date range).
-- field_service has no periods — it is a fixed schedule edited in place.
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_periods (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  template_key     public.schedule_template_key not null,
  starts_on        date not null,
  ends_on          date not null,
  status           public.schedule_status not null default 'draft',
  published_at     timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint schedule_periods_range_check check (ends_on >= starts_on)
);

create index if not exists schedule_periods_congregation_key_starts_idx
  on public.schedule_periods (congregation_id, template_key, starts_on);

drop trigger if exists set_schedule_periods_updated_at on public.schedule_periods;
create trigger set_schedule_periods_updated_at
  before update on public.schedule_periods
  for each row execute function public.set_updated_at();

alter table public.schedule_periods enable row level security;

-- Admins see all periods (draft + published + archived).
drop policy if exists periods_select_admin on public.schedule_periods;
create policy periods_select_admin
  on public.schedule_periods
  for select
  to authenticated
  using (public.is_congregation_admin(congregation_id));

-- Viewers (non-admin members) see only published periods.
-- Both policies are ORed by Postgres; admins match the first, so this is additive.
drop policy if exists periods_select_viewer on public.schedule_periods;
create policy periods_select_viewer
  on public.schedule_periods
  for select
  to authenticated
  using (
    public.is_congregation_member(congregation_id)
    and status = 'published'
  );

drop policy if exists periods_insert_admin on public.schedule_periods;
create policy periods_insert_admin
  on public.schedule_periods
  for insert
  to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists periods_update_admin on public.schedule_periods;
create policy periods_update_admin
  on public.schedule_periods
  for update
  to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists periods_delete_admin on public.schedule_periods;
create policy periods_delete_admin
  on public.schedule_periods
  for delete
  to authenticated
  using (public.is_congregation_admin(congregation_id));
