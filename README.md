# Cashier-Card-Tracker

Will be used for retail stores to have the ability of a live tracker for how many credit card applications are gotten throughout the day.

Records only that an application was submitted, by which employee, and when. No customer information is ever stored.

## Tech

- React + TypeScript, built with Vite
- Tailwind CSS for styling
- Supabase for the database, sign-in, and live updates

## Running it locally

You need [Node.js](https://nodejs.org) 22 LTS (or 20.19+). Check with `node -v`.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).
To try it on your phone, connect to the same Wi-Fi and open the "Network" address it prints.

## Connecting Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, click **Connect** at the top of the dashboard (or go to **Project Settings → API Keys**).
3. Copy `.env.example` to a new file named `.env.local`.
4. Paste the **Project URL** and the **publishable key** (starts with `sb_publishable_`) into `.env.local`.
5. Restart `npm run dev`. The setup check on the home page should turn green.

`.env.local` is in `.gitignore`, so the keys stay on your computer.
Never put the **secret** key in this app. It bypasses all database rules.

## Database setup

Run each file in `supabase/migrations/` once, in order, in Supabase → **SQL Editor** → **New query** → paste → **Run**.

| File | What it adds |
| --- | --- |
| `001_initial_schema.sql` | Names, card entries, the store-day view, base security rules |
| `002_lead_role.sql` | Team Member / Lead roles, Lead edit tools, change history |
| `003_names_admin_only.sql` | Only you can add names (from Supabase); the app can't |

## Roles

- **Team Member** (everyone by default): log cards for themselves or others, undo a mis-tap within 2 minutes.
- **Lead**: also change a card's time, move it to another person, add one at an earlier time, and remove it (note optional). Removed cards drop out of the totals but stay in today's log, crossed out.

Mark someone as a Lead in Supabase → **Table Editor → employees**: set their `role` cell to `lead`. The app itself can't change roles.

## Adding names

Names are added only from Supabase, not from the app. Either **Table Editor → employees → Insert row**, or in the SQL Editor:

```sql
insert into public.employees (display_name) values ('Jordan M'), ('Sam T');
```

To hide someone who left, set their `active` to `false`. Their past cards stay in the history.
