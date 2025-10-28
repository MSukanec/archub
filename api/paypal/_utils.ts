import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

export function ok(res: VercelResponse, body: any, status = 200) {
  return res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

export function err(res: VercelResponse, message: string, status = 400, extra?: any) {
  return res
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify({ error: message, ...(extra ?? {}) }));
}

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function baseUrl() {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';
}

export async function getPayPalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const tokenRes = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`PayPal token error: ${tokenRes.status} ${text}`);
  }
  const json = await tokenRes.json();
  return json.access_token as string;
}

export async function paypalFetch(path: string, opts: RequestInit & { accessToken?: string } = {}) {
  const token = opts.accessToken ?? (await getPayPalAccessToken());
  const res = await fetch(`${baseUrl()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  let json: any;
  try { json = body ? JSON.parse(body) : null; } catch { json = body; }
  if (!res.ok) throw new Error(`PayPal ${path} ${res.status}: ${body}`);
  return json;
}

export async function getCoursePriceUSD(course_slug: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('course_prices')
    .select('currency_code, amount, courses!inner(slug)')
    .eq('courses.slug', course_slug)
    .eq('provider', 'paypal')
    .eq('is_active', true)
    .single();
  if (error || !data) throw new Error(`Precio no encontrado para ${course_slug} (paypal)`);
  return { currency: data.currency_code || 'USD', amount: String(data.amount) };
}

export async function logPayment(payload: {
  provider: 'paypal';
  payment_id: string;
  status: string;
  amount: string;
  currency: string;
  user_id?: string | null;
  course_slug?: string | null;
  raw?: any;
}) {
  const sb = supabaseAdmin();
  await sb.from('payments_log').insert({
    provider: payload.provider,
    payment_id: payload.payment_id,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency,
    user_id: payload.user_id ?? null,
    course_slug: payload.course_slug ?? null,
    raw: payload.raw ?? null,
  });
}

export async function enrollIfNeeded(user_id: string, course_slug: string) {
  const sb = supabaseAdmin();
  await sb.from('course_enrollments').upsert(
    { user_id, course_slug, started_at: new Date().toISOString() },
    { onConflict: 'user_id,course_slug' }
  );
}
