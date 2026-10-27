import { Board } from './components/Board'
import { NamePicker } from './components/NamePicker'
import { useBoard } from './hooks/useBoard'
import { useCurrentEmployee } from './hooks/useCurrentEmployee'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 py-4 text-white">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold">Card Tracker</h1>
          <p className="text-sm text-slate-300">Credit applications, live</p>
        </div>
      </header>

      <main className="mx-auto max-w-md p-4">
        {isSupabaseConfigured ? (
          <TrackerScreen />
        ) : (
          <p className="rounded-2xl bg-white p-4 shadow-sm">
            Supabase isn't set up yet. Add your keys to <code>.env.local</code> (see README).
          </p>
        )}
      </main>
    </div>
  )
}

/** Decides which screen to show: loading, error, name picker, or the board. */
function TrackerScreen() {
  const { employees, applications, loading, error, reload } = useBoard()
  const { employeeId, setEmployeeId } = useCurrentEmployee()

  if (loading) {
    return <p className="p-4 text-center text-slate-500">Loading…</p>
  }

  if (error) {
    return (
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
    )
  }

  // Only treat the saved name as valid if it still exists and isn't hidden.
  const me = employees.find((e) => e.id === employeeId && e.active)

  if (!me) {
    return (
      <NamePicker
        employees={employees}
        title="Who are you?"
        subtitle="Tap your name. This phone will remember it."
        onPick={(employee) => {
          setEmployeeId(employee.id)
          reload() // make sure a just-added name is in the list
        }}
      />
    )
  }

  return (
    <Board
      me={me}
      employees={employees}
      applications={applications}
      onSwitchUser={() => setEmployeeId(null)}
      onChanged={reload}
    />
  )
}
