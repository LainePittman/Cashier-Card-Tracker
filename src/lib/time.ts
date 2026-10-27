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
