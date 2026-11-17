-- =====================================================================
-- Card Tracker: Leads can add and remove names
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Run it once, after 004_anyone_adds_earlier_cards.sql.
--   1. On the DEV project first, to test.
--   2. On the LIVE project before merging the app update (v0.6.0).
--
-- - Leads can add a name (always as a Team Member).
-- - Leads can remove a name. "Remove" hides it from the name list; the
--   person's past cards stay in the history. Leads can restore it.
-- - Leads can't remove themselves, and can't change anyone's role.
-- - Every add/remove/restore is recorded in employee_changes.
-- =====================================================================

create table public.employee_changes (
  id             bigint generated always as identity primary key,
  employee_id    uuid not null references public.employees (id),
  changed_by_id  uuid not null references public.employees (id),
  action         text not null check (action in ('added', 'removed', 'restored')),
  changed_at     timestamptz not null default now()
);

alter table public.employee_changes enable row level security;
revoke all on public.employee_changes from anon, authenticated;
grant select on public.employee_changes to anon, authenticated;
create policy "Anyone can read name history"
  on public.employee_changes for select to anon, authenticated using (true);

alter publication supabase_realtime add table public.employee_changes;


-- Add a name. If it already exists but was removed, restore it instead.
create function public.lead_add_employee(actor_id uuid, new_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := regexp_replace(btrim(coalesce(new_name, '')), '\s+', ' ', 'g');
  existing record;
  new_id uuid;
begin
  perform public.require_lead(actor_id);

  if char_length(clean) < 1 or char_length(clean) > 40 then
    raise exception 'Names must be 1 to 40 characters';
  end if;

  select id, active into existing
    from public.employees where lower(display_name) = lower(clean);

  if found then
    if existing.active then
      raise exception 'That name is already on the list';
    end if;
    update public.employees set active = true where id = existing.id;
    insert into public.employee_changes (employee_id, changed_by_id, action)
    values (existing.id, actor_id, 'restored');
    return existing.id;
  end if;

  insert into public.employees (display_name, role)
  values (clean, 'member')
  returning id into new_id;

  insert into public.employee_changes (employee_id, changed_by_id, action)
  values (new_id, actor_id, 'added');

  return new_id;
end;
$$;


-- Remove (hide) or restore a name.
create function public.lead_set_employee_active(
  actor_id uuid, target_id uuid, make_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_lead(actor_id);

  if target_id = actor_id and not make_active then
    raise exception 'You can''t remove yourself';
  end if;

  update public.employees
     set active = make_active
   where id = target_id and active is distinct from make_active;

  if not found then
    raise exception 'Name not found, or already %',
      case when make_active then 'on the list' else 'removed' end;
  end if;

  insert into public.employee_changes (employee_id, changed_by_id, action)
  values (target_id, actor_id, case when make_active then 'restored' else 'removed' end);
end;
$$;


revoke all on function public.lead_add_employee(uuid, text),
                       public.lead_set_employee_active(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.lead_add_employee(uuid, text),
                          public.lead_set_employee_active(uuid, uuid, boolean)
  to anon, authenticated;
