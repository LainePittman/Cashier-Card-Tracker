-- =====================================================================
-- Card Tracker: Team Member / Lead roles
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Run it once, after 001_initial_schema.sql.
--
-- Everyone is a Team Member by default. Names marked as Lead unlock:
--   - change an entry's time
--   - move an entry to another person
--   - add an entry at an earlier time
--   - void an entry (note optional)
--
-- There's no lead password (proof of concept): picking a Lead's name is
-- enough. Only you can mark someone as Lead, from the Supabase dashboard;
-- the app itself can't change anyone's role.
--
-- Every lead change is written to `application_changes`, so the original
-- time or person is never lost.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------

alter table public.employees
  add column role text not null default 'member'
  check (role in ('member', 'lead'));


-- ---------------------------------------------------------------------
-- Applications: separate "when the card happened" from "when it was tapped"
--   created_at = when the card happened (leads can change it)
--   logged_at  = when it was entered in the app (never changes; used for undo)
-- ---------------------------------------------------------------------

alter table public.applications add column logged_at timestamptz;
update public.applications set logged_at = created_at;
alter table public.applications
  alter column logged_at set not null,
  alter column logged_at set default now();

-- When a lead last changed the time or person (null = never edited).
alter table public.applications add column edited_at timestamptz;

-- Which name voided it (the old voided_by column is for manager logins).
alter table public.applications
  add column voided_by_employee_id uuid references public.employees (id);

-- The void note is optional now.
alter table public.applications drop constraint void_fields_consistent;
alter table public.applications add constraint void_fields_consistent check (
  (voided and voided_at is not null)
  or (not voided and voided_at is null and voided_by is null
      and voided_by_employee_id is null and void_reason is null)
);

-- The view was built with `select *`, so rebuild it to include new columns.
drop view public.applications_today;
create view public.applications_today
with (security_invoker = on) as
  select *
  from public.applications
  where (created_at at time zone 'America/Chicago')::date
      = (now()      at time zone 'America/Chicago')::date;

grant select on public.applications_today to anon, authenticated;


-- ---------------------------------------------------------------------
-- Change history
-- ---------------------------------------------------------------------

create table public.application_changes (
  id              bigint generated always as identity primary key,
  application_id  uuid not null references public.applications (id),
  changed_by_id   uuid not null references public.employees (id),
  action          text not null
                  check (action in ('added_past', 'time_changed', 'moved', 'voided')),
  old_value       text,
  new_value       text,
  note            text,
  changed_at      timestamptz not null default now()
);

create index application_changes_app_idx on public.application_changes (application_id);

alter table public.application_changes enable row level security;
revoke all on public.application_changes from anon, authenticated;
grant select on public.application_changes to anon, authenticated;
create policy "Anyone can read change history"
  on public.application_changes for select to anon, authenticated using (true);


-- ---------------------------------------------------------------------
-- Undo is only for mis-taps on the big button: entries tapped in the last
-- 2 minutes that a Lead hasn't added or edited. Leads fix the rest by voiding.
-- ---------------------------------------------------------------------

create or replace function public.undo_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications
     set voided = true,
         voided_at = now(),
         void_reason = 'Undone within 2 minutes'
   where id = app_id
     and not voided
     and logged_at > now() - interval '2 minutes'
     and created_at = logged_at   -- not added at a past time by a Lead
     and edited_at is null;       -- not changed by a Lead since

  if not found then
    raise exception 'This entry can no longer be undone';
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- Lead helpers
-- Times come in as Central-time wall clock text, like '2026-11-01T14:30',
-- so a phone set to the wrong time zone can't shift them.
-- ---------------------------------------------------------------------

create function public.require_lead(actor_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.employees
     where id = actor_id and active and role = 'lead'
  ) then
    raise exception 'Only Leads can do that';
  end if;
end;
$$;

create function public.parse_store_time(local_time text)
returns timestamptz
language plpgsql
volatile
set search_path = ''
as $$
declare
  t timestamptz;
