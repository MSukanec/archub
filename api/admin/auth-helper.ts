import { createClient } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyAdminUser(authHeader: string) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new AuthError("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", 500);
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  
  if (!token) {
    throw new AuthError("No authorization token provided", 401);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new AuthError("Invalid or expired token", 401);
  }

  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('Error checking admin permissions:', adminError);
    throw new AuthError("Error verifying admin permissions", 500);
  }

  if (!adminCheck) {
    throw new AuthError("Forbidden: Admin access required", 403);
  }

  return user;
}
