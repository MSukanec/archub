import type { VercelRequest } from "@vercel/node";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function extractAuthToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return token || null;
}

export function createAuthenticatedSupabaseClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

export function createServiceSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export type AuthResult = 
  | { success: true; token: string; supabase: SupabaseClient }
  | { success: false; error: string };

export function getAuthenticatedClient(req: VercelRequest): AuthResult {
  const token = extractAuthToken(req);
  
  if (!token) {
    return { success: false, error: "Missing authorization token" };
  }
  
  const supabase = createAuthenticatedSupabaseClient(token);
  return { success: true, token, supabase };
}
