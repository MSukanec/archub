# Análisis Completo - Sistema de Pagos Seencel

**Fecha:** 13 de noviembre, 2025  
**Alcance:** MercadoPago + PayPal (11 endpoints)  
**Objetivo:** Identificar lógica compartida y provider-específica para refactorización

---

## 1. TABLA RESUMEN DE ENDPOINTS

### MercadoPago

| Endpoint | Método | Input (body) | Input (query) | Output | Env Vars | Función |
|----------|--------|--------------|---------------|---------|----------|---------|
| **create-course-preference** | POST | `user_id`, `course_slug`, `currency`, `months`, `code` | - | `{ ok, init_point, preference_id }` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_MODE`, `MP_ACCESS_TOKEN`, `MP_ACCESS_TOKEN_TEST`, `MP_WEBHOOK_SECRET`, `CHECKOUT_RETURN_URL_BASE` | Crear preferencia de pago para curso |
| **create-subscription-preference** | POST | `user_id`, `plan_slug`, `organization_id`, `billing_period`, `currency` | - | `{ ok, init_point, preference_id }` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_MODE`, `MP_ACCESS_TOKEN`, `MP_ACCESS_TOKEN_TEST`, `MP_WEBHOOK_SECRET`, `CHECKOUT_RETURN_URL_BASE` | Crear preferencia para suscripción |
| **webhook** | POST | (MP notification) | `secret`, `data.id`, `id` | `{ ok, processed }` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_MODE`, `MP_ACCESS_TOKEN`, `MP_ACCESS_TOKEN_TEST`, `MP_WEBHOOK_SECRET` | Procesar notificaciones de MP |
| **success-handler** | GET | - | `payment_id`, `collection_id`, `collection_status`, `preference_id`, `course_slug`, `external_reference` | HTML redirect | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` | Página de éxito post-pago |

### PayPal

| Endpoint | Método | Input (body) | Input (query) | Output | Env Vars | Función |
|----------|--------|--------------|---------------|---------|----------|---------|
| **create-course-order** | POST | `user_id`, `course_slug`, `description`, `code` | - | `{ ok, order }` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Crear orden PayPal para curso |
| **create-subscription-order** | POST | `user_id`, `plan_slug`, `organization_id`, `billing_period`, `amount_usd`, `description` | - | `{ ok, order }` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Crear orden PayPal para suscripción |
| **capture-order** | POST | `orderId` | - | `{ ok, capture }` | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Capturar orden (genérico) |
| **capture-subscription** | GET | - | `token`, `PayerID` | HTML redirect | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Capturar y procesar suscripción |
| **capture-and-redirect** | GET | - | `token`, `PayerID`, `course_slug` | HTML redirect | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Capturar y procesar curso |
| **webhook** | POST | (PayPal event) | - | `{ ok }` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Procesar eventos de PayPal |
| **_utils** | - | - | - | N/A | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_ENV` | Helpers PayPal |

---

## 2. LÓGICA COMPARTIDA (Candidatos a Helpers Genéricos)

### 2.1 CORS Headers
**Duplicado en:** TODOS los endpoints  
**Patrón:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS" | "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```
**Uso:**
- Preflight OPTIONS handler
- Aplicar headers a cada response

**Helper propuesto:** `api/_lib/payments/cors.ts`
```typescript
export const corsHeaders = { ... };
export function handleCorsHeaders(res: VercelResponse, ...headers) { ... }
export function handleCorsOptions(res: VercelResponse) { ... }
```

---

### 2.2 Auth Token Extraction
**Duplicado en:** `create-course-preference`, `create-subscription-preference`, `create-course-order`, `create-subscription-order`  
**Patrón:**
```typescript
const authHeader = req.headers.authorization;
const token = authHeader?.replace(/^Bearer\s+/i, "");

if (!token) {
  return res.status(401).json({ ok: false, error: "Missing authorization token" });
}
```
**Helper propuesto:** `api/_lib/payments/auth.ts`
```typescript
export function extractAuthToken(req: VercelRequest): string | null { ... }
export function requireAuthToken(req: VercelRequest, res: VercelResponse): string | null { ... }
```

---

### 2.3 Supabase Client Creation
**Duplicado en:** TODOS los endpoints  
**Patrón:**
```typescript
// Service role (admin)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Authenticated (con token de usuario)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
```
**Helper propuesto:** `api/_lib/payments/supabase.ts`
```typescript
export function getSupabaseAdmin() { ... }
export function getSupabaseAuth(token: string) { ... }
```

---

### 2.4 Price Fetching from Database
**Duplicado en:** `create-course-preference`, `create-subscription-preference`, `create-course-order`, `create-subscription-order`

