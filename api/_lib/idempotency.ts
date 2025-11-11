// /api/_lib/idempotency.ts
import { supabaseAdmin } from "./supabase-admin.js";

export async function ensureIdempotent(key: string, table = "webhook_idempotency") {
  // Crea esta tabla simple si no la tenés:
  // create table public.webhook_idempotency (key text primary key, created_at timestamptz default now());
  const { data } = await supabaseAdmin.from(table).select("key").eq("key", key).maybeSingle();
  if (data?.key) return false; // ya procesado
  const { error } = await supabaseAdmin.from(table).insert({ key });
  if (error) throw error;
  return true;
}
