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

/** Add a name to the list (always as a Team Member). Restores it if it was removed. */
export function addEmployee(actorId: string, name: string) {
  return call('lead_add_employee', { actor_id: actorId, new_name: name })
}

/** Remove a name from the list (active = false) or restore it (active = true). */
export function setEmployeeActive(actorId: string, targetId: string, active: boolean) {
  return call('lead_set_employee_active', {
    actor_id: actorId,
    target_id: targetId,
    make_active: active,
  })
}