#### Course Prices
**Tablas:** `courses`, `course_prices`  
**Patrón:**
```typescript
// 1. Get course
const { data: course } = await supabase
  .from("courses")
  .select("id, title, slug, short_description, is_active")
  .eq("slug", course_slug)
  .single();

// 2. Get price
const { data: coursePrices } = await supabase
  .from("course_prices")
  .select("amount, currency_code, provider, is_active, months")
  .eq("course_id", course.id)
  .eq("currency_code", currency) // USD o ARS
  .in("provider", ["mercadopago"|"paypal", "any"])
  .eq("is_active", true);

// 3. Prefer provider-specific
const chosenPrice = coursePrices.find(p => p.provider === "mercadopago") ?? coursePrices[0];
```

#### Plan Prices
**Tablas:** `plans`, `plan_prices`  
**Patrón:**
```typescript
// 1. Get plan
const { data: plan } = await supabase
  .from("plans")
  .select("id, name, slug, is_active")
  .eq("slug", plan_slug)
  .eq("is_active", true)
  .single();

// 2. Get price
const { data: planPrices } = await supabase
  .from("plan_prices")
  .select("monthly_amount, annual_amount, currency_code, provider")
  .eq("plan_id", plan.id)
  .eq("currency_code", currency)
  .in("provider", ["mercadopago"|"paypal", "any"])
  .eq("is_active", true);

// 3. Select amount by billing_period
const priceAmount = billing_period === 'monthly' 
  ? chosenPrice.monthly_amount 
  : chosenPrice.annual_amount;
```

**Helper propuesto:** `api/_lib/payments/pricing.ts`
```typescript
export async function getCoursePricing(params: {
  course_slug: string;
  currency: string;
  provider: 'mercadopago' | 'paypal';
  supabase: SupabaseClient;
}) { ... }

export async function getPlanPricing(params: {
  plan_slug: string;
  currency: string;
  billing_period: 'monthly' | 'annual';
  provider: 'mercadopago' | 'paypal';
  supabase: SupabaseClient;
}) { ... }
```

---

### 2.5 Coupon Validation
**Duplicado en:** `create-course-preference`, `create-course-order`  
**Patrón:**
```typescript
if (code && code.trim()) {
  const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
    p_code: code.trim(),
    p_course_id: course.id,
    p_price: unit_price,
    p_currency: currency
  });

  if (couponError || !validationResult || !validationResult.ok) {
    return res.status(400).json({ 
      ok: false,
      error: "Invalid coupon", 
      reason: validationResult?.reason 
    });
  }

  // Apply discount
  const finalPrice = Number(validationResult.final_price);
  
  // 100% discount → free enrollment
  if (finalPrice <= 0) {
    return res.status(400|200).json({ 
      ok: false|true,
      error: "Este cupón otorga acceso gratuito",
      free_enrollment: true,
      coupon_code: code.trim()
    });
  }
  
  unit_price = finalPrice;
}
```
**Helper propuesto:** `api/_lib/payments/coupons.ts`
```typescript
export async function validateAndApplyCoupon(params: {
  code: string;
  course_id: string;
  price: number;
  currency: string;
  supabase: SupabaseClient;
}): Promise<{
  valid: boolean;
  finalPrice: number;
  isFree: boolean;
  couponData: any;
  error?: string;
}> { ... }
```

---

### 2.6 User Data Fetching
**Duplicado en:** `create-course-preference`, `create-subscription-preference`  
**Patrón:**
```typescript
const { data: userRow } = await supabase
  .from("users")
  .select("email, full_name")
  .eq("id", user_id)
  .maybeSingle();

const email = userRow?.email;
const fullNameParts = userRow?.full_name?.trim().split(" ") ?? [];
const first_name = fullNameParts[0] || "Usuario";
const last_name = fullNameParts.length > 1 
  ? fullNameParts.slice(1).join(" ") 
  : "Seencel";
```
**Helper propuesto:** `api/_lib/payments/user.ts`
```typescript
export async function getUserPayerInfo(user_id: string, supabase: SupabaseClient) {
  return { email, first_name, last_name };
}
```

---

### 2.7 URL Construction
**Duplicado en:** TODOS los endpoints de creación  
**Patrón:**
```typescript
const protocol = req.headers['x-forwarded-proto'] || 'https';
const host = req.headers['x-forwarded-host'] || req.headers.host;
const requestOrigin = `${protocol}://${host}`;
const returnBase = requestOrigin;
const webhookBase = process.env.CHECKOUT_RETURN_URL_BASE || requestOrigin;

// MercadoPago
const backUrls = {
  success: `${returnBase}/api/mp/success-handler?course_slug=${productSlug}`,
  failure: `${returnBase}/learning/courses/${productSlug}?payment=failed`,
  pending: `${returnBase}/learning/courses/${productSlug}?payment=pending`,
};
const notification_url = `${webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`;

