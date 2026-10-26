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
2. In the project, go to **Project Settings → API**.
3. Copy `.env.example` to a new file named `.env.local`.
4. Paste the **Project URL** and the **anon public** key into `.env.local`.
5. Restart `npm run dev`. The setup check on the home page should turn green.

`.env.local` is in `.gitignore`, so the keys stay on your computer.
