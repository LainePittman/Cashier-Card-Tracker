-- =====================================================================
-- DEV DATABASE ONLY: fake names for testing.
-- Run this in your *dev* Supabase project after migrations 001-003.
-- Never run it in production.
-- =====================================================================

insert into public.employees (display_name, role) values
  ('Test Lead A',   'lead'),
  ('Test Lead B',   'lead'),
  ('Test Member A', 'member'),
  ('Test Member B', 'member'),
  ('Test Member C', 'member')
on conflict (lower(display_name)) do update
  set role = excluded.role, active = true;