// PayPal
const return_url = `${returnBase}/api/paypal/capture-and-redirect?course_slug=${productSlug}`;
const cancel_url = `${returnBase}/learning/courses`;
```
**Helper propuesto:** `api/_lib/payments/urls.ts`
```typescript
export function getBaseUrls(req: VercelRequest) {
  return { requestOrigin, webhookBase };
}

export function buildMPBackUrls(params: {
  returnBase: string;
  productSlug: string;
  productType: 'course' | 'subscription';
}) { ... }

export function buildPayPalUrls(params: {
  returnBase: string;
  productSlug?: string;
  productType: 'course' | 'subscription';
}) { ... }
```

---

### 2.8 Payment Event Logging
**Duplicado en:** `webhook` (MP), `webhook` (PayPal), `success-handler`, `capture-and-redirect`, `capture-subscription`  
**Patrón:**
```typescript
await supabase.from('payment_events').insert({
  provider: 'mercadopago' | 'paypal',
  provider_event_id: string,
  provider_event_type: string,
  status: 'PROCESSED' | string,
  raw_payload: any,
  order_id: string | null,
  custom_id: string | null,
  user_hint: string | null,
  course_hint: string | null,
  provider_payment_id: string | null,
  amount: number | null,
  currency: string | null,
});
```
**Helper propuesto:** `api/_lib/payments/events.ts`
```typescript
export async function logPaymentEvent(params: {
  provider: 'mercadopago' | 'paypal';
  provider_event_id?: string;
  provider_event_type: string;
  status: string;
  raw_payload: any;
  order_id?: string;
  custom_id?: string;
  user_hint?: string;
  course_hint?: string;
  provider_payment_id?: string;
  amount?: number;
  currency?: string;
  supabase: SupabaseClient;
}) { ... }
```

---

### 2.9 Payment Insert
**Duplicado en:** `webhook` (MP), `webhook` (PayPal), `success-handler`, `capture-and-redirect`, `capture-subscription`  
**Patrón:**
```typescript
const paymentData: any = {
  provider: "mercadopago" | "paypal",
  provider_payment_id: string,
  amount: number | null,
  currency: string,
  status: "completed" | string,
  product_type: 'course' | 'subscription',
};

// For courses
if (product_type === 'course') {
  paymentData.user_id = user_id;
  paymentData.course_id = course_id;
  paymentData.product_id = course_id;
}

// For subscriptions
if (product_type === 'subscription') {
  paymentData.organization_id = organization_id;
  paymentData.product_id = plan_id;
}

const { error } = await supabase.from("payments").insert(paymentData);

// Handle duplicate (23505)
if (error?.code === '23505') {
  console.log('⚠️ Payment already exists (idempotent)');
}
```
**Helper propuesto:** `api/_lib/payments/database.ts`
```typescript
export async function insertPayment(params: {
  provider: 'mercadopago' | 'paypal';
  provider_payment_id: string;
  amount: number | null;
  currency: string;
  status: string;
  product_type: 'course' | 'subscription';
  user_id?: string;
  course_id?: string;
  organization_id?: string;
  product_id?: string;
  supabase: SupabaseClient;
}): Promise<{ success: boolean; duplicate: boolean }> { ... }
```

---

### 2.10 Course Enrollment Upsert
**Duplicado en:** `webhook` (MP), `webhook` (PayPal), `success-handler`, `capture-and-redirect`  
**Patrón:**
```typescript
function addMonths(d: Date, months: number) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

const startedAt = new Date();
const expiresAt = months && months > 0 ? addMonths(startedAt, months) : null;

await supabase.from("course_enrollments").upsert({
  user_id,
  course_id,
  status: "active",
  started_at: startedAt.toISOString(),
  expires_at: expiresAt ? expiresAt.toISOString() : null,
  updated_at: new Date().toISOString(),
}, { onConflict: "user_id,course_id" });
```
**Helper propuesto:** `api/_lib/payments/enrollments.ts`
```typescript
export async function enrollUserInCourse(params: {
  user_id: string;
  course_id: string;
  months?: number;
  supabase: SupabaseClient;
}) { ... }
```

---

### 2.11 Subscription Upgrade
**Duplicado en:** `webhook` (MP), `webhook` (PayPal), `capture-subscription`  
**Patrón:**
```typescript
async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
}) {
  // 1. Cancel previous subscriptions
  await supabase
    .from('organization_subscriptions')
    .update({ status: 'expired', cancelled_at: new Date().toISOString() })
    .eq('organization_id', params.organization_id)
    .eq('status', 'active');
  
  // 2. Calculate expires_at
  const expiresAt = new Date();
  if (params.billing_period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  // 3. Create new subscription
  await supabase.from('organization_subscriptions').insert({
    organization_id: params.organization_id,
    plan_id: params.plan_id,
    payment_id: params.payment_id,
    status: 'active',
    billing_period: params.billing_period,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    amount: params.amount,
    currency: params.currency,
  });
  
  // 4. Update organization.plan_id
  await supabase
    .from('organizations')
    .update({ plan_id: params.plan_id })
    .eq('id', params.organization_id);
}
```
**Helper propuesto:** `api/_lib/payments/subscriptions.ts`
```typescript
export async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
  supabase: SupabaseClient;
}) { ... }
```

---

### 2.12 Admin Role Validation
**Duplicado en:** `create-subscription-preference`, `create-subscription-order`  
**Patrón:**
```typescript
// 1. Check membership
const { data: membership, error: memberError } = await supabase
  .from("organization_members")
  .select("id, role_id, roles!inner(name)")
  .eq("organization_id", organization_id)
  .eq("user_id", user_id)
  .eq("is_active", true)
  .single();

