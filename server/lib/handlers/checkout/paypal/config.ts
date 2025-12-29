import { getAdminClient } from '../../../../routes/_base.js';

// Cached flag check to avoid excessive DB queries
let cachedTestMode: boolean | null = null;
let cachedTestModeTime = 0;
const TEST_MODE_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get PayPal test mode from feature flags (dynamically from DB)
 * Cached to avoid excessive DB queries
 */
async function getPayPalTestModeFromDB(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedTestMode !== null && (now - cachedTestModeTime) < TEST_MODE_CACHE_TTL) {
    return cachedTestMode;
  }
  
  try {
    const adminClient = getAdminClient();
    const { data: flag, error } = await adminClient
      .from('feature_flags')
      .select('value')
      .eq('key', 'paypal_test_mode')
      .single();
    
    if (error || !flag) {
      console.warn('[PayPal Config] Could not fetch paypal_test_mode flag, defaulting to false');
      cachedTestMode = false;
      cachedTestModeTime = now;
      return false;
    }
    
    cachedTestMode = flag.value;
    cachedTestModeTime = now;
    return flag.value;
  } catch (err) {
    console.warn('[PayPal Config] Error fetching test mode flag:', err);
    return false;
  }
}

/**
 * Get PayPal configuration based on current mode (test or production)
 * Dynamically checks the paypal_test_mode feature flag from the database
 */
export async function getPayPalConfig() {
  const isTestMode = await getPayPalTestModeFromDB();
  
  const clientId = isTestMode
    ? process.env.PAYPAL_CLIENT_ID_SANDBOX
    : process.env.PAYPAL_CLIENT_ID;
  
  const clientSecret = isTestMode
    ? process.env.PAYPAL_CLIENT_SECRET_SANDBOX
    : process.env.PAYPAL_CLIENT_SECRET;
  
  const webhookId = isTestMode
    ? (process.env.PAYPAL_WEBHOOK_ID_SANDBOX || "")
    : (process.env.PAYPAL_WEBHOOK_ID || "");
  
  const baseUrl = isTestMode
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
  
  return {
    isTestMode,
    clientId,
    clientSecret,
    webhookId,
    baseUrl,
  };
}
