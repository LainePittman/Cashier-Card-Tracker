import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Application, Employee } from '../lib/types'

/**
 * Loads everything the board needs and keeps it live:
 *  - all employees (names for the picker and the columns)
 *  - today's applications (from the `applications_today` view)
 *
 * "Live" works like this: Supabase Realtime tells us whenever a row in
 * `applications` or `employees` changes, and we simply reload both lists.
 * Reloading everything is less clever than patching in each change, but
 * it's simple, and a store's worth of data for one day is tiny.
 */
export function useBoard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase) return

    // Run both queries at the same time instead of one after the other.
    const [emp, apps] = await Promise.all([
      supabase
        .from('employees')
        .select('id, display_name, active, created_at')
        .order('display_name'),
      supabase
        .from('applications_today')
        .select('id, employee_id, entered_by_id, created_at, voided, voided_at, void_reason')
        .order('created_at', { ascending: false }),
    ])

    if (emp.error || apps.error) {
      setError((emp.error ?? apps.error)!.message)
    } else {
      setEmployees(emp.data as Employee[])
      setApplications(apps.data as Application[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    reload()

    // 1. Live updates: reload whenever either table changes.
    const channel = client
      .channel('board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, reload)
      .subscribe()

    // 2. Safety net: reload every minute. Catches anything Realtime missed
    //    and rolls the board over to a new day after midnight.
    const timer = setInterval(reload, 60_000)

    // 3. Phones pause web pages when the screen locks. Reload on wake.
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)

    // Cleanup runs when the component goes away, so nothing leaks.
    return () => {
      client.removeChannel(channel)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { employees, applications, loading, error, reload }
}
