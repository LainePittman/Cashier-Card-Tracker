-- =====================================================================
-- Card Tracker: anyone can add a card at an earlier time today
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Run it once, after 003_names_admin_only.sql.
--   1. On the DEV project first, to test.
--   2. On the LIVE project before merging the app update (v0.3.0).
--
-- Adds add_earlier_application(), which any active employee can use.
-- The time must be earlier today (store time) and not in the future.
-- Each one is still recorded in application_changes as 'added_past',
-- so the log shows who added it.
--
-- The old Lead-only lead_add_application() is left in place so the app
-- version that's live right now keeps working until the update merges.
-- =====================================================================

create function public.add_earlier_application(
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
  if not exists (
    select 1 from public.employees where id = actor_id and active
  ) then
    raise exception 'Pick your name first';
  end if;

  if (at_time at time zone 'America/Chicago')::date
     <> (now() at time zone 'America/Chicago')::date then
    raise exception 'Cards can only be added for today';
  end if;

  insert into public.applications (employee_id, entered_by_id, created_at)
  values (for_employee_id, actor_id, at_time)
  returning id into new_id;

  insert into public.application_changes
    (application_id, changed_by_id, action, new_value)
  values (new_id, actor_id, 'added_past', at_time::text);

  return new_id;
end;
$$;

revoke all on function public.add_earlier_application(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.add_earlier_application(uuid, uuid, text)
  to anon, authenticated;
