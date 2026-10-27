import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Employee } from '../lib/types'

type Props = {
  employees: Employee[]
  title: string
  subtitle?: string
  onPick: (employee: Employee) => void
  onCancel?: () => void
}

/**
 * A list of names to tap, plus a box to add a new one.
 * Used twice: "Who are you?" on first open, and "Log for someone else".
 */
export function NamePicker({ employees, title, subtitle, onPick, onCancel }: Props) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = employees.filter((e) => e.active)

  async function addName(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page on submit
    const name = newName.trim()
    if (!name || !supabase) return

    setSaving(true)
    setError(null)

    // Insert the row and ask Supabase to send it back (so we get its id).
    const { data, error } = await supabase
      .from('employees')
      .insert({ display_name: name })
      .select('id, display_name, active, created_at')
      .single()

    setSaving(false)

    if (error) {
      // 23505 is Postgres's code for "unique rule broken": the name exists.
      setError(
        error.code === '23505'
          ? 'That name is already on the list. Tap it above.'
          : `Couldn't add the name: ${error.message}`,
      )
      return
    }

    setNewName('')
    onPick(data as Employee)
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
      </div>

      {active.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {active.map((employee) => (
            <li key={employee.id}>
              <button
                type="button"
                onClick={() => onPick(employee)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left font-medium hover:border-slate-400 active:bg-slate-100"
              >
                {employee.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No names yet. Add the first one below.</p>
      )}

      <form onSubmit={addName} className="mt-4 border-t border-slate-100 pt-4">
        <label htmlFor="new-name" className="text-sm font-medium text-slate-700">
          Not on the list?
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="First name and last initial"
            maxLength={40}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </section>
  )
}
