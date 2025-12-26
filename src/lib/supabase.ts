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
// Expose Supabase client to window for Chrome extension access (lazy getter to avoid duplicate instances)
if (typeof window !== "undefined") {
  Object.defineProperty(window, 'supabase', {
    get: () => supabaseInstance,
    configurable: true
  });
}
// Helper function to refresh session when needed
export async function refreshSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Exception during session refresh:', error)
    return false
  }
}
