import { supabase } from '@/lib/supabase'

export async function debugAuthFlow() {
  console.log('=== DEBUG AUTH FLOW ===')
  
  // Check current session
  const { data: session, error: sessionError } = await supabase.auth.getSession()
  console.log('Current session:', session)
  console.log('Session error:', sessionError)
  
  // Check Supabase config
  console.log('Supabase URL:', supabase.supabaseUrl)
  console.log('Current URL:', window.location.href)
  
  // Check auth state
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user:', user)
  
  console.log('=== END DEBUG ===')
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuthFlow = debugAuthFlow
}