import { supabase } from './supabase';
/**
 * Gets a user record by their auth_id.
 * Uses .maybeSingle() to avoid errors when the user doesn't exist yet.
 * 
 * @param authId - The auth_id to look up
 * @returns The user record with id, or null if not found
 */
export async function getUserByAuthId(authId: string): Promise<{ id: string } | null> {
  if (!supabase || !authId) {
    return null;
  }
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching user by auth_id:', error);
    return null;
  }
  return data;
}
