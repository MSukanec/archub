import { supabase } from '@/lib/supabase'

export async function fixUserPreferences(userId: string) {
  // First, check if user_preferences record exists
  const { data: existingPrefs, error: checkError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError
  }

  if (!existingPrefs) {
    // Create new preferences record
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        theme: 'light',
        sidebar_docked: true,
        onboarding_completed: true,
        last_user_type: 'professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Update existing record to mark onboarding as completed
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        onboarding_completed: true,
        last_user_type: existingPrefs.last_user_type || 'professional',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}