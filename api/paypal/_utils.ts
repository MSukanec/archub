import { createClient } from '@supabase/supabase-js';

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function paypalBase() {
  const override = process.env.PAYPAL_BASE_URL;
  if (override) return override;
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

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

export function sbAdmin() {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function decodeCustomId(b64: string) {
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const obj = JSON.parse(json) as { type?: string; user_id?: string; course_slug?: string };
    return { userId: obj.user_id ?? null, courseSlug: obj.course_slug ?? null, type: obj.type ?? null };
  } catch {
    return { userId: null, courseSlug: null, type: null };
  }
}

export async function resolveCourseIdBySlug(slug: string | null) {
  if (!slug) return null;
  const sb = sbAdmin();
  const { data, error } = await sb.from('courses').select('id').eq('slug', slug).limit(1).maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

type EventInsert = {
  provider: 'paypal';
  provider_event_id?: string | null;
  provider_event_type?: string | null;
  status?: string | null;
  raw_headers?: Record<string, any> | null;
  raw_payload?: Record<string, any> | null;
  order_id?: string | null;
  custom_id?: string | null;
  user_hint?: string | null;
  course_hint?: string | null;
  amount?: number | null;
  currency?: string | null;
  provider_payment_id?: string | null;
};

export async function insertPaymentEvent(ev: EventInsert) {
  const sb = sbAdmin();
  const { error } = await sb.from('payment_events').insert({
    provider: ev.provider,
    provider_event_id: ev.provider_event_id ?? null,
    provider_event_type: ev.provider_event_type ?? null,
    status: ev.status ?? null,
    raw_headers: ev.raw_headers ?? null,
    raw_payload: ev.raw_payload ?? null,
    order_id: ev.order_id ?? null,
    custom_id: ev.custom_id ?? null,
    user_hint: ev.user_hint ?? null,
    course_hint: ev.course_hint ?? null,
    amount: ev.amount ?? null,
    currency: ev.currency ?? null,
    provider_payment_id: ev.provider_payment_id ?? null,
  });
  if (error) throw error;
}

export async function upsertPayment(params: {
  provider: 'paypal';
  providerPaymentId: string | null;
  userId: string;
  courseId: string;
  amount?: number | null;
  currency?: string | null;
  status?: 'completed' | 'refunded' | 'failed';
}) {
  const sb = sbAdmin();
  const { error } = await sb
    .from('payments')
    .upsert({
      provider: params.provider,
      provider_payment_id: params.providerPaymentId,
      user_id: params.userId,
      course_id: params.courseId,
      amount: params.amount ?? null,
      currency: params.currency ?? null,
      status: params.status ?? 'completed',
    }, { onConflict: 'provider,provider_payment_id' });
  if (error) throw error;
}

export async function upsertEnrollment(userId: string, courseId: string) {
  const sb = sbAdmin();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365);
  
  await sb.from('course_enrollments').upsert({
    user_id: userId,
    course_id: courseId,
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: 'user_id,course_id' });
}
