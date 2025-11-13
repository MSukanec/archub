// api/_lib/handlers/learning/shared.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface LearningHandlerContext {
  supabase: SupabaseClient;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  auth_id: string;
}

/**
 * Get authenticated user from Supabase auth and lookup in users table
 * Tries auth_id first, falls back to email (case-insensitive)
 * Returns null if user not found
 */
export async function getAuthenticatedUser(
  ctx: LearningHandlerContext
): Promise<AuthenticatedUser | null> {
  const { supabase } = ctx;

  // Get auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !user.email) {
    return null;
  }

  // Try to find user by auth_id first (preferred)
  const { data: dbUserByAuth } = await supabase
    .from('users')
    .select('id, email, auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();
  
  if (dbUserByAuth) {
    return dbUserByAuth;
  }

  // Fallback: find by email (case-insensitive)
  const { data: dbUserByEmail } = await supabase
    .from('users')
    .select('id, email, auth_id')
    .ilike('email', user.email)
    .maybeSingle();
  
  return dbUserByEmail;
}