begin
  t := (local_time::timestamp) at time zone 'America/Chicago';
  if t > now() + interval '1 minute' then
    raise exception 'That time is in the future';
  end if;
  return t;
exception
  when invalid_datetime_format or datetime_field_overflow then
    raise exception 'That time is not valid';
end;
$$;


-- ---------------------------------------------------------------------
-- Lead actions
-- ---------------------------------------------------------------------

-- Add a card that someone forgot to log, at the time it actually happened.
create function public.lead_add_application(
  actor_id uuid, for_employee_id uuid, at_local_time text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  at_time timestamptz := public.parse_store_time(at_local_time);
begin
  perform public.require_lead(actor_id);

  insert into public.applications (employee_id, entered_by_id, created_at)
  values (for_employee_id, actor_id, at_time)
  returning id into new_id;

  insert into public.application_changes
    (application_id, changed_by_id, action, new_value)
  values (new_id, actor_id, 'added_past', at_time::text);

  return new_id;
end;
$$;

-- Change when a card happened.
create function public.lead_change_time(
  actor_id uuid, app_id uuid, new_local_time text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_time timestamptz;
  new_time timestamptz := public.parse_store_time(new_local_time);
begin
  perform public.require_lead(actor_id);

  select created_at into old_time
    from public.applications
   where id = app_id and not voided
   for update;

  if not found then
    raise exception 'Entry not found or voided';
  end if;

  update public.applications
     set created_at = new_time, edited_at = now()
   where id = app_id;

  insert into public.application_changes
    (application_id, changed_by_id, action, old_value, new_value)
  values (app_id, actor_id, 'time_changed', old_time::text, new_time::text);
end;
$$;

-- Give a card to a different person.
create function public.lead_move_application(
  actor_id uuid, app_id uuid, to_employee_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_employee uuid;
begin
  perform public.require_lead(actor_id);

  if not exists (
    select 1 from public.employees where id = to_employee_id and active
  ) then
    raise exception 'That name is not active on the board';
  end if;

  select employee_id into old_employee
    from public.applications
   where id = app_id and not voided
   for update;

  if not found then
    raise exception 'Entry not found or voided';
  end if;

  if old_employee = to_employee_id then
    return; -- nothing to change
  end if;

  update public.applications
     set employee_id = to_employee_id, edited_at = now()
   where id = app_id;

  insert into public.application_changes
    (application_id, changed_by_id, action, old_value, new_value)
  values (app_id, actor_id, 'moved', old_employee::text, to_employee_id::text);
end;
$$;

-- Void a card. The note is optional.
create function public.lead_void_application(
  actor_id uuid, app_id uuid, note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_note text := nullif(btrim(coalesce(note, '')), '');
begin
  perform public.require_lead(actor_id);

  update public.applications
     set voided = true,
         voided_at = now(),
         voided_by_employee_id = actor_id,
         void_reason = clean_note
   where id = app_id and not voided;

  if not found then
    raise exception 'Entry not found or already voided';
  end if;

  insert into public.application_changes
    (application_id, changed_by_id, action, note)
  values (app_id, actor_id, 'voided', clean_note);
end;
$$;


-- ---------------------------------------------------------------------
-- Permissions for the new functions
-- ---------------------------------------------------------------------

revoke all on function public.require_lead(uuid),
                       public.parse_store_time(text),
                       public.lead_add_application(uuid, uuid, text),
                       public.lead_change_time(uuid, uuid, text),
                       public.lead_move_application(uuid, uuid, uuid),
                       public.lead_void_application(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.lead_add_application(uuid, uuid, text),
                          public.lead_change_time(uuid, uuid, text),
                          public.lead_move_application(uuid, uuid, uuid),
                          public.lead_void_application(uuid, uuid, text)
  to anon, authenticated;


-- ---------------------------------------------------------------------
-- After running this file: mark the Leads.
-- Table Editor -> employees -> double-click a person's `role` cell ->
-- type lead -> Save. Or, in a new SQL query:
--
--    update public.employees set role = 'lead' where display_name = 'Laine';
-- ---------------------------------------------------------------------
