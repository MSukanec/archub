// /api/paypal/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time, paypal-cert-url, paypal-auth-algo, webhook-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// ---- Supabase admin client ----
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// ---- PayPal config ----
const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

// ---- Helpers ----
async function getPPToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const r = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`paypal_token_${r.status}`);
  const j = await r.json();
  return j.access_token;
}

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

function deepFindString(obj: any, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (key in obj && typeof obj[key] === "string") return obj[key];
  for (const k of Object.keys(obj)) {
    const found = deepFindString(obj[k], key);
    if (found) return found;
  }
  return null;
}

function extractOrderId(evt: any): string | null {
  const r = evt?.resource;
  if (
    evt?.event_type?.startsWith("CHECKOUT.ORDER") &&
    typeof r?.id === "string"
  )
    return r.id;
  const rel = r?.supplementary_data?.related_ids;
  if (rel?.order_id) return rel.order_id;
  const up = Array.isArray(r?.links)
    ? r.links.find(
        (l: any) => l?.rel === "up" && l.href?.includes("/v2/checkout/orders/"),
      )
    : null;
  if (up?.href) {
    const m = up.href.match(/\/v2\/checkout\/orders\/([^/?]+)/);
    if (m?.[1]) return m[1];
  }
  return deepFindString(evt, "order_id");
}

function parseInvoiceId(invoiceId: string) {
  const out: Record<string, string> = {};
  if (!invoiceId) return out;
  for (const part of invoiceId.split(";")) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (k && v) out[k] = v;
  }
  return out;
}

function addMonths(d: Date, months: number) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

async function getPlanIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[paypal/webhook] getPlanIdBySlug error:", error);
    return null;
  }
  return data?.id ?? null;
}

async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
}) {
  console.log('🏢 [paypal/webhook/upgradeOrganizationPlan] Starting upgrade...', params);
  
  const { error: cancelError } = await supabase
    .from('organization_subscriptions')
    .update({ 
      status: 'expired', 
      cancelled_at: new Date().toISOString() 
    })
    .eq('organization_id', params.organization_id)
    .eq('status', 'active');
  
  if (cancelError) {
    console.error('⚠️ [paypal/webhook/upgradeOrganizationPlan] Error cancelling previous subscription:', cancelError);
  }
  
  const expiresAt = new Date();
  if (params.billing_period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .insert({
      organization_id: params.organization_id,
      plan_id: params.plan_id,
      payment_id: params.payment_id,
      status: 'active',
      billing_period: params.billing_period,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount: params.amount,
      currency: params.currency,
    })
    .select()
    .single();
  
  if (subError) {
    console.error('❌ [paypal/webhook/upgradeOrganizationPlan] ERROR creating subscription:', subError);
    throw subError;
  }
  
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan_id: params.plan_id })
    .eq('id', params.organization_id);
  
  if (orgError) {
    console.error('❌ [paypal/webhook/upgradeOrganizationPlan] ERROR updating organization:', orgError);
    throw orgError;
  }
  
  console.log('✅ [paypal/webhook/upgradeOrganizationPlan] Success! Subscription created:', subscription);
  
  return subscription;
}

async function logPaymentEvent(row: {
  provider_event_id?: string | null;
  provider_event_type: string;
  status: string;
  raw_payload: any;
  order_id?: string | null;
  custom_id?: string | null;
  user_hint?: string | null;
  course_hint?: string | null;
  provider_payment_id?: string | null;
  amount?: number | null;
  currency?: string | null;
}) {
  const insert = {
    provider: "paypal",
    provider_event_id: row.provider_event_id ?? null,
    provider_event_type: row.provider_event_type,
    status: row.status,
    raw_payload: row.raw_payload ?? {},
    order_id: row.order_id ?? null,
    custom_id: row.custom_id ?? null,
    user_hint: row.user_hint ?? null,
    course_hint: row.course_hint ?? null,
    provider_payment_id: row.provider_payment_id ?? null,
    amount: row.amount ?? null,
    currency: row.currency ?? null,
  };

  const { error } = await supabase.from("payment_events").insert(insert);
  if (error)
    console.error("[paypal/webhook] payment_events insert error:", error, insert);
  else
    console.log("[paypal/webhook] ✅ payment_event insertado");
}

async function insertPayment(data: {
  provider_payment_id: string;
  user_id?: string | null;
  course_id?: string | null;
  amount: number | null;
  currency: string;
  status: string;
  product_type?: string | null;
  organization_id?: string | null;
  product_id?: string | null;
}) {
  const paymentData: any = {
    provider: "paypal",
    provider_payment_id: data.provider_payment_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    product_type: data.product_type || 'course',
  };

  if (!data.product_type || data.product_type === 'course') {
    paymentData.user_id = data.user_id;
    paymentData.course_id = data.course_id;
    paymentData.product_id = data.course_id;
  }

  if (data.product_type === 'subscription') {
    paymentData.organization_id = data.organization_id;
    paymentData.product_id = data.product_id;
  }

  const { error } = await supabase.from("payments").insert(paymentData);

  if (error) {
    if (error.code === '23505') {
      console.log('[paypal/webhook] ⚠️ Payment ya existe (ignorado)');
    } else {
      console.error("[paypal/webhook] payments insert error:", error);
    }
  } else {
    console.log("[paypal/webhook] ✅ payment insertado", data.product_type === 'subscription' ? '(subscription)' : '(course)');
  }
}

