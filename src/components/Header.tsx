import { MEDAL_EMOJI, MEDAL_LABEL, type Medal } from '../lib/medals'
import { greetingFor } from '../lib/time'
import type { Employee } from '../lib/types'

type Props = {
  me?: Employee // undefined until someone picks their name
  myMedal?: Medal
}

/** Top banner: app name, or a time-of-day greeting once we know who you are. */
export function Header({ me, myMedal }: Props) {
  // "Laine P" -> "Laine"
  const firstName = me?.display_name.split(' ')[0]

  return (
    <header className="bg-slate-900 px-4 py-4 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold">Card Tracker</h1>
        {me ? (
          <p className="text-sm text-slate-300">
            {greetingFor()}, {firstName}
            {myMedal === 'gold' && (
              <span
                className="ml-1.5"
                role="img"
                aria-label={MEDAL_LABEL.gold}
                title={MEDAL_LABEL.gold}
              >
                {MEDAL_EMOJI.gold}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-300">Credit applications, live</p>
        )}
      </div>
    </header>
  )
}
