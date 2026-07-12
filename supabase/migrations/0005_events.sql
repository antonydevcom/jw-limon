-- Migration: 0005_events
-- congregation_events: event announcements visible to all members, writable by admins only.

create table if not exists public.congregation_events (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations (id) on delete cascade,
  event_date       date not null,
  title            text not null,
  description      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists congregation_events_date_idx
  on public.congregation_events (congregation_id, event_date);

drop trigger if exists set_congregation_events_updated_at on public.congregation_events;
create trigger set_congregation_events_updated_at
  before update on public.congregation_events
  for each row execute function public.set_updated_at();

alter table public.congregation_events enable row level security;

drop policy if exists congregation_events_select on public.congregation_events;
create policy congregation_events_select on public.congregation_events
  for select to authenticated
  using (public.is_congregation_member(congregation_id));

drop policy if exists congregation_events_insert on public.congregation_events;
create policy congregation_events_insert on public.congregation_events
  for insert to authenticated
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists congregation_events_update on public.congregation_events;
create policy congregation_events_update on public.congregation_events
  for update to authenticated
  using (public.is_congregation_admin(congregation_id))
  with check (public.is_congregation_admin(congregation_id));

drop policy if exists congregation_events_delete on public.congregation_events;
create policy congregation_events_delete on public.congregation_events
  for delete to authenticated
  using (public.is_congregation_admin(congregation_id));
