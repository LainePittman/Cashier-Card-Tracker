import { useEffect, useState } from 'react'

/**
 * Which screen to show, from the part of the address after '#'.
 * '#/stats' shows weekly stats; anything else shows the board.
 * Using the address means the phone's back button works too.
 */
export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = (to: string) => {
    window.location.hash = to
    window.scrollTo(0, 0)
  }

  return { route: hash === '#/stats' ? 'stats' : 'board', go } as const
}
