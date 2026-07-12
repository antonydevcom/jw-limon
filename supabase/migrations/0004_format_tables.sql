-- Migration: 0004_format_tables
-- All format tables use free-text name fields (no FK to a members table).
-- RLS: any congregation member can SELECT; only admins can INSERT/UPDATE/DELETE.
-- EBC conductor → assigned_name on midweek_parts; EBC reader → assistant_name.
-- Acomodadores OBSERVACIONES are stored on schedule_periods.notes for that period.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'midweek_section') then
    create type public.midweek_section as enum ('treasures', 'ministry', 'living');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reader_type') then
    create type public.reader_type as enum (
      'watchtower_study',
      'congregation_bible_study'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'time_slot') then
    create type public.time_slot as enum ('morning', 'afternoon');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Helper: reusable RLS policy creator for format tables
-- (Postgres does not allow parameterized DDL; we repeat the pattern per table)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- midweek_meetings — one row per meeting date (Tuesday)
-- ---------------------------------------------------------------------------
create table if not exists public.midweek_meetings (
  id                   uuid primary key default gen_random_uuid(),
  congregation_id      uuid not null references public.congregations (id) on delete cascade,
  period_id            uuid not null references public.schedule_periods (id) on delete cascade,
  meeting_date         date not null,
  status               public.schedule_status not null default 'draft',
  is_canceled          boolean not null default false,
  chairman_name        text,
  opening_song         text,
  opening_prayer_name  text,
  mid_song             text,
  closing_song         text,
  closing_prayer_name  text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (congregation_id, meeting_date)
);

drop trigger if exists set_midweek_meetings_updated_at on public.midweek_meetings;
create trigger set_midweek_meetings_updated_at
  before update on public.midweek_meetings
  for each row execute function public.set_updated_at();

alter table public.midweek_meetings enable row level security;