if (memberError || !membership) {
  return res.status(403).json({ 
    ok: false, 
    error: "You don't have permissions to modify this organization" 
  });
}

// 2. Check admin role
const roleName = (membership.roles as any)?.name?.toLowerCase();
const validAdminRoles = ['admin', 'owner', 'administrador'];
if (!validAdminRoles.includes(roleName)) {
  return res.status(403).json({ 
    ok: false, 
    error: "Only administrators can upgrade the organization plan" 
  });
}
```
**Helper propuesto:** `api/_lib/payments/permissions.ts`
```typescript
export async function requireOrganizationAdmin(params: {
  user_id: string;
  organization_id: string;
  supabase: SupabaseClient;
  res: VercelResponse;
}): Promise<boolean> { ... }
```

---

### 2.13 Plan ID Resolution
**Duplicado en:** `webhook` (MP), `webhook` (PayPal)  
**Patrón:**
```typescript
async function getPlanIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}
```
**Helper propuesto:** `api/_lib/payments/resolvers.ts`
```typescript
export async function resolvePlanId(slug: string, supabase: SupabaseClient): Promise<string | null> { ... }
export async function resolveCourseId(slug: string, supabase: SupabaseClient): Promise<string | null> { ... }
```

---

## 3. LÓGICA PROVIDER-ESPECÍFICA

### 3.1 MercadoPago

#### Test/Production Mode Detection
```typescript
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

const MP_ACCESS_TOKEN = isTestMode 
  ? process.env.MP_ACCESS_TOKEN_TEST! 
  : process.env.MP_ACCESS_TOKEN!;
```
**Helper:** `api/_lib/payments/mp/config.ts`

#### Preference Creation API
```typescript
const prefBody = {
  items: [{
    id: productSlug,
    category_id: "services",
    title: productTitle,
    description: productDescription,
    quantity: 1,
    unit_price,
    currency_id: currency, // "ARS"
  }],
  external_reference: custom_id, // base64 JSON
  payer: { email, first_name, last_name },
  notification_url: `${webhookBase}/api/mp/webhook?secret=${MP_WEBHOOK_SECRET}`,
  back_urls: {
    success: `${returnBase}/api/mp/success-handler?course_slug=${productSlug}`,
    failure: `${returnBase}/learning/courses/${productSlug}?payment=failed`,
    pending: `${returnBase}/learning/courses/${productSlug}?payment=pending`,
  },
  auto_return: "approved",
  binary_mode: true,
  statement_descriptor: "SEENCEL",
  metadata: { user_id, product_type, ... }
};

const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(prefBody),
});
```
**Helper:** `api/_lib/payments/mp/api.ts`

#### External Reference Encoding (base64 JSON)
```typescript
const customData = {
  user_id,
  product_type: 'course' | 'subscription',
  course_slug, // for courses
  months, // for courses
  plan_slug, // for subscriptions
  organization_id, // for subscriptions
  billing_period, // for subscriptions
  coupon_code, // optional
  coupon_id, // optional
};

