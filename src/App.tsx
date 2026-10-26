import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 py-4 text-white">
        <h1 className="text-xl font-semibold">Card Tracker</h1>
        <p className="text-sm text-slate-300">Credit applications, live</p>
      </header>

      <main className="mx-auto max-w-md space-y-4 p-4">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Today's total
          </p>
          <p className="mt-1 text-6xl font-bold">0</p>
          <p className="mt-2 text-sm text-slate-500">
            The board goes here in step 4.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Setup check</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>✅ React + Vite + Tailwind are running</li>
            <li>
              {isSupabaseConfigured
                ? '✅ Supabase keys found in .env.local'
                : '⬜ Supabase keys not added yet (see README)'}
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
