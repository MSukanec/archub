// api/_lib/auth-helpers.ts
// Shared authentication helpers for both Express and Vercel Functions

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Extracts bearer token from Authorization header
 * Works with both Express Request and Vercel Request
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Creates an authenticated Supabase client with user token
 * Respects RLS policies for the authenticated user
 */
export function createAuthenticatedClient(token: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Gets the database user ID from an authenticated token
 * Returns user ID from the users table (not auth.users)
 */
export async function getUserFromToken(token: string): Promise<{
  userId: string;
  authId: string;
  supabase: SupabaseClient;
} | null> {
  try {
    const supabase = createAuthenticatedClient(token);

    // Get the authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // Get the database user by auth_id
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !dbUser) {
      return null;
    }

    return {
      userId: dbUser.id,
      authId: user.id,
      supabase
    };
  } catch (err) {
    console.error('Error in getUserFromToken:', err);
    return null;
  }
}
