import { useState } from 'react'
import { changeTime, moveCard, voidCard } from '../lib/leadActions'
import { formatTime, toStoreInputValue } from '../lib/time'
import type { Application, Employee } from '../lib/types'

type Props = {
  entry: Application
  me: Employee // must be a Lead
  employees: Employee[]
  onClose: () => void
  onChanged: () => void
}

/**
 * Lead-only panel for one card entry: change its time, move it to
 * someone else, or void it. Each action saves on its own button, so a
 * Lead can't change two things by accident.
 */
export function EntryEditor({ entry, me, employees, onClose, onChanged }: Props) {
  const [time, setTime] = useState(() => toStoreInputValue(entry.created_at))
  const [moveTo, setMoveTo] = useState(entry.employee_id)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const owner = employees.find((e) => e.id === entry.employee_id)
  const activeEmployees = employees.filter((e) => e.active)

  // Runs one action, then either shows its error or closes the panel.
  async function run(action: () => Promise<string | null>) {
    setBusy(true)
    setError(null)
    const message = await action()
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    onChanged()
    onClose()
  }

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Edit entry</h2>
          <p className="text-sm text-slate-500">
            {owner?.display_name ?? 'Unknown'} · {formatTime(entry.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {/* Change time */}
      <div className="mt-4">
        <label htmlFor="edit-time" className="text-sm font-medium text-slate-700">
          Time it happened
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="edit-time"
            type="datetime-local"
            value={time}
            max={toStoreInputValue()}
            onChange={(e) => setTime(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            disabled={busy || !time || time === toStoreInputValue(entry.created_at)}
            onClick={() => run(() => changeTime(me.id, entry.id, time))}
            className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {/* Move to another person */}
      <div className="mt-4">
        <label htmlFor="edit-move" className="text-sm font-medium text-slate-700">
          Whose card is it?
        </label>
        <div className="mt-1 flex gap-2">
          <select
            id="edit-move"
            value={moveTo}
            onChange={(e) => setMoveTo(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          >
            {activeEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.display_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || moveTo === entry.employee_id}
            onClick={() => run(() => moveCard(me.id, entry.id, moveTo))}
            className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Move
          </button>
        </div>
      </div>

      {/* Void */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <label htmlFor="edit-note" className="text-sm font-medium text-slate-700">
          Void this entry <span className="font-normal text-slate-500">(note optional)</span>
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="edit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. customer didn't finish"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => voidCard(me.id, entry.id, note))}
            className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Void
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  )
}
