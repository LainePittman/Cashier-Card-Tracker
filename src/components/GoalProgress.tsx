// Everyone's daily goal. Change this one number to change the goal everywhere.
export const DAILY_GOAL = 3

/** A bar that fills as you get cards today, up to the daily goal. */
export function GoalProgress({ count }: { count: number }) {
  const done = count >= DAILY_GOAL
  const percent = Math.min(count / DAILY_GOAL, 1) * 100

  let message: string
  if (count === 0) message = `Daily goal: ${DAILY_GOAL} cards`
  else if (count < DAILY_GOAL) message = `${count} of ${DAILY_GOAL} today, ${DAILY_GOAL - count} to go`
  else if (count === DAILY_GOAL) message = 'Goal met! 🎉'
  else message = `${count} today, goal beat by ${count - DAILY_GOAL} 🎉`

  return (
    <div className="mt-3">
      <div
        role="progressbar"
        aria-label="Daily card goal"
        aria-valuemin={0}
        aria-valuemax={DAILY_GOAL}
        aria-valuenow={Math.min(count, DAILY_GOAL)}
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Tick marks under the bar: 1, 2, 3 */}
      <div className="mt-1 flex justify-between px-0.5 text-xs text-slate-400 tabular-nums">
        <span>0</span>
        {Array.from({ length: DAILY_GOAL }, (_, i) => (
          <span key={i} className={count >= i + 1 ? 'font-semibold text-slate-700' : ''}>
            {i + 1}
          </span>
        ))}
      </div>
      <p
        className={`mt-1 text-center text-sm ${
          done ? 'font-semibold text-emerald-700' : 'text-slate-500'
        }`}
      >
        {message}
      </p>
    </div>
  )
}
