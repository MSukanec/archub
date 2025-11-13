// api/_lib/handlers/admin/types.ts
// Shared types for admin handlers

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Standard response envelope for all admin handlers
 */
export type AdminHandlerResult<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * Context passed to admin handlers
 * Contains service role Supabase client (bypasses RLS)
 */
export interface AdminContext {
  supabase: SupabaseClient;
}

/**
 * Helper to create success response
 */
export function success<T>(data: T): AdminHandlerResult<T> {
  return { success: true, data };
}

/**
 * Helper to create error response
 */
export function error(message: string): AdminHandlerResult {
  return { success: false, error: message };
}
