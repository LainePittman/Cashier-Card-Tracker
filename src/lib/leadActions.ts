import { supabase } from './supabase'

// Thin wrappers around the Lead functions in 002_lead_role.sql.
// The database checks that `actorId` belongs to an active Lead, so
// hiding these buttons from Team Members is only for tidiness, not security.
// Each returns an error message, or null when it worked.

async function call(fn: string, args: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return 'Supabase is not set up'
  const { error } = await supabase.rpc(fn, args)
  return error ? error.message : null
}

/** localTime is store wall-clock time like "2026-11-01T14:30". */
export function addPastCard(actorId: string, forEmployeeId: string, localTime: string) {
  return call('lead_add_application', {
    actor_id: actorId,
    for_employee_id: forEmployeeId,
    at_local_time: localTime,
  })
}

export function changeTime(actorId: string, appId: string, localTime: string) {
  return call('lead_change_time', {
    actor_id: actorId,
    app_id: appId,
    new_local_time: localTime,
  })
}

export function moveCard(actorId: string, appId: string, toEmployeeId: string) {
  return call('lead_move_application', {
    actor_id: actorId,
    app_id: appId,
    to_employee_id: toEmployeeId,
  })
}

export function voidCard(actorId: string, appId: string, note: string) {
  return call('lead_void_application', {
    actor_id: actorId,
    app_id: appId,
    note: note.trim() || null,
  })
}
