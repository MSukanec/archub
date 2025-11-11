// /api/_lib/env.ts
// Helper opcional para otras rutas. Este archivo NO es requerido por /api/mp/webhook.

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MP_ACCESS_TOKEN: string;
  MP_WEBHOOK_SECRET: string;
  DISCORD_WEBHOOK_URL: string;
};

export const env: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ?? "",
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET ?? "",
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ?? "",
};

export default env;
