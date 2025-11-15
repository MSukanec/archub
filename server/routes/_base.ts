import type { Express } from "express";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (exported for backward compatibility during migration)
export const supabaseUrl = process.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and ANON KEY are required");
}

// Public client for general queries (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for admin operations (bypasses RLS)
// This will be undefined if SUPABASE_SERVICE_ROLE_KEY is not set
export const adminSupabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : undefined;

/**
 * Helper to get admin client or throw error
 */
export function getAdminClient(): SupabaseClient {
  if (!adminSupabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Admin operations require service role key.');
  }
  return adminSupabase;
}

/**
 * Helper to create an authenticated Supabase client with a user's token
 */
export function createAuthenticatedClient(token: string): SupabaseClient {
  return createClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

/**
 * Helper to extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Shared dependencies for route modules
 */
export interface RouteDeps {
  supabase: SupabaseClient;
  adminSupabase: SupabaseClient | undefined;
  getAdminClient: () => SupabaseClient;
  createAuthenticatedClient: (token: string) => SupabaseClient;
  extractToken: (authHeader: string | undefined) => string | null;
}

/**
 * Get shared dependencies object
 */
export function getRouteDeps(): RouteDeps {
  return {
    supabase,
    adminSupabase,
    getAdminClient,
    createAuthenticatedClient,
    extractToken,
  };
}

/**
 * Helper function to verify admin access
 * Checks if the user exists in the admin_users table
 */
export async function verifyAdmin(authHeader: string) {
  const token = authHeader.substring(7);
  
  const authSupabase = createClient(
    supabaseUrl!,
    supabaseServiceKey!,
    { auth: { persistSession: false } }
  );
  
  const { data: { user }, error } = await authSupabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: "Invalid or expired token" };
  }
  
  const { data: adminCheck } = await authSupabase
    .from('admin_users')
    .select('auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();
  
  if (!adminCheck) {
    return { isAdmin: false, error: "Admin access required" };
  }
  
  return { isAdmin: true, user };
}

/**
 * Type for route registration functions
 */
export type RouteRegistrar = (app: Express, deps: RouteDeps) => void;
