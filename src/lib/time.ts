// The store runs on Central time, so every time we show uses it,
// no matter what time zone the viewer's phone is set to.
const STORE_TIME_ZONE = 'America/Chicago'

/** "2:47 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: STORE_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "Tuesday, Oct 27" */
export function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: STORE_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Store wall-clock time in the format a datetime-local input uses:
 * "2026-11-01T14:30". The database turns this back into a real
 * timestamp using Central time, so both sides agree.
 */
export function toStoreInputValue(iso: string = new Date().toISOString()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00'

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Just the time part, for a time-only input: "14:30". */
export function toStoreTimeValue(iso: string = new Date().toISOString()): string {
  return toStoreInputValue(iso).slice(11)
}

/**
 * Turns a time-only input ("14:30") into the full store wall-clock value
 * the database expects, using today's date in Central time.
 */
export function todayAt(time: string): string {
  return `${toStoreInputValue().slice(0, 10)}T${time}`
}

/**
 * "Good morning" before noon, "Good afternoon" until 5 PM, then
 * "Good evening", all in store (Central) time.
 */
export function greetingFor(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: STORE_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(date),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
