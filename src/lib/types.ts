// Shapes of the rows we read from the database.
// These mirror the tables in supabase/migrations/.

export type Role = 'member' | 'lead'

export type Employee = {
  id: string
  display_name: string
  active: boolean
  role: Role
  created_at: string
}

export type Application = {
  id: string
  employee_id: string
  entered_by_id: string | null
  created_at: string // when the card happened (a Lead can change it)
  logged_at: string // when it was entered in the app (never changes)
  edited_at: string | null // set when a Lead changed the time or person
  voided: boolean
  voided_at: string | null
  voided_by_employee_id: string | null
  void_reason: string | null
}

export const EMPLOYEE_COLUMNS = 'id, display_name, active, role, created_at'

export const APPLICATION_COLUMNS =
  'id, employee_id, entered_by_id, created_at, logged_at, edited_at, voided, voided_at, voided_by_employee_id, void_reason'
