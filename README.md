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

## Development vs. production

| | Production (live) | Development (testing) |
| --- | --- | --- |
| Code | `main` branch | a feature branch, e.g. `feature/leaderboard` |
| Database | live Supabase project | separate dev Supabase project with fake names (`supabase/seed_dev.sql`) |
| Where it runs | card-tracker...workers.dev | `npm run dev` on your computer (and optional Cloudflare preview builds) |

`.env.local` should point at the **dev** Supabase project. Production keys live only in Cloudflare's build variables.

**Workflow for a new feature**

1. `git checkout main && git pull`, then `git checkout -b feature/<name>`.
2. Build and test with `npm run dev` against the dev database.
3. Database changes go in a new numbered file in `supabase/migrations/`. Run it on dev first.
4. When it works: run `npm run build`, commit, push the branch, and merge it into `main` on GitHub (pull request).
5. Run the new migration on the **production** database, then let Cloudflare deploy `main`.

Run the database change on production *before* the code that depends on it goes live.

## Copyright

Copyright © 2026 Steven "Laine" Pittman. All rights reserved.

This source code is shared publicly for viewing only. No permission is granted to copy, modify, distribute, or use it, in whole or in part, without the author's prior written consent.
