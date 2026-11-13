import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MEDAL_EMOJI, MEDAL_LABEL, medalsForToday } from '../lib/medals'
import { formatTime, formatToday } from '../lib/time'
import type { Application, Employee } from '../lib/types'
import { ActivityLog } from './ActivityLog'
import { AddPastCard } from './AddPastCard'
import { EntryEditor } from './EntryEditor'
import { NamePicker } from './NamePicker'

const UNDO_WINDOW_MS = 2 * 60 * 1000 // must match the 2 minutes in the database

type Props = {
  me: Employee
  employees: Employee[]
  applications: Application[]
  onSwitchUser: () => void
  onChanged: () => void
}

type PendingUndo = {
  applicationId: string
  forName: string
  expiresAt: number
}

/** One person's column: their name and today's entries, newest first. */
type Column = {
  employee: Employee
  entries: Application[]
}

export function Board({ me, employees, applications, onSwitchUser, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickingSomeoneElse, setPickingSomeoneElse] = useState(false)
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingPast, setAddingPast] = useState(false)

  const isLead = me.role === 'lead'

  // The entry a Lead is editing, if it's still on today's board.
  const editingEntry = applications.find((a) => a.id === editingId && !a.voided) ?? null

  // Voided entries (undone, or voided by a Lead) don't count.
  const counted = useMemo(() => applications.filter((a) => !a.voided), [applications])

  // Build one column per person who has at least one card today.
  // useMemo means this only re-runs when the inputs actually change.
  const columns = useMemo<Column[]>(() => {
    const byId = new Map(employees.map((e) => [e.id, e]))
    const groups = new Map<string, Column>()

    for (const app of counted) {
      const employee = byId.get(app.employee_id)
      if (!employee) continue
      if (!groups.has(employee.id)) groups.set(employee.id, { employee, entries: [] })
      groups.get(employee.id)!.entries.push(app)
    }

    // Most cards first; ties broken alphabetically.
    return [...groups.values()].sort(
      (a, b) =>
        b.entries.length - a.entries.length ||
        a.employee.display_name.localeCompare(b.employee.display_name),
    )
  }, [employees, counted])

  // Gold, silver, bronze for today's top three (ties share a medal).
  const medals = useMemo(() => medalsForToday(applications), [applications])

  const myCount = columns.find((c) => c.employee.id === me.id)?.entries.length ?? 0

  // Tick once a second while an undo is available, for the countdown.
  useEffect(() => {
    if (!pendingUndo) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [pendingUndo])

  const undoSecondsLeft = pendingUndo
    ? Math.max(0, Math.ceil((pendingUndo.expiresAt - now) / 1000))
    : 0

  // Hide the undo bar once time runs out.
  useEffect(() => {
    if (pendingUndo && undoSecondsLeft === 0) setPendingUndo(null)
  }, [pendingUndo, undoSecondsLeft])

  async function logCard(forEmployee: Employee) {
    if (!supabase || busy) return
    setBusy(true)
    setError(null)

    const { data, error } = await supabase
      .from('applications')
      .insert({ employee_id: forEmployee.id, entered_by_id: me.id })
      .select('id')
      .single()

    setBusy(false)
    setPickingSomeoneElse(false)

    if (error) {
      setError(`Couldn't log the card: ${error.message}`)
      return
    }

    setPendingUndo({
      applicationId: data.id,
      forName: forEmployee.id === me.id ? 'you' : forEmployee.display_name,
      expiresAt: Date.now() + UNDO_WINDOW_MS,
    })
    setNow(Date.now())
    onChanged()
  }

  async function undo() {
    if (!supabase || !pendingUndo) return
    setBusy(true)
    const { error } = await supabase.rpc('undo_application', {
      app_id: pendingUndo.applicationId,
    })
    setBusy(false)
    setPendingUndo(null)
    if (error) setError(error.message)
    onChanged()
  }

  return (
    <div className="space-y-4">
      {/* Store total */}
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Store total · {formatToday()}
        </p>
        <p className="mt-1 text-7xl font-bold tabular-nums">{counted.length}</p>
        <p className="mt-1 text-sm text-slate-500">
          credit {counted.length === 1 ? 'application' : 'applications'} today
        </p>
      </section>

      {/* My big button */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <p>
            Logging as <span className="font-semibold">{me.display_name}</span>
            {isLead && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Lead
              </span>
            )}
          </p>
          <button type="button" onClick={onSwitchUser} className="text-slate-500 underline">
            Not you?
          </button>
        </div>

        <button
          type="button"
          onClick={() => logCard(me)}
          disabled={busy}
          className="mt-3 w-full rounded-2xl bg-emerald-600 py-6 text-2xl font-bold text-white shadow active:scale-[0.99] active:bg-emerald-700 disabled:opacity-50"
        >
          {myCount === 0 ? '+ Got my first card' : '+ Got a card'}
        </button>
        <p className="mt-2 text-center text-sm text-slate-500">
          You have {myCount} today
        </p>

        {pendingUndo && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
            <span>
              Logged for {pendingUndo.forName}. Undo ({undoSecondsLeft}s)?
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={busy}
              className="rounded-lg bg-white px-3 py-1 font-semibold text-slate-900"
            >
              Undo
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {!pickingSomeoneElse && (
          <button
            type="button"
            onClick={() => setPickingSomeoneElse(true)}
            className="mt-3 w-full rounded-xl border border-slate-300 py-2 text-sm font-medium text-slate-700"
          >
            Log a card for someone else
          </button>
        )}

        {!addingPast && (
          <button
            type="button"
            onClick={() => setAddingPast(true)}
            className="mt-2 w-full rounded-xl border border-slate-300 py-2 text-sm font-medium text-slate-700"
          >
            Add a card at an earlier time
          </button>
        )}
      </section>

      {addingPast && (
        <AddPastCard
          me={me}
          employees={employees}
          onClose={() => setAddingPast(false)}
          onChanged={onChanged}
        />
      )}

      {pickingSomeoneElse && (
        <NamePicker
          employees={employees.filter((e) => e.id !== me.id)}
          title="Who got the card?"
          subtitle={`It will show as logged by ${me.display_name}.`}
          onPick={logCard}
          onCancel={() => setPickingSomeoneElse(false)}
        />
      )}

      {/* One card per person, like the columns on the paper sheet */}
      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Today by person
        </h2>
        {isLead && columns.length > 0 && (
          <p className="px-1 text-xs text-slate-500">
            Lead: tap a time to change it, move it, or remove it.
          </p>
        )}
        {columns.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
            No cards yet today.
          </p>
        )}
        {columns.map(({ employee, entries }) => (
          <details
            key={employee.id}
            className="group rounded-2xl bg-white shadow-sm"
            open={employee.id === me.id || entries.some((e) => e.id === editingId)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between p-4">
              <span className="font-medium">
                {medals.has(employee.id) && (
                  <span
                    className="mr-1.5"
                    role="img"
                    aria-label={MEDAL_LABEL[medals.get(employee.id)!]}
                    title={MEDAL_LABEL[medals.get(employee.id)!]}
                  >
                    {MEDAL_EMOJI[medals.get(employee.id)!]}
                  </span>
                )}
                {employee.display_name}
                {employee.id === me.id && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                    You
                  </span>
                )}
              </span>
              <span className="text-2xl font-bold tabular-nums">{entries.length}</span>
            </summary>
            <ul className="flex flex-wrap gap-2 px-4 pb-4">
              {entries.map((entry) => {
                const label = (
                  <>
                    {formatTime(entry.created_at)}
                    {entry.edited_at && (
                      <span className="ml-1 text-amber-700" title="Edited by a Lead">
                        *
                      </span>
                    )}
                  </>
                )
                return (
                  <li key={entry.id}>
                    {isLead ? (
                      <button
                        type="button"
                        onClick={() => setEditingId(entry.id === editingId ? null : entry.id)}
                        className={`rounded-lg px-2 py-1 text-sm tabular-nums ${
                          entry.id === editingId
                            ? 'bg-amber-200'
                            : 'bg-slate-100 hover:bg-amber-100'
                        }`}
                      >
                        {label}
                      </button>
                    ) : (
                      <span className="block rounded-lg bg-slate-100 px-2 py-1 text-sm tabular-nums">
                        {label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {isLead && editingEntry && editingEntry.employee_id === employee.id && (
              <div className="px-2 pb-2">
                <EntryEditor
                  key={editingEntry.id}
                  entry={editingEntry}
                  me={me}
                  employees={employees}
                  onClose={() => setEditingId(null)}
                  onChanged={onChanged}
                />
              </div>
            )}
          </details>
        ))}
        {columns.some((c) => c.entries.some((e) => e.edited_at)) && (
          <p className="px-1 text-xs text-slate-500">* time or person changed by a Lead</p>
        )}
      </section>

      <ActivityLog applications={applications} employees={employees} />
    </div>
  )
}
