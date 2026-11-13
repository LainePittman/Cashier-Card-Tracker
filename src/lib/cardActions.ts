import { supabase } from './supabase'

// Actions any team member can take (no Lead role needed).
// Returns an error message, or null when it worked.

/**
 * Log a card that was forgotten earlier today, at the time it happened.
 * localTime is store wall-clock time like "2026-11-13T14:30". The database
 * rejects times that aren't earlier today.
 */
export async function addEarlierCard(
  actorId: string,
  forEmployeeId: string,
  localTime: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase is not set up'
  const { error } = await supabase.rpc('add_earlier_application', {
    actor_id: actorId,
    for_employee_id: forEmployeeId,
    at_local_time: localTime,
  })
  return error ? error.message : null
}
