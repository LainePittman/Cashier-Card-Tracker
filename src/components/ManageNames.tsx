import { useState, type FormEvent } from 'react'
import { addEmployee, setEmployeeActive } from '../lib/leadActions'
import type { Employee } from '../lib/types'

type Props = {
  me: Employee // must be a Lead
  employees: Employee[]
  onChanged: () => void
}

/**
 * Lead-only: add names, remove names, and restore removed names.
 * "Remove" hides a name from the list; their past cards stay in the history.
 * Roles are still set by Laine in Supabase.
 */
export function ManageNames({ me, employees, onChanged }: Props) {
  const [newName, setNewName] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const active = employees.filter((e) => e.active)
  const removed = employees.filter((e) => !e.active)

  // Runs one action, then shows what happened.
  async function run(action: () => Promise<string | null>, success: string) {
    setBusy(true)
    setMessage(null)
    const error = await action()
    setBusy(false)
    setConfirmingId(null)
    if (error) {
      setMessage({ text: error, isError: true })
      return
    }
    setMessage({ text: success, isError: false })
    onChanged()
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    await run(() => addEmployee(me.id, name), `Added ${name}.`)
    setNewName('')
  }

  return (
    <details className="rounded-2xl border-2 border-amber-300 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4">
        <span className="font-semibold">
          Manage names
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Lead
          </span>
        </span>
        <span className="text-sm text-slate-500">{active.length} on the list</span>
      </summary>

      <div className="space-y-4 px-4 pb-4">
        {/* Add */}
        <form onSubmit={add}>
          <label htmlFor="add-name" className="text-sm font-medium text-slate-700">
            Add a name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="add-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="First name and last initial"
              maxLength={40}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            New names are Team Members. Ask Laine to make someone a Lead.
          </p>
        </form>

        {message && (
          <p className={`text-sm ${message.isError ? 'text-red-600' : 'text-emerald-700'}`}>
            {message.text}
          </p>
        )}

        {/* Current names */}
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {active.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                {e.display_name}
                {e.role === 'lead' && (
                  <span className="ml-2 text-xs text-amber-700">Lead</span>
                )}
              </span>
              {e.id === me.id ? (
                <span className="text-xs text-slate-400">You</span>
              ) : confirmingId === e.id ? (
                <span className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => setEmployeeActive(me.id, e.id, false),
                        `Removed ${e.display_name}. Their past cards are kept.`,
                      )
                    }
                    className="rounded-lg bg-red-600 px-3 py-1 font-medium text-white disabled:opacity-40"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg px-3 py-1 text-slate-600"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(e.id)}
                  className="rounded-lg px-3 py-1 text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Removed names */}
        {removed.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-slate-600">
              Removed names ({removed.length})
            </summary>
            <ul className="mt-2 divide-y divide-slate-100">
              {removed.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm text-slate-500">
                  <span>{e.display_name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => setEmployeeActive(me.id, e.id, true), `Restored ${e.display_name}.`)
                    }
                    className="rounded-lg px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </details>
  )
}
