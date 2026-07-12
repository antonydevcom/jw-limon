-- Migration: restrict draft schedule reads to admins.
-- Viewer access now follows the parent schedule_period RLS policy, which only
-- exposes published periods. This closes direct Data API reads of draft rows.

create index if not exists midweek_meetings_period_id_idx on public.midweek_meetings (period_id);
create index if not exists weekend_meetings_period_id_idx on public.weekend_meetings (period_id);
create index if not exists reader_assignments_period_id_idx on public.reader_assignments (period_id);
create index if not exists duty_assignments_period_id_idx on public.duty_assignments (period_id);
create index if not exists cleaning_assignments_period_id_idx on public.cleaning_assignments (period_id);
create index if not exists hospitality_assignments_period_id_idx on public.hospitality_assignments (period_id);
create index if not exists midweek_parts_meeting_id_idx on public.midweek_parts (meeting_id);

-- Abort before DDL when legacy duplicates exist. Automatic deletion would risk
-- losing assignments; deployment operator must inspect and merge intentionally.
do $$
begin
  if exists (
    select 1
    from public.schedule_periods
    group by congregation_id, template_key, starts_on
    having count(*) > 1
  ) then
    raise exception 'Duplicate schedule periods block migration 0007.'
      using hint = 'Run: select congregation_id, template_key, starts_on, array_agg(id) from public.schedule_periods group by 1,2,3 having count(*) > 1; Merge duplicates, then rerun migration.';
  end if;

  if exists (
    select 1
    from public.midweek_parts
    group by meeting_id, section, sort_order
    having count(*) > 1
  ) then
    raise exception 'Duplicate midweek parts block migration 0007.'
      using hint = 'Run: select meeting_id, section, sort_order, array_agg(id) from public.midweek_parts group by 1,2,3 having count(*) > 1; Merge duplicates, then rerun migration.';
  end if;
end
$$;

-- Abort on legacy cross-congregation references. Constraints become validated
-- only after this audit passes; no mismatched record is hidden or preserved.
do $$
begin
  if exists (
    select 1 from public.midweek_meetings c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.weekend_meetings c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.reader_assignments c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.duty_assignments c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.cleaning_assignments c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.hospitality_assignments c join public.schedule_periods p on p.id = c.period_id where p.congregation_id <> c.congregation_id
  ) or exists (
    select 1 from public.midweek_parts c join public.midweek_meetings m on m.id = c.meeting_id where m.congregation_id <> c.congregation_id
  ) then
    raise exception 'Cross-congregation schedule references block migration 0007.'
      using hint = 'Audit child period_id/meeting_id values against parent congregation_id, repair mismatches, then rerun migration.';
  end if;
end
$$;

-- One format instance per congregation/template/month. Prevents double-submit
-- races and gives period selection deterministic semantics.
create unique index if not exists schedule_periods_congregation_template_start_uidx
  on public.schedule_periods (congregation_id, template_key, starts_on);

-- Composite keys prevent a child row from combining a period/meeting from one
-- congregation with the congregation_id of another. NOT VALID enforces new
-- writes immediately without locking deployment on legacy-row validation.
create unique index if not exists schedule_periods_id_congregation_uidx
  on public.schedule_periods (id, congregation_id);
create unique index if not exists midweek_meetings_id_congregation_uidx
  on public.midweek_meetings (id, congregation_id);
create unique index if not exists midweek_parts_meeting_section_order_uidx
  on public.midweek_parts (meeting_id, section, sort_order);

alter table public.midweek_meetings
  add constraint midweek_meetings_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.weekend_meetings
  add constraint weekend_meetings_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.reader_assignments
  add constraint reader_assignments_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.duty_assignments
  add constraint duty_assignments_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.cleaning_assignments
  add constraint cleaning_assignments_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.hospitality_assignments
  add constraint hospitality_assignments_period_congregation_fk
  foreign key (period_id, congregation_id)
  references public.schedule_periods (id, congregation_id) on delete cascade not valid;
alter table public.midweek_parts
  add constraint midweek_parts_meeting_congregation_fk
  foreign key (meeting_id, congregation_id)
  references public.midweek_meetings (id, congregation_id) on delete cascade not valid;

alter table public.midweek_meetings validate constraint midweek_meetings_period_congregation_fk;
alter table public.weekend_meetings validate constraint weekend_meetings_period_congregation_fk;
alter table public.reader_assignments validate constraint reader_assignments_period_congregation_fk;
alter table public.duty_assignments validate constraint duty_assignments_period_congregation_fk;
alter table public.cleaning_assignments validate constraint cleaning_assignments_period_congregation_fk;
alter table public.hospitality_assignments validate constraint hospitality_assignments_period_congregation_fk;
alter table public.midweek_parts validate constraint midweek_parts_meeting_congregation_fk;

drop policy if exists midweek_meetings_select on public.midweek_meetings;
create policy midweek_meetings_select on public.midweek_meetings
  for select to authenticated
  using (exists (
    select 1 from public.schedule_periods p
    where p.id = midweek_meetings.period_id
      and p.congregation_id = midweek_meetings.congregation_id
  ));

drop policy if exists midweek_parts_select on public.midweek_parts;
create policy midweek_parts_select on public.midweek_parts
  for select to authenticated
  using (exists (
    select 1
    from public.midweek_meetings m
    join public.schedule_periods p on p.id = m.period_id
    where m.id = midweek_parts.meeting_id
      and p.congregation_id = midweek_parts.congregation_id
  ));

drop policy if exists weekend_meetings_select on public.weekend_meetings;
create policy weekend_meetings_select on public.weekend_meetings
  for select to authenticated
  using (exists (select 1 from public.schedule_periods p where p.id = weekend_meetings.period_id and p.congregation_id = weekend_meetings.congregation_id));

drop policy if exists reader_assignments_select on public.reader_assignments;
create policy reader_assignments_select on public.reader_assignments
  for select to authenticated
  using (exists (select 1 from public.schedule_periods p where p.id = reader_assignments.period_id and p.congregation_id = reader_assignments.congregation_id));

drop policy if exists duty_assignments_select on public.duty_assignments;
create policy duty_assignments_select on public.duty_assignments
  for select to authenticated
  using (exists (select 1 from public.schedule_periods p where p.id = duty_assignments.period_id and p.congregation_id = duty_assignments.congregation_id));

drop policy if exists cleaning_assignments_select on public.cleaning_assignments;
create policy cleaning_assignments_select on public.cleaning_assignments
  for select to authenticated
  using (exists (select 1 from public.schedule_periods p where p.id = cleaning_assignments.period_id and p.congregation_id = cleaning_assignments.congregation_id));

drop policy if exists hospitality_assignments_select on public.hospitality_assignments;
create policy hospitality_assignments_select on public.hospitality_assignments
  for select to authenticated
  using (exists (select 1 from public.schedule_periods p where p.id = hospitality_assignments.period_id and p.congregation_id = hospitality_assignments.congregation_id));