async function enrollUserInCourse(args: {
  user_id: string;
  course_id: string;
  months?: number | null;
}) {
  const startedAt = new Date();
  const expiresAt =
    args.months && args.months > 0 ? addMonths(startedAt, args.months) : null;

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      user_id: args.user_id,
      course_id: args.course_id,
      status: "active",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) console.error("[paypal/webhook] enrollUserInCourse error:", error);
}

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", cors["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", cors["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method !== "POST") {
    return res.status(405).setHeader("Access-Control-Allow-Origin", "*")
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    const json = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const eventType = json?.event_type ?? "UNKNOWN";

    console.log(`[PayPal webhook] 📨 Event received: ${eventType}`);

    let order_id = extractOrderId(json);
    let invoice_id = json?.resource?.purchase_units?.[0]?.invoice_id ?? null;
    if (!invoice_id && order_id) {
      invoice_id = await fetchOrderInvoiceId(order_id);
    }

    const resource = json?.resource;
    const amount = Number(resource?.amount?.value ?? resource?.purchase_units?.[0]?.amount?.value ?? 0);
    const currency = String(resource?.amount?.currency_code ?? resource?.purchase_units?.[0]?.amount?.currency_code ?? "USD");
    const captureId = resource?.id ?? null;
    const status = String(resource?.status ?? "").toUpperCase();

    let user_hint: string | null = null;
    let course_hint: string | null = null;
    let product_type: string | null = null;
    let organization_id: string | null = null;
    let plan_id: string | null = null;
    let plan_slug: string | null = null;
    let billing_period: 'monthly' | 'annual' | null = null;
    let months: number | null = null;

    if (invoice_id) {
      const parsed = parseInvoiceId(invoice_id);
      user_hint = parsed.user ?? null;
      course_hint = parsed.course ?? null;
      product_type = parsed.product_type ?? null;
      organization_id = parsed.organization_id ?? null;
      plan_id = parsed.plan_id ?? null;
      plan_slug = parsed.plan_slug ?? null;
      months = parsed.months ? Number(parsed.months) : null;
      
      const bp = parsed.billing_period;
      if (bp === 'monthly' || bp === 'annual') {
        billing_period = bp;
      }
    }

    console.log(`[PayPal webhook] 📦 Metadata extracted:`, {
      product_type,
      user_hint,
      course_hint,
      organization_id,
      plan_id,
      plan_slug,
      billing_period,
      amount,
      currency,
      status
    });

    await logPaymentEvent({
      provider_event_id: json.id ?? null,
      provider_event_type: eventType,
      status: "PROCESSED",
      raw_payload: json,
      order_id,
      custom_id: invoice_id,
      user_hint,
      course_hint,
      provider_payment_id: captureId,
      amount: amount || null,
      currency: currency,
    });

    const isApproved = eventType === "CHECKOUT.ORDER.APPROVED" || 
                       eventType === "PAYMENT.CAPTURE.COMPLETED" ||
                       status === "COMPLETED" ||
                       status === "APPROVED";

    if (isApproved) {
      console.log(`[PayPal webhook] ✅ Payment approved, processing...`);

      if (product_type === 'subscription') {
        console.log(`[PayPal webhook] 🏢 Processing SUBSCRIPTION payment`);
        
        if (organization_id && billing_period && captureId) {
          let resolvedPlanId = plan_id;
          
          if (!resolvedPlanId && plan_slug) {
            console.log(`[PayPal webhook] 🔍 Resolving plan_id from plan_slug: ${plan_slug}`);
            resolvedPlanId = await getPlanIdBySlug(plan_slug);
            
            if (!resolvedPlanId) {
              console.error(`[PayPal webhook] ❌ Failed to resolve plan_id from slug "${plan_slug}"`);
              return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
                .json({ ok: true, error: 'plan_not_found', plan_slug: plan_slug });
            }
            
            console.log(`[PayPal webhook] ✅ Resolved plan_id: ${resolvedPlanId}`);
          }
          
          if (!resolvedPlanId) {
            console.error(`[PayPal webhook] ❌ Missing both plan_id and plan_slug`);
            return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
              .json({ ok: true, error: 'missing_plan_data' });
          }
          
          await insertPayment({
            provider_payment_id: captureId,
            amount: amount || null,
            currency: currency,
            status: "completed",
            product_type: 'subscription',
            organization_id: organization_id,
            product_id: resolvedPlanId,
          });

          await upgradeOrganizationPlan({
            organization_id: organization_id,
            plan_id: resolvedPlanId,
            billing_period: billing_period,
            payment_id: captureId,
            amount: amount,
            currency: currency,
          });

          console.log(`[PayPal webhook] ✅ Subscription processed successfully`);
        } else {
          console.error(`[PayPal webhook] ❌ Missing subscription data:`, { organization_id, billing_period, captureId });
        }
      } else {
        console.log(`[PayPal webhook] 📚 Processing COURSE payment`);
        
        if (user_hint && course_hint && captureId) {
          await insertPayment({
            provider_payment_id: captureId,
            user_id: user_hint,
            course_id: course_hint,
            amount: amount || null,
            currency: currency,
            status: "completed",
            product_type: 'course',
          });

          await enrollUserInCourse({
            user_id: user_hint,
            course_id: course_hint,
            months: months,
          });

          console.log(`[PayPal webhook] ✅ Course enrollment processed successfully`);
        } else {
          console.error(`[PayPal webhook] ❌ Missing course data:`, { user_hint, course_hint, captureId });
        }
      }
    } else {
      console.log(`[PayPal webhook] ⚠️ Payment not approved yet. Status: ${status}, Event: ${eventType}`);
    }

    return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ ok: true });
  } catch (e: any) {
    console.error("[PayPal webhook] Error:", e);
    return res.status(200).setHeader("Access-Control-Allow-Origin", "*")
      .json({ ok: true, warn: "handler_error", error: String(e) });
  }
}
