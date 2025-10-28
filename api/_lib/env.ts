// /api/_lib/env.ts
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!, // opcional si lo usás en server
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN!,     // credencial productiva
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
  FX_API_BASE: process.env.FX_API_BASE || "https://api.exchangerate.host",
  FX_BASE_CURRENCY: process.env.FX_BASE_CURRENCY || "USD",
  // agrega aquí cualquier otra secret necesaria
};