drop policy if exists midweek_meetings_select on public.midweek_meetings;
create policy midweek_meetings_select on public.midweek_meetings
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists midweek_meetings_insert on public.midweek_meetings;
create policy midweek_meetings_insert on public.midweek_meetings
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists midweek_meetings_update on public.midweek_meetings;
create policy midweek_meetings_update on public.midweek_meetings
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists midweek_meetings_delete on public.midweek_meetings;
create policy midweek_meetings_delete on public.midweek_meetings
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- midweek_parts — parts within a meeting (Tesoros / Ministerio / NVC)
-- sort_order is scoped per section (1, 2, 3 within each section).
-- For EBC: assigned_name = conductor, assistant_name = reader.
-- ---------------------------------------------------------------------------
create table if not exists public.midweek_parts (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  meeting_id       uuid not null references public.midweek_meetings (id) on delete cascade,
  section          public.midweek_section not null,
  sort_order       smallint not null,
  title            text,
  duration_minutes smallint,
  assigned_name    text,
  assistant_name   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists midweek_parts_meeting_section_idx
  on public.midweek_parts (meeting_id, section, sort_order);

drop trigger if exists set_midweek_parts_updated_at on public.midweek_parts;
create trigger set_midweek_parts_updated_at
  before update on public.midweek_parts
  for each row execute function public.set_updated_at();

alter table public.midweek_parts enable row level security;

drop policy if exists midweek_parts_select on public.midweek_parts;
create policy midweek_parts_select on public.midweek_parts
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists midweek_parts_insert on public.midweek_parts;
create policy midweek_parts_insert on public.midweek_parts
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists midweek_parts_update on public.midweek_parts;
create policy midweek_parts_update on public.midweek_parts
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists midweek_parts_delete on public.midweek_parts;
create policy midweek_parts_delete on public.midweek_parts
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- weekend_meetings — one row per Sunday
-- ---------------------------------------------------------------------------
create table if not exists public.weekend_meetings (
  id                      uuid primary key default gen_random_uuid(),
  congregation_id         uuid not null references public.congregations (id) on delete cascade,
  period_id               uuid not null references public.schedule_periods (id) on delete cascade,
  meeting_date            date not null,
  status                  public.schedule_status not null default 'draft',
  is_special_event        boolean not null default false,
  chairman_name           text,
  opening_prayer_name     text,
  speaker_name            text,
  speaker_congregation    text,
  outline_title           text,
  song_number             text,
  wt_reader_name          text,
  wt_conductor_name       text,
  hospitality_group_name  text,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (congregation_id, meeting_date)
);

drop trigger if exists set_weekend_meetings_updated_at on public.weekend_meetings;
create trigger set_weekend_meetings_updated_at
  before update on public.weekend_meetings
  for each row execute function public.set_updated_at();

alter table public.weekend_meetings enable row level security;

drop policy if exists weekend_meetings_select on public.weekend_meetings;
create policy weekend_meetings_select on public.weekend_meetings
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists weekend_meetings_insert on public.weekend_meetings;
create policy weekend_meetings_insert on public.weekend_meetings
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists weekend_meetings_update on public.weekend_meetings;
create policy weekend_meetings_update on public.weekend_meetings
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists weekend_meetings_delete on public.weekend_meetings;
create policy weekend_meetings_delete on public.weekend_meetings
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- reader_assignments — lectores for Atalaya (Sunday) and EBC (Tuesday)
-- ---------------------------------------------------------------------------
create table if not exists public.reader_assignments (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  period_id        uuid not null references public.schedule_periods (id) on delete cascade,
  meeting_date     date not null,
  reader_type      public.reader_type not null,
  reader_name      text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (congregation_id, meeting_date, reader_type)
);

drop trigger if exists set_reader_assignments_updated_at on public.reader_assignments;
create trigger set_reader_assignments_updated_at
  before update on public.reader_assignments
  for each row execute function public.set_updated_at();

alter table public.reader_assignments enable row level security;

drop policy if exists reader_assignments_select on public.reader_assignments;
create policy reader_assignments_select on public.reader_assignments
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists reader_assignments_insert on public.reader_assignments;
create policy reader_assignments_insert on public.reader_assignments
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists reader_assignments_update on public.reader_assignments;
create policy reader_assignments_update on public.reader_assignments
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists reader_assignments_delete on public.reader_assignments;
create policy reader_assignments_delete on public.reader_assignments
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- duty_assignments — acomodadores y micrófonos (Sunday + Tuesday)
-- OBSERVACIONES for the month go on schedule_periods.notes.
-- ---------------------------------------------------------------------------
create table if not exists public.duty_assignments (
  id                  uuid primary key default gen_random_uuid(),
  congregation_id     uuid not null references public.congregations (id) on delete cascade,
  period_id           uuid not null references public.schedule_periods (id) on delete cascade,
  meeting_date        date not null,
  entrance_name       text,
  auditorium_name     text,
  microphone_1_name   text,
  microphone_2_name   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (congregation_id, meeting_date)
);

drop trigger if exists set_duty_assignments_updated_at on public.duty_assignments;
create trigger set_duty_assignments_updated_at
  before update on public.duty_assignments
  for each row execute function public.set_updated_at();

alter table public.duty_assignments enable row level security;

drop policy if exists duty_assignments_select on public.duty_assignments;
create policy duty_assignments_select on public.duty_assignments
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists duty_assignments_insert on public.duty_assignments;
create policy duty_assignments_insert on public.duty_assignments
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists duty_assignments_update on public.duty_assignments;
create policy duty_assignments_update on public.duty_assignments
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists duty_assignments_delete on public.duty_assignments;
create policy duty_assignments_delete on public.duty_assignments
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- cleaning_assignments — limpieza (Sunday + Tuesday)
-- ---------------------------------------------------------------------------
create table if not exists public.cleaning_assignments (
  id                   uuid primary key default gen_random_uuid(),
  congregation_id      uuid not null references public.congregations (id) on delete cascade,
  period_id            uuid not null references public.schedule_periods (id) on delete cascade,
  service_date         date not null,
  cleaning_group_name  text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (congregation_id, service_date)
);

drop trigger if exists set_cleaning_assignments_updated_at on public.cleaning_assignments;
create trigger set_cleaning_assignments_updated_at
  before update on public.cleaning_assignments
  for each row execute function public.set_updated_at();

alter table public.cleaning_assignments enable row level security;

drop policy if exists cleaning_assignments_select on public.cleaning_assignments;
create policy cleaning_assignments_select on public.cleaning_assignments
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists cleaning_assignments_insert on public.cleaning_assignments;
create policy cleaning_assignments_insert on public.cleaning_assignments
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists cleaning_assignments_update on public.cleaning_assignments;
create policy cleaning_assignments_update on public.cleaning_assignments
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists cleaning_assignments_delete on public.cleaning_assignments;
create policy cleaning_assignments_delete on public.cleaning_assignments
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- hospitality_assignments — hospitalidad (Sundays only)
-- ---------------------------------------------------------------------------
create table if not exists public.hospitality_assignments (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  period_id        uuid not null references public.schedule_periods (id) on delete cascade,
  meeting_date     date not null,
  group_name       text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (congregation_id, meeting_date)
);

drop trigger if exists set_hospitality_assignments_updated_at on public.hospitality_assignments;
create trigger set_hospitality_assignments_updated_at
  before update on public.hospitality_assignments
  for each row execute function public.set_updated_at();

alter table public.hospitality_assignments enable row level security;

drop policy if exists hospitality_assignments_select on public.hospitality_assignments;
create policy hospitality_assignments_select on public.hospitality_assignments
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists hospitality_assignments_insert on public.hospitality_assignments;
create policy hospitality_assignments_insert on public.hospitality_assignments
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists hospitality_assignments_update on public.hospitality_assignments;
create policy hospitality_assignments_update on public.hospitality_assignments
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists hospitality_assignments_delete on public.hospitality_assignments;
create policy hospitality_assignments_delete on public.hospitality_assignments
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));

-- ---------------------------------------------------------------------------
-- field_service_schedule — fixed format, no periods
-- weekday: 0 = Sunday … 6 = Saturday
-- Rows present = active slots; missing rows = no meeting that day/slot.
-- ---------------------------------------------------------------------------
create table if not exists public.field_service_schedule (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6),
  time_slot        public.time_slot not null,
  starts_at        time,
  location         text,
  captain_name     text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (congregation_id, weekday, time_slot)
);

drop trigger if exists set_field_service_updated_at on public.field_service_schedule;
create trigger set_field_service_updated_at
  before update on public.field_service_schedule
  for each row execute function public.set_updated_at();

alter table public.field_service_schedule enable row level security;

drop policy if exists field_service_select on public.field_service_schedule;
create policy field_service_select on public.field_service_schedule
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists field_service_insert on public.field_service_schedule;
create policy field_service_insert on public.field_service_schedule
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists field_service_update on public.field_service_schedule;
create policy field_service_update on public.field_service_schedule
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists field_service_delete on public.field_service_schedule;
create policy field_service_delete on public.field_service_schedule
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));