const custom_id = Buffer.from(JSON.stringify(customData)).toString('base64');
```

#### External Reference Decoding
```typescript
function parseExtRef(ext?: string | null) {
  if (!ext) return {};
  
  // Try base64 JSON (new format)
  try {
    const decoded = Buffer.from(ext, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        user_id: parsed.user_id || null,
        course_slug: parsed.course_slug || null,
        months: parsed.months || null,
        product_type: parsed.product_type || null,
        plan_slug: parsed.plan_slug || null,
        organization_id: parsed.organization_id || null,
        billing_period: parsed.billing_period || null,
      };
    }
  } catch (e) {}
  
  // Legacy format: "user|slug|months"
  const [u, s, m] = String(ext).split("|");
  return {
    user_id: u || null,
    course_slug: s || null,
    months: m === "null" ? null : Number(m),
  };
}
```
**Helper:** `api/_lib/payments/mp/encoding.ts`

#### Webhook Event Parsing
```typescript
async function parseBody(req: VercelRequest): Promise<any> {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try { return JSON.parse(req.body); } catch {}
    }
  } catch {}
  
  // Fallback: read raw stream
  const raw: string = await new Promise((resolve) => {
    let data = "";
    req.on("data", (c: Buffer) => (data += c.toString("utf8")));
    req.on("end", () => resolve(data));
  });
  
  if (!raw) return {};
  try { return JSON.parse(raw); } catch {}
  
  // URL-encoded fallback
  const p = new URLSearchParams(raw);
  const obj = Object.fromEntries(p.entries());
  const id = p.get("data.id") || p.get("id");
  if (!obj["data"] && id) obj.data = { id };
  return obj;
}
```

#### Payment API Fetching
```typescript
async function mpGetPayment(id: string) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`mpGetPayment ${id} -> ${r.status}`);
  return r.json();
}

async function mpGetMerchantOrder(id: string) {
  const r = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error(`mpGetMerchantOrder ${id} -> ${r.status}`);
  return r.json();
}
```
**Helper:** `api/_lib/payments/mp/api.ts`

---

### 3.2 PayPal

#### Environment Detection
```typescript
export function paypalBase() {
  const override = process.env.PAYPAL_BASE_URL;
  if (override) return override;
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return env === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";
}
```
**Helper:** `api/_lib/payments/paypal/config.ts`

#### Access Token Fetching
```typescript
export async function getAccessToken() {
  const cid = process.env.PAYPAL_CLIENT_ID!;
  const sec = process.env.PAYPAL_CLIENT_SECRET!;
  const base = paypalBase();
  const auth = Buffer.from(`${cid}:${sec}`).toString("base64");
  
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  
  if (!r.ok) throw new Error(`OAuth ${r.status}`);
  const j = await r.json();
  return j.access_token as string;
}
```
**Helper:** `api/_lib/payments/paypal/auth.ts`

#### Order Creation API
```typescript
const body = {
  intent: "CAPTURE",
  purchase_units: [{
    amount: { 
      currency_code: "USD", 
      value: String(amount) 
    },
    description: productDescription,
    invoice_id: uniqueInvoiceId, // shortened for logging
    custom_id: custom_id, // pipe-delimited with full UUIDs
  }],
  application_context: {
    brand_name: "Seencel",
    user_action: "PAY_NOW",
    return_url,
    cancel_url,
  }
};

const r = await fetch(`${base}/v2/checkout/orders`, {
  method: "POST",
  headers: { 
    "Authorization": `Bearer ${token}`, 
    "Content-Type": "application/json" 
  },
  body: JSON.stringify(body)
});
```
**Helper:** `api/_lib/payments/paypal/api.ts`

#### Custom ID Encoding (Pipe-Delimited)
```typescript
// Course without coupon: user_id|course_id (~73 chars)
const custom_id = `${user_id}|${productId}`;

// Course with coupon: user_id|course_id|coupon_code|coupon_id (~120 chars)
const custom_id = `${user_id}|${productId}|${code.trim().toUpperCase()}|${couponData.coupon_id}`;

// Subscription: user_id|plan_id|organization_id|billing_period (~118 chars)
const custom_id = `${user_id}|${productId}|${organization_id}|${billing_period}`;
```

#### Invoice ID Encoding (Shortened for Logging)
```typescript
// Course
const shortCourseId = productId.substring(0, 8);
const shortUserId = user_id.substring(0, 8);
const timestamp = Date.now();

const uniqueInvoiceId = couponData 
  ? `c:${shortCourseId};u:${shortUserId};cpn:${code.trim().substring(0, 8)};ts:${timestamp}`
  : `c:${shortCourseId};u:${shortUserId};ts:${timestamp}`;

// Subscription
const shortPlanId = productId.substring(0, 8);
const shortUserId = user_id.substring(0, 8);
const shortOrgId = organization_id.substring(0, 8);

