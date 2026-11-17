import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Application, Employee } from '../lib/types'
import {
  countPerDay,
  getWeek,
  shortDate,
  storeToday,
  weekdayLabel,
  weekRangeLabel,
} from '../lib/week'
import { DAILY_GOAL } from './GoalProgress'
import { LineChart } from './LineChart'

type Row = Pick<Application, 'created_at' | 'employee_id'>

type Props = {
  me: Employee
  todaysApplications: Application[] // changes whenever the board updates live
  onBack: () => void
}

/** Two line charts for one Sunday–Saturday week: you, and the whole store. */
export function WeeklyStats({ me, todaysApplications, onBack }: Props) {
  const [offset, setOffset] = useState(0) // 0 = this week, -1 = last week...
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = storeToday()
  const week = useMemo(() => getWeek(offset, today), [offset, today])

  // Load the week's cards. Re-runs when the week changes, and when today's
  // board changes (so this week's charts stay live).
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    setLoading(true)

    supabase
      .from('applications')
      .select('created_at, employee_id')
      .eq('voided', false)
      .gte('created_at', week.queryFrom)
      .lt('created_at', week.queryTo)
      .then(({ data, error }) => {
        if (cancelled) return // the user already moved to another week
        if (error) setError(error.message)
        else {
          setRows(data as Row[])
          setError(null)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [week, todaysApplications])

  const mine = countPerDay(rows, week, today, me.id)
  const store = countPerDay(rows, week, today)
  const total = (vals: (number | null)[]) => vals.reduce<number>((sum, v) => sum + (v ?? 0), 0)

  const labels = week.days.map(weekdayLabel)
  const dates = week.days.map(shortDate)

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-medium text-slate-600">
        ← Back to the board
      </button>

      {/* Week picker */}
      <section className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          className="rounded-lg px-3 py-1 text-lg hover:bg-slate-100"
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-semibold">{weekRangeLabel(week)}</p>
          <p className="text-xs text-slate-500">
            {offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `${-offset} weeks ago`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset === 0}
          className="rounded-lg px-3 py-1 text-lg hover:bg-slate-100 disabled:opacity-30"
          aria-label="Next week"
        >
          →
        </button>
      </section>

      {error && <p className="text-sm text-red-600">Couldn't load the week: {error}</p>}

      <section className={`rounded-2xl bg-white p-4 shadow-sm ${loading ? 'opacity-60' : ''}`}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Your cards</h2>
          <p className="text-sm text-slate-500">
            <span className="text-lg font-bold text-slate-900">{total(mine)}</span> for the week
          </p>
        </div>
        <LineChart
          title={`${me.display_name}'s cards per day`}
          labels={labels}
          subLabels={dates}
          values={mine}
          color="#0ea5e9"
          goal={DAILY_GOAL}
        />
      </section>

      <section className={`rounded-2xl bg-white p-4 shadow-sm ${loading ? 'opacity-60' : ''}`}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Store cards</h2>
          <p className="text-sm text-slate-500">
            <span className="text-lg font-bold text-slate-900">{total(store)}</span> for the week
          </p>
        </div>
        <LineChart
          title="Store cards per day"
          labels={labels}
          subLabels={dates}
          values={store}
          color="#059669"
        />
      </section>

      <p className="text-center text-xs text-slate-400">
        Removed cards aren't counted. Weeks run Sunday to Saturday.
      </p>
    </div>
  )
}
