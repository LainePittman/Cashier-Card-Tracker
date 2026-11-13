import type { ReactNode } from 'react'
import { Board } from './components/Board'
import { Header } from './components/Header'
import { NamePicker } from './components/NamePicker'
import { useBoard } from './hooks/useBoard'
import { useCurrentEmployee } from './hooks/useCurrentEmployee'
import { medalsForToday, type Medal } from './lib/medals'
import { isSupabaseConfigured } from './lib/supabase'
import type { Employee } from './lib/types'

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <Page>
        <p className="rounded-2xl bg-white p-4 shadow-sm">
          Supabase isn't set up yet. Add your keys to <code>.env.local</code> (see README).
        </p>
      </Page>
    )
  }
  return <TrackerScreen />
}

/** The page frame: banner on top, content in the middle, version in the corner. */
function Page({ me, myMedal, children }: { me?: Employee; myMedal?: Medal; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header me={me} myMedal={myMedal} />
      <main className="mx-auto max-w-md p-4 pb-10">{children}</main>
      <footer className="pointer-events-none fixed right-3 bottom-2 text-xs text-slate-400">
        v{__APP_VERSION__}
      </footer>
    </div>
  )
}

/** Decides which screen to show: loading, error, name picker, or the board. */
function TrackerScreen() {
  const { employees, applications, loading, error, reload } = useBoard()
  const { employeeId, setEmployeeId } = useCurrentEmployee()

  if (loading) {
    return (
      <Page>
        <p className="p-4 text-center text-slate-500">Loading…</p>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-red-600">Couldn't load the board</p>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white"
          >
            Try again
          </button>
        </div>
      </Page>
    )
  }

  // Only treat the saved name as valid if it still exists and isn't hidden.
  const me = employees.find((e) => e.id === employeeId && e.active)

  if (!me) {
    return (
      <Page>
        <NamePicker
          employees={employees}
          title="Who are you?"
          subtitle="Tap your name. This phone will remember it."
          onPick={(employee) => setEmployeeId(employee.id)}
        />
      </Page>
    )
  }

  const myMedal = medalsForToday(applications).get(me.id)

  return (
    <Page me={me} myMedal={myMedal}>
      <Board
        me={me}
        employees={employees}
        applications={applications}
        onSwitchUser={() => setEmployeeId(null)}
        onChanged={reload}
      />
    </Page>
  )
}
