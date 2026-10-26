import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once .env.local has both Supabase values filled in. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The one shared Supabase client for the whole app.
 * It's null until .env.local is set up, so the app can still start and
 * show a setup message instead of crashing.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
