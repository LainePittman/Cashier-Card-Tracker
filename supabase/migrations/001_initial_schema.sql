-- =====================================================================
-- Card Tracker: initial database setup
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
--
-- Proof-of-concept model: no employee sign-in. People tap their name.
-- Only managers sign in (email + password), and only managers listed in
-- the `managers` table can void entries or edit names.
--
-- No customer information is stored anywhere. An application row only
-- says: a card application was submitted, by whom, and when.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Everyone who can appear on the board.
create table public.employees (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null
               check (char_length(display_name) between 1 and 40),
  active       boolean not null default true,   -- false = hidden from the name picker
  created_at   timestamptz not null default now()
);

-- "Jordan", "jordan", and " Jordan " count as the same name.
create unique index employees_display_name_unique
  on public.employees (lower(display_name));

-- Sign-in accounts that have manager powers.
create table public.managers (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One row per credit card application.
create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees (id),  -- who gets credit
  entered_by_id uuid references public.employees (id),           -- whose phone logged it
  created_at    timestamptz not null default now(),              -- set by the server only
  voided        boolean not null default false,
  voided_at     timestamptz,
  voided_by     uuid references auth.users (id),  -- the manager; null for a 2-minute undo
  void_reason   text,
  constraint void_fields_consistent check (
    (voided and voided_at is not null and void_reason is not null)
    or (not voided and voided_at is null and voided_by is null and void_reason is null)
  )
);

create index applications_created_at_idx on public.applications (created_at desc);
create index applications_employee_id_idx on public.applications (employee_id);


-- ---------------------------------------------------------------------
-- Clean up names before they're saved: trim and collapse extra spaces.
-- ---------------------------------------------------------------------

create function public.tidy_employee_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.display_name := regexp_replace(btrim(new.display_name), '\s+', ' ', 'g');
  return new;
end;
$$;

create trigger employees_tidy_name
  before insert or update of display_name on public.employees
  for each row execute function public.tidy_employee_name();


-- ---------------------------------------------------------------------
-- New entries must be for an active person.
-- ---------------------------------------------------------------------

create function public.check_application_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.employees where id = new.employee_id and active
  ) then
    raise exception 'That name is not active on the board';
  end if;
  return new;
end;
$$;

create trigger applications_check_insert
  before insert on public.applications
  for each row execute function public.check_application_insert();


-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

-- True when the signed-in user is listed as a manager.
create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.managers where user_id = (select auth.uid())
  );
$$;

-- Today's entries, where "today" is the store day in Central time.
create view public.applications_today
with (security_invoker = on) as
  select *
  from public.applications
  where (created_at at time zone 'America/Chicago')::date
      = (now()      at time zone 'America/Chicago')::date;


-- ---------------------------------------------------------------------
-- Actions the app calls
-- ---------------------------------------------------------------------

-- Anyone: undo an entry within 2 minutes of logging it (for mis-taps).
create function public.undo_application(app_id uuid)
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
     and created_at > now() - interval '2 minutes';

  if not found then
    raise exception 'This entry can no longer be undone';
  end if;
end;
$$;

-- Managers only: void any entry, with a reason.
create function public.void_application(app_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_manager() then
    raise exception 'Only managers can void entries';
  end if;

  if reason is null or btrim(reason) = '' then
    raise exception 'A reason is required';
  end if;

  update public.applications
     set voided = true,
         voided_at = now(),
         voided_by = (select auth.uid()),
         void_reason = btrim(reason)
   where id = app_id
     and not voided;

  if not found then
    raise exception 'Entry not found or already voided';
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- Permissions
-- `anon` = the public app (no sign-in). `authenticated` = a signed-in user.
-- Start from nothing, then grant only what each needs.
-- ---------------------------------------------------------------------

revoke all on public.employees, public.managers, public.applications,
              public.applications_today
  from anon, authenticated;

revoke all on function public.tidy_employee_name(),
                       public.check_application_insert(),
                       public.is_manager(),
                       public.undo_application(uuid),
                       public.void_application(uuid, text)
  from public, anon, authenticated;

-- Everyone can read the board and add names and entries.
grant select on public.employees, public.applications, public.applications_today
  to anon, authenticated;
grant insert (display_name) on public.employees to anon, authenticated;
grant insert (employee_id, entered_by_id) on public.applications to anon, authenticated;
grant execute on function public.undo_application(uuid) to anon, authenticated;

-- Signed-in users: managers check their own status, rename/hide names, void.
grant select on public.managers to authenticated;
grant update (display_name, active) on public.employees to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.void_application(uuid, text) to authenticated;


-- ---------------------------------------------------------------------
-- Row level security: the final say on which rows each role can touch.
-- ---------------------------------------------------------------------

alter table public.employees    enable row level security;
alter table public.managers     enable row level security;
alter table public.applications enable row level security;

create policy "Anyone can read names"
  on public.employees for select to anon, authenticated using (true);

create policy "Anyone can add a name"
  on public.employees for insert to anon, authenticated with check (true);

create policy "Managers can edit names"
  on public.employees for update to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

create policy "Anyone can read entries"
  on public.applications for select to anon, authenticated using (true);

create policy "Anyone can log an entry"
  on public.applications for insert to anon, authenticated with check (true);

create policy "Managers can see their own manager row"
  on public.managers for select to authenticated
  using (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- Live updates: push changes to every open board.
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.employees, public.applications;


-- ---------------------------------------------------------------------
-- After running this file: make yourself a manager.
-- 1. Authentication -> Users -> Add user -> Create new user
--    (your email + a password, tick "Auto Confirm User").
-- 2. Run this in a new SQL query, with your email:
--
--    insert into public.managers (user_id)
--    select id from auth.users where email = 'you@example.com';
-- ---------------------------------------------------------------------
