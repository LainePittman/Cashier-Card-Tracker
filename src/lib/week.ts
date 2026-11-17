// Week math for the weekly stats screen. Weeks run Sunday through Saturday
// in store (Central) time. Dates are "YYYY-MM-DD" strings so time zones and
// daylight saving can't shift a card into the wrong day.

import { toStoreInputValue } from './time'

const DAY_MS = 24 * 60 * 60 * 1000

/** Today's date in store time: "2026-11-17". */
export function storeToday(): string {
  return toStoreInputValue().slice(0, 10)
}

/** The store date a timestamp falls on. */
export function storeDateOf(iso: string): string {
  return toStoreInputValue(iso).slice(0, 10)
}

// Date-only arithmetic, done at noon UTC so it never lands on a DST edge.
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay() // 0 = Sunday
}

export type Week = {
  days: string[] // the 7 dates, Sunday first
  /** Generous UTC range for the database query; exact days are filtered after. */
  queryFrom: string
  queryTo: string
}

/** offset 0 = this week, -1 = last week, and so on. */
export function getWeek(offset: number, today: string = storeToday()): Week {
  const sunday = addDays(today, -weekdayOf(today) + offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
  return {
    days,
    // A day of padding on each side covers the Central/UTC difference.
    queryFrom: `${addDays(sunday, -1)}T00:00:00Z`,
    queryTo: `${addDays(sunday, 8)}T00:00:00Z`,
  }
}

/** "Sun" */
export function weekdayLabel(date: string): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].at(weekdayOf(date)) ?? ''
}

/** "11/15" */
export function shortDate(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`
}

/** "Nov 15 – Nov 21" */
export function weekRangeLabel(week: Week): string {
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  return `${fmt(week.days[0])} – ${fmt(week.days[6])}`
}

/**
 * Cards per day for the week. Days after today are null (not 0), so the
 * line stops at today instead of dropping to zero.
 */
export function countPerDay(
  rows: { created_at: string; employee_id: string }[],
  week: Week,
  today: string,
  employeeId?: string,
): (number | null)[] {
  const counts = new Map(week.days.map((d) => [d, 0]))
  for (const row of rows) {
    if (employeeId && row.employee_id !== employeeId) continue
    const day = storeDateOf(row.created_at)
    if (counts.has(day)) counts.set(day, counts.get(day)! + 1)
  }
  return week.days.map((d) => (d > today ? null : counts.get(d)!))
}
