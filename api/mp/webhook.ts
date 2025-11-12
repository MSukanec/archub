// /api/mp/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/** ====== ENV ====== */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Detectar modo test/producción
const MP_MODE = process.env.MP_MODE || "production";
const isTestMode = MP_MODE === "test";

// Usar credenciales según el modo
const MP_ACCESS_TOKEN = isTestMode 
  ? (process.env.MP_ACCESS_TOKEN_TEST || "")
  : (process.env.MP_ACCESS_TOKEN || "");
const MP_WEBHOOK_SECRET = isTestMode
  ? (process.env.MP_WEBHOOK_SECRET_TEST || "")
  : (process.env.MP_WEBHOOK_SECRET || "");

console.log(`[MP webhook] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** ====== UTILS ====== */
function send(res: VercelResponse, code: number, body: any) {
  return res
    .status(code)
    .setHeader("Content-Type", "application/json")
    .send(body);
}

async function parseBody(req: VercelRequest): Promise<any> {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {}
    }
  } catch {}
  try {
    // @ts-ignore
    const raw: string = await new Promise((resolve) => {
      let data = "";
      // @ts-ignore
      req.on("data", (c: Buffer) => (data += c.toString("utf8")));
      // @ts-ignore
      req.on("end", () => resolve(data));
    });
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {}
    const p = new URLSearchParams(raw);
    const obj = Object.fromEntries(p.entries());
    const id = p.get("data.id") || p.get("id");
    if (!obj["data"] && id) (obj as any).data = { id };
    return obj;
  } catch {
    return {};
  }
}

function addMonths(d: Date, months: number) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

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

/** Extrae metadata útil */
function extractMetadata(obj: any): {
  user_id?: string | null;
  course_slug?: string | null;
  months?: number | null;
  external_reference?: string | null;
  product_type?: string | null;
  organization_id?: string | null;
  plan_id?: string | null;
  plan_slug?: string | null;
  billing_period?: 'monthly' | 'annual' | null;
} {
  const md = obj?.metadata || obj?.additional_info || {};
  const months =
    md?.months != null
      ? Number(md.months)
      : obj?.months != null
        ? Number(obj.months)
        : null;

  const user_id =
    md?.user_id || obj?.user_id || obj?.payer?.id || obj?.client_id || null;

  const course_slug =
    md?.course_slug || obj?.course_slug || obj?.items?.[0]?.category_id || null;

  const external_reference =
    obj?.external_reference || md?.external_reference || null;

  const product_type = md?.product_type || null;
  const organization_id = md?.organization_id || null;
  const plan_id = md?.plan_id || null;
  const plan_slug = md?.plan_slug || null;
  const billing_period = md?.billing_period || null;

  return {
    user_id: user_id ? String(user_id) : null,
    course_slug: course_slug ? String(course_slug) : null,
    months: months && !Number.isNaN(months) ? months : null,
    external_reference: external_reference ? String(external_reference) : null,
    product_type: product_type ? String(product_type) : null,
    organization_id: organization_id ? String(organization_id) : null,
    plan_id: plan_id ? String(plan_id) : null,
    plan_slug: plan_slug ? String(plan_slug) : null,
    billing_period: billing_period === 'monthly' || billing_period === 'annual' ? billing_period : null,
  };
}

/** Si external_reference = "user|slug|months" lo parseamos */
function parseExtRef(ext?: string | null) {
  if (!ext) return {};
  const [u, s, m] = String(ext).split("|");
  return {
    user_id: u || null,
    course_slug: s || null,
    months: m === "null" ? null : Number.isFinite(Number(m)) ? Number(m) : null,
  };
}

/** Busca course_id por slug */
async function getCourseIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[webhook] getCourseIdBySlug error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Busca plan_id por slug */
async function getPlanIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[webhook] getPlanIdBySlug error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Upsert de enrollment */
async function upsertEnrollment(args: {
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
  if (error) console.error("[webhook] upsertEnrollment error:", error);
}

/** Upgrade organization plan - Copiado desde server/routes/payments.ts */
async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
}) {
  console.log('🏢 [webhook/upgradeOrganizationPlan] Starting upgrade...', params);
  
  // 1. Cancelar suscripción activa anterior (si existe)
  const { error: cancelError } = await supabase
    .from('organization_subscriptions')
    .update({ 
      status: 'expired', 
      cancelled_at: new Date().toISOString() 
    })
    .eq('organization_id', params.organization_id)
    .eq('status', 'active');
  
  if (cancelError) {
    console.error('⚠️ [webhook/upgradeOrganizationPlan] Error cancelling previous subscription:', cancelError);
  }
  
  // 2. Calcular expires_at
  const expiresAt = new Date();
  if (params.billing_period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  // 3. Crear nueva suscripción activa
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
    console.error('❌ [webhook/upgradeOrganizationPlan] ERROR creating subscription:', subError);
    throw subError;
  }
  
  // 4. Actualizar organizations.plan_id
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan_id: params.plan_id })
    .eq('id', params.organization_id);
  
  if (orgError) {
    console.error('❌ [webhook/upgradeOrganizationPlan] ERROR updating organization:', orgError);
    throw orgError;
  }
  
  console.log('✅ [webhook/upgradeOrganizationPlan] Success! Subscription created:', subscription);
  
  return subscription;
}

/** Inserta en payment_events (igual que PayPal) */
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
    provider: "mercadopago",
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
    console.error("[webhook] payment_events insert error:", error, insert);
  else
    console.log("[webhook] ✅ payment_event insertado");
}

/** Inserta en payments (solo si el pago está aprobado) */
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
    provider: "mercadopago",
    provider_payment_id: data.provider_payment_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    product_type: data.product_type || 'course',
  };

  // Para cursos (comportamiento anterior)
  if (!data.product_type || data.product_type === 'course') {
    paymentData.user_id = data.user_id;
    paymentData.course_id = data.course_id;
    paymentData.product_id = data.course_id;
  }

  // Para suscripciones
  if (data.product_type === 'subscription') {
    paymentData.organization_id = data.organization_id;
    paymentData.product_id = data.product_id; // plan_id
  }

  const { error } = await supabase.from("payments").insert(paymentData);

  if (error) {
    // Si el error es por duplicado (código 23505), lo ignoramos
    if (error.code === '23505') {
      console.log('[webhook] ⚠️ Payment ya existe (ignorado)');
    } else {
      console.error("[webhook] payments insert error:", error);
    }
  } else {
    console.log("[webhook] ✅ payment insertado", data.product_type === 'subscription' ? '(subscription)' : '(course)');
  }
}

/** ====== HANDLER ====== */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader(
        "Access-Control-Allow-Headers",
        "authorization, x-client-info, apikey, content-type",
      )
      .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
      .end();
  }

  // GET de salud
  if (req.method === "GET") {
    if (req.query?.ping) return send(res, 200, { ok: true, pong: true });
    return send(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return send(res, 200, { ok: true, note: "Method not processed" });
  }

  try {
    // Validación de secret (si lo usás en la URL del webhook)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[mp/webhook] secret mismatch");
        return send(res, 200, { ok: true, ignored: "secret mismatch" });
      }
    }

    const body = await parseBody(req);
    const type =
      body?.type ||
      body?.topic ||
      (typeof body?.action === "string"
        ? String(body.action).split(".")[0]
        : undefined);

    const idFromBody = body?.data?.id || body?.id || null;
    const idFromQuery =
      (req.query?.["data.id"] as string) ||
      (req.query?.["id"] as string) ||
      null;
    const finalId = idFromBody || idFromQuery || null;

    // === PAYMENT ===
    if (type === "payment" && finalId) {
      const pay = await mpGetPayment(String(finalId));
      const md = extractMetadata(pay);
      const fromExt = parseExtRef(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug = md.course_slug ?? fromExt.course_slug ?? null;

      const providerPaymentId = String(pay?.id ?? "");
      const status = String(pay?.status ?? "");
      const statusDetail = String(pay?.status_detail ?? "");
      const amount = Number(pay?.transaction_amount ?? 0);
      const currency = String(pay?.currency_id ?? "ARS");

      const productType = md.product_type || 'course';
      const organizationId = md.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug;
      const billingPeriod = md.billing_period;

      // Log detallado para pagos no aprobados
      if (status !== "approved") {
        console.log(`[MP webhook] ❌ Pago rechazado/pendiente:`);
        console.log(`  - Payment ID: ${providerPaymentId}`);
        console.log(`  - Status: ${status}`);
        console.log(`  - Status Detail: ${statusDetail}`);
        console.log(`  - Amount: ${amount} ${currency}`);
        console.log(`  - Product Type: ${productType}`);
        console.log(`  - User: ${resolvedUserId}`);
        console.log(`  - Course: ${resolvedSlug}`);
        console.log(`  - Organization: ${organizationId}`);
        console.log(`  - Plan ID: ${planIdFromMetadata}`);
        console.log(`  - Plan Slug: ${planSlug}`);
      }

      // 1. Insertar en payment_events
      await logPaymentEvent({
        provider_event_id: providerPaymentId,
        provider_event_type: "payment.webhook",
        status: "PROCESSED",
        raw_payload: pay,
        order_id: String(pay?.order?.id ?? ""),
        custom_id: md.external_reference ?? null,
        user_hint: resolvedUserId,
        course_hint: resolvedSlug,
        provider_payment_id: providerPaymentId,
        amount: amount || null,
        currency: currency,
      });

      // 2. Si está aprobado, procesar según product_type
      if (status === "approved") {
        if (productType === 'subscription') {
          console.log(`[MP webhook] 🏢 Processing SUBSCRIPTION payment`);
          
          if (organizationId && billingPeriod) {
            let resolvedPlanId = planIdFromMetadata;
            
            if (!resolvedPlanId && planSlug) {
              console.log(`[MP webhook] 🔍 Resolving plan_id from plan_slug: ${planSlug}`);
              resolvedPlanId = await getPlanIdBySlug(planSlug);
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                return send(res, 200, { ok: true, error: 'plan_not_found', plan_slug: planSlug });
              }
              
              console.log(`[MP webhook] ✅ Resolved plan_id: ${resolvedPlanId}`);
            }
            
            if (!resolvedPlanId) {
              console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
              return send(res, 200, { ok: true, error: 'missing_plan_data' });
            }
            
            // Insert payment (subscription)
            await insertPayment({
              provider_payment_id: providerPaymentId,
              amount: amount || null,
              currency: currency,
              status: "completed",
              product_type: 'subscription',
              organization_id: organizationId,
              product_id: resolvedPlanId,
            });

            // Upgrade organization plan
            await upgradeOrganizationPlan({
              organization_id: organizationId,
              plan_id: resolvedPlanId,
              billing_period: billingPeriod,
              payment_id: providerPaymentId,
              amount: amount,
              currency: currency,
            });

            console.log(`[MP webhook] ✅ Subscription processed successfully`);
          } else {
            console.error(`[MP webhook] ❌ Missing subscription data:`, { organizationId, billingPeriod });
          }
        } else {
          console.log(`[MP webhook] 📚 Processing COURSE payment`);
          
          // course_id si podemos
          let course_id: string | null = null;
          if (resolvedSlug) course_id = await getCourseIdBySlug(resolvedSlug);

          if (resolvedUserId && course_id) {
            // Insert payment (course)
            await insertPayment({
              provider_payment_id: providerPaymentId,
              user_id: resolvedUserId,
              course_id: course_id,
              amount: amount || null,
              currency: currency,
              status: "completed",
              product_type: 'course',
            });

            // Upsert enrollment
            await upsertEnrollment({
              user_id: resolvedUserId,
              course_id,
              months: effectiveMonths,
            });

            console.log(`[MP webhook] ✅ Course enrollment processed successfully`);
          } else {
            console.error(`[MP webhook] ❌ Missing course data:`, { resolvedUserId, course_id, resolvedSlug });
          }
        }
      }

      return send(res, 200, { ok: true, processed: "payment", id: finalId });
    }

    // === MERCHANT ORDER ===
    if (type === "merchant_order" && finalId) {
      const mo = await mpGetMerchantOrder(String(finalId));
      const md = extractMetadata(mo);
      const fromExt = parseExtRef(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug =
        md.course_slug ??
        fromExt.course_slug ??
        mo?.items?.[0]?.category_id ??
        null;

      const productType = md.product_type || 'course';
      const organizationId = md.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug;
      const billingPeriod = md.billing_period;

      // Log detallado del merchant_order
      console.log(`[MP webhook] 📦 Merchant Order recibida:`);
      console.log(`  - Order ID: ${mo?.id}`);
      console.log(`  - Total: ${mo?.total_amount}`);
      console.log(`  - Order Status: ${mo?.order_status}`);
      console.log(`  - Product Type: ${productType}`);
      console.log(`  - Plan ID: ${planIdFromMetadata}`);
      console.log(`  - Plan Slug: ${planSlug}`);
      console.log(`  - Payments:`, JSON.stringify(mo?.payments, null, 2));

      // ¿Hay pago aprobado?
      const approved = Array.isArray(mo?.payments)
        ? mo.payments.some((p: any) => String(p?.status) === "approved")
        : false;

      const orderId = String(mo?.id ?? "");
      const amount = Number(mo?.total_amount ?? 0);

      // 1. Insertar en payment_events
      await logPaymentEvent({
        provider_event_id: orderId,
        provider_event_type: "merchant_order.webhook",
        status: "PROCESSED",
        raw_payload: mo,
        order_id: orderId,
        custom_id: md.external_reference ?? null,
        user_hint: resolvedUserId,
        course_hint: resolvedSlug,
        provider_payment_id: null,
        amount: amount || null,
        currency: null,
      });

      // 2. Si está aprobado, procesar según product_type
      if (approved) {
        const approvedPayment = mo?.payments?.find((p: any) => String(p?.status) === "approved");
        const providerPaymentId = approvedPayment ? String(approvedPayment.id) : null;

        if (providerPaymentId) {
          if (productType === 'subscription') {
            console.log(`[MP webhook] 🏢 Processing SUBSCRIPTION merchant order`);
            
            if (organizationId && billingPeriod) {
              let resolvedPlanId = planIdFromMetadata;
              
              if (!resolvedPlanId && planSlug) {
                console.log(`[MP webhook] 🔍 Resolving plan_id from plan_slug: ${planSlug}`);
                resolvedPlanId = await getPlanIdBySlug(planSlug);
                
                if (!resolvedPlanId) {
                  console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                  return send(res, 200, { ok: true, error: 'plan_not_found', plan_slug: planSlug });
                }
                
                console.log(`[MP webhook] ✅ Resolved plan_id: ${resolvedPlanId}`);
              }
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
                return send(res, 200, { ok: true, error: 'missing_plan_data' });
              }
              
              // Insert payment (subscription)
              await insertPayment({
                provider_payment_id: providerPaymentId,
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                product_type: 'subscription',
                organization_id: organizationId,
                product_id: resolvedPlanId,
              });

              // Upgrade organization plan
              await upgradeOrganizationPlan({
                organization_id: organizationId,
                plan_id: resolvedPlanId,
                billing_period: billingPeriod,
                payment_id: providerPaymentId,
                amount: amount,
                currency: "ARS",
              });

              console.log(`[MP webhook] ✅ Subscription merchant order processed successfully`);
            } else {
              console.error(`[MP webhook] ❌ Missing subscription data in merchant order:`, { organizationId, billingPeriod });
            }
          } else {
            console.log(`[MP webhook] 📚 Processing COURSE merchant order`);
            
            // course_id si podemos
            let course_id: string | null = null;
            if (resolvedSlug) course_id = await getCourseIdBySlug(resolvedSlug);

            if (resolvedUserId && course_id) {
              await insertPayment({
                provider_payment_id: providerPaymentId,
                user_id: resolvedUserId,
                course_id: course_id,
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                product_type: 'course',
              });

              await upsertEnrollment({
                user_id: resolvedUserId,
                course_id,
                months: effectiveMonths,
              });

              console.log(`[MP webhook] ✅ Course merchant order processed successfully`);
            } else {
              console.error(`[MP webhook] ❌ Missing course data in merchant order:`, { resolvedUserId, course_id, resolvedSlug });
            }
          }
        }
      }

      return send(res, 200, {
        ok: true,
        processed: "merchant_order",
        id: finalId,
      });
    }

    // === OTROS / DESCONOCIDOS ===
    await logPaymentEvent({
      provider_event_id: finalId ?? null,
      provider_event_type: type || "unknown.webhook",
      status: "PROCESSED",
      raw_payload: body,
      order_id: null,
      custom_id: null,
      user_hint: null,
      course_hint: null,
      provider_payment_id: null,
      amount: null,
      currency: null,
    });

    return send(res, 200, {
      ok: true,
      received: true,
      type: type ?? null,
      id: finalId ?? null,
    });
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    // Respondemos 200 igual para evitar reintentos infinitos
    return send(res, 200, { ok: true, error: "logged" });
  }
}
