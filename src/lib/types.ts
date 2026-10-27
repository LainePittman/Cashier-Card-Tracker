// Shapes of the rows we read from the database.
// These mirror the tables in supabase/migrations/001_initial_schema.sql.

export type Employee = {
  id: string
  display_name: string
  active: boolean
  created_at: string
}

export type Application = {
  id: string
  employee_id: string
  entered_by_id: string | null
  created_at: string // ISO timestamp, set by the server
  voided: boolean
  voided_at: string | null
  void_reason: string | null
}
