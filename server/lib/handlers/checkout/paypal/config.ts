import { createClient } from "@supabase/supabase-js";

let cachedPayPalMode: boolean | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

async function fetchPayPalTestModeFromDB(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("[PayPal config] Missing Supabase credentials, defaulting to production mode");
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("key", "paypal_test_mode")
      .maybeSingle();

    if (error) {
      console.error("[PayPal config] Error fetching feature flag:", error);
      return false;
    }

    return data?.is_enabled === true;
  } catch (e) {
    console.error("[PayPal config] Exception fetching feature flag:", e);
    return false;
  }
}

export async function getPayPalMode(): Promise<boolean> {
  const now = Date.now();
  
  if (cachedPayPalMode !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPayPalMode;
  }

  cachedPayPalMode = await fetchPayPalTestModeFromDB();
  cacheTimestamp = now;
  
  return cachedPayPalMode;
}

export function refreshPayPalModeCache(): void {
  cachedPayPalMode = null;
  cacheTimestamp = 0;
}

export async function getPayPalCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  webhookId: string;
  baseUrl: string;
  isSandbox: boolean;
}> {
  const isSandbox = await getPayPalMode();

  const clientId = isSandbox
    ? process.env.PAYPAL_CLIENT_ID_SANDBOX!
    : process.env.PAYPAL_CLIENT_ID!;

  const clientSecret = isSandbox
    ? process.env.PAYPAL_CLIENT_SECRET_SANDBOX!
    : process.env.PAYPAL_CLIENT_SECRET!;

  const webhookId = isSandbox
    ? (process.env.PAYPAL_WEBHOOK_ID_SANDBOX || "")
    : (process.env.PAYPAL_WEBHOOK_ID || "");

  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  return { clientId, clientSecret, webhookId, baseUrl, isSandbox };
}

export async function logPayPalMode(context: string): Promise<void> {
  const isSandbox = await getPayPalMode();
  if (isSandbox) {
    console.log(`[PayPal] ${context} - MODE: SANDBOX (via feature flag paypal_test_mode)`);
  } else {
    console.log(`[PayPal] ${context} - MODE: PRODUCTION`);
  }
}
