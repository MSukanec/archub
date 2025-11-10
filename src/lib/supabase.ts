import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Singleton pattern to prevent multiple instances during hot-reloading
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

// Helper function to refresh session when needed
export async function refreshSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}
