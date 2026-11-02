import type { Employee } from '../lib/types'

type Props = {
  employees: Employee[]
  title: string
  subtitle?: string
  onPick: (employee: Employee) => void
  onCancel?: () => void
}

/**
 * A list of names to tap.
 * Used twice: "Who are you?" on first open, and "Log for someone else".
 * Names are added by Laine in Supabase; the app can't add them.
 */
export function NamePicker({ employees, title, subtitle, onPick, onCancel }: Props) {
  const active = employees.filter((e) => e.active)

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
        <p className="mt-3 text-sm text-slate-500">No names on the list yet.</p>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
        Don't see your name? Ask a Lead to have it added.
      </p>
    </section>
  )
}
