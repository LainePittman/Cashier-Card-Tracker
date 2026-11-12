// Medals for today's top card-getters.
// Ties share a medal, Olympic style: if two people tie for most, both get
// gold and the next person gets bronze (there is no silver).

export type Medal = 'gold' | 'silver' | 'bronze'

const MEDALS: Medal[] = ['gold', 'silver', 'bronze']

/**
 * Given each person's card count, returns the medal each person earns.
 * A person's rank is 1 + how many people have strictly more cards.
 * People with 0 cards never get a medal.
 */
export function assignMedals(counts: Map<string, number>): Map<string, Medal> {
  const result = new Map<string, Medal>()
  const all = [...counts.values()]

  for (const [id, count] of counts) {
    if (count <= 0) continue
    const rank = 1 + all.filter((other) => other > count).length
    const medal = MEDALS.at(rank - 1)
    if (medal) result.set(id, medal)
  }

  return result
}

export const MEDAL_EMOJI: Record<Medal, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
}

export const MEDAL_LABEL: Record<Medal, string> = {
  gold: 'Gold: most cards today',
  silver: 'Silver: second most cards today',
  bronze: 'Bronze: third most cards today',
}
