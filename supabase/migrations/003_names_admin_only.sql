-- =====================================================================
-- Card Tracker: only Laine adds names
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Run it once, after 002_lead_role.sql.
--
-- The app can no longer add names. Add them yourself in Supabase:
--   Table Editor -> employees -> Insert row, or in SQL:
--
--   insert into public.employees (display_name) values ('Jordan M'), ('Sam T');
-- =====================================================================

revoke insert on public.employees from anon, authenticated;

drop policy "Anyone can add a name" on public.employees;
