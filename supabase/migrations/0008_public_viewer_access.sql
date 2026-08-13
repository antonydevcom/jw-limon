-- Migration: grant anon (public viewer) read access to published schedule data.
-- Authenticated viewers already use app-level filtering; these policies enforce
-- the same restriction at the DB layer for unauthenticated requests.

-- Published schedule periods are public.
create policy schedule_periods_anon_select on public.schedule_periods
  for select to anon
  using (status = 'published');

-- Child tables: visible to anon only when the parent period is published.
create policy midweek_meetings_anon_select on public.midweek_meetings
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = midweek_meetings.period_id
      and p.congregation_id = midweek_meetings.congregation_id
      and p.status = 'published'
  ));

create policy midweek_parts_anon_select on public.midweek_parts
  for select to anon
  using (exists (
    select 1
    from public.midweek_meetings m
    join public.schedule_periods p on p.id = m.period_id
    where m.id = midweek_parts.meeting_id
      and p.congregation_id = midweek_parts.congregation_id
      and p.status = 'published'
  ));

create policy weekend_meetings_anon_select on public.weekend_meetings
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = weekend_meetings.period_id
      and p.congregation_id = weekend_meetings.congregation_id
      and p.status = 'published'
  ));

create policy reader_assignments_anon_select on public.reader_assignments
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = reader_assignments.period_id
      and p.congregation_id = reader_assignments.congregation_id
      and p.status = 'published'
  ));

create policy duty_assignments_anon_select on public.duty_assignments
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = duty_assignments.period_id
      and p.congregation_id = duty_assignments.congregation_id
      and p.status = 'published'
  ));

create policy cleaning_assignments_anon_select on public.cleaning_assignments
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = cleaning_assignments.period_id
      and p.congregation_id = cleaning_assignments.congregation_id
      and p.status = 'published'
  ));

create policy hospitality_assignments_anon_select on public.hospitality_assignments
  for select to anon
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = hospitality_assignments.period_id
      and p.congregation_id = hospitality_assignments.congregation_id
      and p.status = 'published'
  ));

-- Field service schedule and events are always visible to anon.
create policy field_service_anon_select on public.field_service_schedule
  for select to anon
  using (is_active = true);

create policy congregation_events_anon_select on public.congregation_events
  for select to anon
  using (true);