const uniqueInvoiceId = `sub:${shortPlanId};u:${shortUserId};o:${shortOrgId};bp:${billing_period};ts:${timestamp}`;
```

#### Custom ID Decoding
```typescript
// Pipe-delimited format
if (custom_id_raw.includes('|')) {
  const parts = custom_id_raw.split('|');
  
  // Subscription: 4 parts with billing_period
  if (parts.length === 4 && (parts[3] === 'monthly' || parts[3] === 'annual')) {
    user_hint = parts[0];
    plan_id = parts[1];
    organization_id = parts[2];
    billing_period = parts[3];
    product_type = 'subscription';
  }
  // Course with coupon: 4 parts
  else if (parts.length === 4) {
    user_hint = parts[0];
    course_hint = parts[1];
    product_type = 'course';
  }
  // Course without coupon: 2 parts
  else if (parts.length === 2) {
    user_hint = parts[0];
    course_hint = parts[1];
    product_type = 'course';
  }
}
```

#### Invoice ID Parsing
```typescript
function parseInvoiceId(invoiceId: string) {
  const out: Record<string, string> = {};
  if (!invoiceId) return out;
  
  for (const part of invoiceId.split(";")) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (!k || !v) continue;
    
    // Map shortened keys to full keys
    const keyMapping: Record<string, string> = {
      'sub': 'subscription',
      'u': 'user',
      'o': 'organization_id',
      'bp': 'billing_period',
      'ts': 'timestamp',
      'p': 'plan_id',
      'c': 'course',
      'cpn': 'coupon',
    };
    
    const mappedKey = keyMapping[k] || k;
    out[mappedKey] = v;
  }
  return out;
}
```
**Helper:** `api/_lib/payments/paypal/encoding.ts`

#### Order Capture API
```typescript
const r = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
  method: "POST",
  headers: { 
    "Authorization": `Bearer ${token}`, 
    "Content-Type": "application/json" 
  }
});
```

#### Order Details Fetching
```typescript
async function fetchOrderInvoiceId(orderId: string) {
  try {
    const token = await getPPToken();
    const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.purchase_units?.[0]?.invoice_id ?? null;
  } catch {
    return null;
  }
}
```
**Helper:** `api/_lib/payments/paypal/api.ts`

---

## 4. VALIDACIONES CRÍTICAS A PRESERVAR

### 🔒 CRÍTICO 1: Server-Side Pricing
**Ubicación:** `create-course-preference`, `create-subscription-preference`, `create-course-order`, `create-subscription-order`

**Regla:** NUNCA confiar en precios del cliente. Siempre obtener del servidor.

```typescript
// ❌ NUNCA HACER ESTO
const { amount } = req.body; // INSEGURO

// ✅ CORRECTO
const { data: coursePrices } = await supabase
  .from("course_prices")
  .select("amount, currency_code, provider")
  .eq("course_id", course.id)
  .eq("currency_code", currency)
  .in("provider", ["mercadopago", "any"])
  .eq("is_active", true);

const chosenPrice = coursePrices.find(p => p.provider === "mercadopago") ?? coursePrices[0];
let unit_price = Number(chosenPrice.amount);
```

**Validación adicional:**
```typescript
if (!Number.isFinite(unit_price) || unit_price <= 0) {
  return res.status(500).json({ ok: false, error: "Invalid price" });
}
```

---

### 🔒 CRÍTICO 2: Admin Role Check en Subscriptions
**Ubicación:** `create-subscription-preference`, `create-subscription-order`

**Regla:** Solo admins pueden upgradear plan de organización.

```typescript
// 1. Verificar membership activa
const { data: membership } = await supabase
  .from("organization_members")
  .select("id, role_id, roles!inner(name)")
  .eq("organization_id", organization_id)
  .eq("user_id", user_id)
  .eq("is_active", true)
  .single();

if (!membership) {
  return res.status(403).json({ ok: false, error: "Not a member" });
}

// 2. Verificar rol admin
const roleName = (membership.roles as any)?.name?.toLowerCase();
const validAdminRoles = ['admin', 'owner', 'administrador'];
if (!validAdminRoles.includes(roleName)) {
  return res.status(403).json({ ok: false, error: "Only admins can upgrade" });
}
```

---

### 🔒 CRÍTICO 3: Coupon Validation con RPC
**Ubicación:** `create-course-preference`, `create-course-order`

**Regla:** Validar cupones server-side con RPC (nunca cliente).

```typescript
const { data: validationResult, error: couponError } = await supabase.rpc('validate_coupon', {
  p_code: code.trim(),
  p_course_id: course.id,
  p_price: unit_price,
  p_currency: currency
});

if (couponError || !validationResult || !validationResult.ok) {
  return res.status(400).json({ 
    ok: false,
    error: "Invalid coupon", 
    reason: validationResult?.reason 
  });
}

// Aplicar descuento solo si es válido
const finalPrice = Number(validationResult.final_price);
```

**Caso especial: 100% discount**
```typescript
if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
  return res.status(400).json({ 
    ok: false,
    error: "Use free enrollment flow",
    free_enrollment: true,
    coupon_code: code.trim()
  });
}
```

---

### 🔒 CRÍTICO 4: Test/Production Mode Detection (MP)
**Ubicación:** `create-course-preference`, `create-subscription-preference`, `webhook`

**Regla:** Usar credenciales correctas según modo.

```typescript
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

const MP_ACCESS_TOKEN = isTestMode 
  ? process.env.MP_ACCESS_TOKEN_TEST! 
  : process.env.MP_ACCESS_TOKEN!;

