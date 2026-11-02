import { useState, type FormEvent } from 'react'
import { addPastCard } from '../lib/leadActions'
import { todayAt, toStoreTimeValue } from '../lib/time'
import type { Employee } from '../lib/types'

type Props = {
  me: Employee // must be a Lead
  employees: Employee[]
  onClose: () => void
  onChanged: () => void
}

/** Lead-only form to log a card someone forgot, at the time it happened. */
export function AddPastCard({ me, employees, onClose, onChanged }: Props) {
  const activeEmployees = employees.filter((e) => e.active)
  const [forId, setForId] = useState(activeEmployees[0]?.id ?? '')
  const [time, setTime] = useState(() => toStoreTimeValue())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!forId || !time) return
    setBusy(true)
    setError(null)
    const message = await addPastCard(me.id, forId, todayAt(time))
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    onChanged()
    onClose()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">Add a card at an earlier time</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>

      <label htmlFor="past-for" className="mt-3 block text-sm font-medium text-slate-700">
        Who got it?
      </label>
      <select
        id="past-for"
        value={forId}
        onChange={(e) => setForId(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
      >
        {activeEmployees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.display_name}
          </option>
        ))}
      </select>

      <label htmlFor="past-time" className="mt-3 block text-sm font-medium text-slate-700">
        What time today?
      </label>
      <input
        id="past-time"
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
      />

      <button
        type="submit"
        disabled={busy || !forId || !time}
        className="mt-4 w-full rounded-xl bg-slate-900 py-3 font-medium text-white disabled:opacity-40"
      >
        {busy ? 'Adding…' : 'Add card'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  )
}
