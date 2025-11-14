// api/lib/auth-helpers.ts
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
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Custom HTTP Error for domain logic
 */
export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
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

    // Get the database user by auth_user_id
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
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

/**
 * Requires a valid user from token, throws HttpError if not found
 */
export async function requireUser(token: string | null): Promise<{
  userId: string;
  authId: string;
  supabase: SupabaseClient;
}> {
  if (!token) {
    throw new HttpError(401, "No authorization token provided");
  }

  const user = await getUserFromToken(token);
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  return user;
}

/**
 * Verifies that the user has admin access
 * Throws HttpError if user is not authenticated or not an admin
 * @returns The authenticated user from Supabase Auth
 */
export async function verifyAdminUser(authHeader: string | undefined) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new HttpError(500, "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  const token = extractToken(authHeader);
  
  if (!token) {
    throw new HttpError(401, "No authorization token provided");
  }

  // Use service role client to verify admin status
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('Error checking admin permissions:', adminError);
    throw new HttpError(500, "Error verifying admin permissions");
  }

  if (!adminCheck) {
    throw new HttpError(403, "Forbidden: Admin access required");
  }

  return user;
}
