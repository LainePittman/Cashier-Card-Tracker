import { formatTime } from '../lib/time'
import type { Application, Employee } from '../lib/types'

type Props = {
  applications: Application[] // today's, newest first
  employees: Employee[]
}

/**
 * Every entry today, including voided ones, newest first.
 * The digital version of the paper sheet: who, when, and what changed.
 */
export function ActivityLog({ applications, employees }: Props) {
  const nameOf = (id: string | null) =>
    employees.find((e) => e.id === id)?.display_name ?? 'Unknown'

  return (
    <details className="rounded-2xl bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4">
        <span className="font-semibold">Today's log</span>
        <span className="text-sm text-slate-500">
          {applications.length} {applications.length === 1 ? 'entry' : 'entries'}
        </span>
      </summary>

      {applications.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-500">Nothing logged yet today.</p>
      ) : (
        <ul className="divide-y divide-slate-100 px-4 pb-2">
          {applications.map((a) => {
            const loggedBySomeoneElse = a.entered_by_id && a.entered_by_id !== a.employee_id
            return (
              <li key={a.id} className={`py-2 text-sm ${a.voided ? 'text-slate-400' : ''}`}>
                <div className="flex justify-between gap-2">
                  <span className={a.voided ? 'line-through' : 'font-medium'}>
                    {nameOf(a.employee_id)}
                  </span>
                  <span className="tabular-nums">{formatTime(a.created_at)}</span>
                </div>
                <div className="flex flex-wrap gap-x-2 text-xs text-slate-500">
                  {loggedBySomeoneElse && <span>logged by {nameOf(a.entered_by_id)}</span>}
                  {a.edited_at && <span className="text-amber-700">edited by a Lead</span>}
                  {a.voided && (
                    <span className="text-red-600">
                      voided
                      {a.voided_by_employee_id && ` by ${nameOf(a.voided_by_employee_id)}`}
                      {a.void_reason && `: ${a.void_reason}`}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}