console.log(`[MP] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);
```

**Validación de token:**
```typescript
const isValidToken = MP_ACCESS_TOKEN && 
  (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));

if (!isValidToken) {
  return res.status(500).json({ ok: false, error: "Invalid MP_ACCESS_TOKEN" });
}
```

---

### 🔒 CRÍTICO 5: Auth Token Required
**Ubicación:** Todos los endpoints de creación (excepto webhooks)

**Regla:** Requerir token de autorización para crear órdenes.

```typescript
const authHeader = req.headers.authorization;
const token = authHeader?.replace(/^Bearer\s+/i, "");

if (!token) {
  return res.status(401).json({ ok: false, error: "Missing authorization token" });
}

// Crear cliente autenticado para RPC
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
```

**Por qué:** El token permite que los RPCs (como `validate_coupon`) verifiquen el usuario actual.

---

### 🔒 CRÍTICO 6: Idempotency en Pagos
**Ubicación:** `webhook`, `capture-subscription`, `success-handler`

**Regla:** Prevenir duplicados con constraint de DB.

```typescript
const { error } = await supabase.from('payments').insert(paymentData);

// Handle duplicate (código PostgreSQL 23505)
if (error?.code === '23505') {
  console.log('⚠️ Payment already exists (idempotent)');
  // NO retornar error, continuar normalmente
} else if (error) {
  console.error('Error inserting payment:', error);
}
```

**Constraint DB:** `(provider, provider_payment_id)` UNIQUE

---

### 🔒 CRÍTICO 7: Webhook Secret Validation (MP)
**Ubicación:** `webhook` (MP)

**Regla:** Validar secret en query params.

```typescript
if (MP_WEBHOOK_SECRET) {
  const q = String(req.query?.secret ?? "");
  if (!q || q !== MP_WEBHOOK_SECRET) {
    console.warn("[mp/webhook] secret mismatch");
    return send(res, 200, { ok: true, ignored: "secret mismatch" });
  }
}
```

**Nota:** PayPal no usa este método, debería implementar validación de firma.

---

## 5. HELPERS COMPARTIDOS A CREAR

### Estructura propuesta:
```
api/_lib/payments/
├── shared/
│   ├── cors.ts              # CORS headers & handlers
│   ├── auth.ts              # Auth token extraction
│   ├── supabase.ts          # Supabase client creation
│   ├── urls.ts              # URL construction
│   ├── pricing.ts           # Price fetching (course & plan)
│   ├── coupons.ts           # Coupon validation
│   ├── user.ts              # User data fetching
│   ├── events.ts            # Payment event logging
│   ├── database.ts          # Payment insert
│   ├── enrollments.ts       # Course enrollment
│   ├── subscriptions.ts     # Subscription upgrade
│   ├── permissions.ts       # Admin role check
│   ├── resolvers.ts         # Plan/Course ID resolution
│   └── types.ts             # Shared types
├── mp/
│   ├── config.ts            # MP config & mode detection
│   ├── api.ts               # MP API calls
│   ├── encoding.ts          # External reference encoding/decoding
│   └── types.ts             # MP-specific types
├── paypal/
│   ├── config.ts            # PayPal config & env detection
│   ├── auth.ts              # PayPal OAuth token
│   ├── api.ts               # PayPal API calls
│   ├── encoding.ts          # Custom ID & Invoice ID encoding/decoding
│   └── types.ts             # PayPal-specific types
└── index.ts                 # Re-exports
```

---

## 6. HELPERS PROVIDER-ESPECÍFICOS

### MercadoPago (`api/_lib/payments/mp/`)

#### `config.ts`
- `getMPMode()` - Detectar test/production
- `getMPAccessToken()` - Obtener token según modo
- `getMPWebhookSecret()` - Obtener webhook secret
- `validateMPAccessToken()` - Validar formato de token

#### `api.ts`
- `createMPPreference(body)` - Crear preferencia
- `getMPPayment(id)` - Obtener pago
- `getMPMerchantOrder(id)` - Obtener merchant order

#### `encoding.ts`
- `encodeExternalReference(data)` - Codificar a base64
- `decodeExternalReference(encoded)` - Decodificar de base64
- `extractMetadata(mpObject)` - Extraer metadata útil

---

### PayPal (`api/_lib/payments/paypal/`)

#### `config.ts`
- `getPayPalBase()` - Obtener URL base (sandbox/live)
- `getPayPalEnv()` - Obtener environment

#### `auth.ts`
- `getPayPalAccessToken()` - Obtener OAuth token

#### `api.ts`
- `createPayPalOrder(body)` - Crear orden
- `capturePayPalOrder(orderId)` - Capturar orden
- `getPayPalOrderDetails(orderId)` - Obtener detalles

#### `encoding.ts`
- `encodeCustomId(data)` - Codificar a pipe-delimited
- `decodeCustomId(encoded)` - Decodificar pipe-delimited
- `encodeInvoiceId(data)` - Codificar invoice_id (shortened)
- `decodeInvoiceId(encoded)` - Decodificar invoice_id
- `extractOrderId(event)` - Extraer order_id de webhook event

---

## 7. RESUMEN DE DUPLICACIÓN

| Lógica | Endpoints Afectados | LOC Duplicadas | Prioridad |
|--------|---------------------|----------------|-----------|
| **CORS Headers** | TODOS (11) | ~20 × 11 = 220 | 🔴 Alta |
| **Auth Token Extraction** | 4 endpoints | ~10 × 4 = 40 | 🔴 Alta |
| **Supabase Client** | TODOS (11) | ~5 × 11 = 55 | 🔴 Alta |
| **Price Fetching** | 4 endpoints | ~40 × 4 = 160 | 🔴 Alta |
| **Coupon Validation** | 2 endpoints | ~50 × 2 = 100 | 🟡 Media |
| **User Data Fetching** | 2 endpoints | ~15 × 2 = 30 | 🟡 Media |
| **URL Construction** | 4 endpoints | ~20 × 4 = 80 | 🟡 Media |
| **Payment Event Logging** | 6 endpoints | ~20 × 6 = 120 | 🔴 Alta |
| **Payment Insert** | 6 endpoints | ~30 × 6 = 180 | 🔴 Alta |
| **Enrollment Upsert** | 4 endpoints | ~25 × 4 = 100 | 🟡 Media |
| **Subscription Upgrade** | 3 endpoints | ~60 × 3 = 180 | 🔴 Alta |
| **Admin Role Check** | 2 endpoints | ~30 × 2 = 60 | 🔴 Alta (seguridad) |
| **Plan ID Resolution** | 2 endpoints | ~15 × 2 = 30 | 🟢 Baja |

**Total LOC duplicadas:** ~1,355 líneas

---

## 8. NOTAS ADICIONALES

### Diferencias Clave MP vs PayPal

| Aspecto | MercadoPago | PayPal |
|---------|-------------|--------|
| **Moneda** | ARS, USD, etc | USD principalmente |
| **Test Mode** | Env var `MP_MODE` + tokens separados | Env var `PAYPAL_ENV` + base URL |
| **Auth** | Access token directo | OAuth token con TTL |
| **Metadata** | `external_reference` (base64) + `metadata` object | `custom_id` (pipe-delimited) + `invoice_id` (shortened) |
| **Webhook** | Secret en URL | Firma (no implementada) |
| **Success Handler** | GET handler separado | Capture inline |
| **Back URLs** | success/failure/pending | return_url/cancel_url |

### Oportunidades de Mejora

1. **Webhook Signature Validation (PayPal):**  
   Actualmente no valida firma. Implementar según docs de PayPal.

2. **Logging Centralizado:**  
   Unificar console.log con helper de logging estructurado.

3. **Error Handling:**  
   Crear helper para respuestas de error consistentes.

4. **HTML Templates:**  
   Extraer templates HTML a archivos separados o helper.

5. **Timeout Handling:**  
   Agregar timeouts a llamadas externas (MP/PayPal).

6. **Retry Logic:**  
   Implementar retry en webhooks para casos de error temporal.

---

## 9. SIGUIENTE PASO RECOMENDADO

**Orden de refactorización sugerido:**

1. **Fase 1 - Fundación (Alta prioridad):**
   - `shared/cors.ts`
   - `shared/auth.ts`
   - `shared/supabase.ts`
   - `shared/types.ts`

2. **Fase 2 - Seguridad (Crítico):**
   - `shared/pricing.ts` (server-side pricing)
   - `shared/permissions.ts` (admin check)
   - `shared/coupons.ts` (coupon validation)

3. **Fase 3 - Providers (Media prioridad):**
   - `mp/config.ts`
   - `mp/api.ts`
   - `mp/encoding.ts`
   - `paypal/config.ts`
   - `paypal/auth.ts`
   - `paypal/api.ts`
   - `paypal/encoding.ts`

4. **Fase 4 - Business Logic (Media prioridad):**
   - `shared/events.ts`
   - `shared/database.ts`
   - `shared/enrollments.ts`
   - `shared/subscriptions.ts`
   - `shared/resolvers.ts`

5. **Fase 5 - Utilities (Baja prioridad):**
   - `shared/urls.ts`
   - `shared/user.ts`

6. **Fase 6 - Refactorización de Endpoints:**
   - Aplicar helpers a cada endpoint
   - Eliminar código duplicado
   - Testing completo

---

**FIN DEL ANÁLISIS**
