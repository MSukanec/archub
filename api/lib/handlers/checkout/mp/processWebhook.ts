import type { VercelRequest } from "@vercel/node";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { insertPayment } from "../shared/payments.js";
import { upsertEnrollment } from "../shared/enrollments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getCourseIdBySlug, getPlanIdBySlug } from "../shared/helpers.js";
import { markCouponAsUsed } from "../shared/coupons.js";
import { getMPPayment, getMPMerchantOrder } from "./api.js";
import { extractMetadata, decodeExternalReference } from "./encoding.js";
import { MP_WEBHOOK_SECRET } from "./config.js";

export type ProcessWebhookResult =
  | { success: true; processed: string; id: string }
  | { success: false; error: string };

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

export async function processWebhook(req: VercelRequest): Promise<ProcessWebhookResult> {
  const supabase = createServiceSupabaseClient();

  try {
    // 1. Validación de secret (TEMPORALMENTE DESHABILITADA PARA DEBUG)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      console.log("[mp/webhook] DEBUG - Secret from URL:", q);
      console.log("[mp/webhook] DEBUG - Secret from ENV:", MP_WEBHOOK_SECRET);
      console.log("[mp/webhook] DEBUG - Secrets match:", q === MP_WEBHOOK_SECRET);
      
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[mp/webhook] secret mismatch - PERO CONTINUANDO PARA DEBUG");
        // TEMPORALMENTE COMENTADO: return { success: true, processed: "ignored", id: "secret_mismatch" };
      }
    }

    // 2. Parse body
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
      const pay = await getMPPayment(String(finalId));
      const md = extractMetadata(pay);
      const fromExt = decodeExternalReference(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug = md.course_slug ?? fromExt.course_slug ?? null;

      const providerPaymentId = String(pay?.id ?? "");
      const status = String(pay?.status ?? "");
      const statusDetail = String(pay?.status_detail ?? "");
      const amount = Number(pay?.transaction_amount ?? 0);
      const currency = String(pay?.currency_id ?? "ARS");

      const productType = md.product_type || fromExt.product_type || 'course';
      const organizationId = md.organization_id || fromExt.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug || fromExt.plan_slug;
      const billingPeriod = md.billing_period || fromExt.billing_period;
      const couponCode = md.coupon_code || fromExt.coupon_code || null;
      const couponId = md.coupon_id || fromExt.coupon_id || null;

      // CRITICAL: Convert auth_id to public.users.id (required for both courses AND subscriptions)
      let publicUserId: string | null = null;
      if (resolvedUserId) {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", resolvedUserId)
          .maybeSingle();

        if (profileError || !userProfile) {
          console.error('[MP webhook] ❌ Failed to resolve auth_id to user_id:', {
            auth_id: resolvedUserId,
            error: profileError
          });
        } else {
          publicUserId = userProfile.id;
          console.log('[MP webhook] ✅ Resolved auth_id to user_id:', {
            auth_id: resolvedUserId,
            user_id: publicUserId
          });
        }
      }

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
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: providerPaymentId,
        providerEventType: "payment.webhook",
        status: "PROCESSED",
        rawPayload: pay,
        orderId: String(pay?.order?.id ?? ""),
        customId: md.external_reference ?? null,
        userHint: resolvedUserId,
        courseHint: resolvedSlug,
        providerPaymentId: providerPaymentId,
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
              resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                return { success: true, processed: "error", id: 'plan_not_found' };
              }
              
              console.log(`[MP webhook] ✅ Resolved plan_id: ${resolvedPlanId}`);
            }
            
            if (!resolvedPlanId) {
              console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
              return { success: true, processed: "error", id: 'missing_plan_data' };
            }
            
            // Insert payment (subscription) - userId is REQUIRED even for subscriptions
            await insertPayment(supabase, "mercadopago", {
              providerPaymentId: providerPaymentId,
              userId: publicUserId, // ✅ CRITICAL: Required for payments table
              amount: amount || null,
              currency: currency,
              status: "completed",
              productType: 'subscription',
              organizationId: organizationId,
              productId: resolvedPlanId,
            });

            // Upgrade organization plan
            await upgradeOrganizationPlan(supabase, {
              organizationId: organizationId,
              planId: resolvedPlanId,
              billingPeriod: billingPeriod as 'monthly' | 'annual',
              paymentId: providerPaymentId,
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
          if (resolvedSlug) course_id = await getCourseIdBySlug(supabase, resolvedSlug);

          if (publicUserId && course_id) {
            // Insert payment (course) - using publicUserId from public.users table
            const paymentResult = await insertPayment(supabase, "mercadopago", {
              providerPaymentId: providerPaymentId,
              userId: publicUserId,
              courseId: course_id,
              amount: amount || null,
              currency: currency,
              status: "completed",
              productType: 'course',
              couponCode: couponCode,
              couponId: couponId,
            });

            // IDEMPOTENT: Only mark coupon as used if payment was NEWLY inserted (not duplicate)
            if (paymentResult.inserted && couponId) {
              console.log(`[MP webhook] 🎟️ Marking coupon as used: ${couponCode} (${couponId})`);
              const couponResult = await markCouponAsUsed(supabase, couponId);
              if (!couponResult.success) {
                console.error(`[MP webhook] ⚠️ Failed to mark coupon as used:`, couponResult.error);
              }
            }

            // Upsert enrollment - using publicUserId
            await upsertEnrollment(supabase, publicUserId, course_id, effectiveMonths);

            console.log(`[MP webhook] ✅ Course enrollment processed successfully`);
          } else {
            console.error(`[MP webhook] ❌ Missing course data:`, { 
              auth_id: resolvedUserId, 
              publicUserId, 
              course_id, 
              resolvedSlug 
            });
          }
        }
      }

      return { success: true, processed: "payment", id: finalId };
    }

    // === MERCHANT ORDER ===
    if (type === "merchant_order" && finalId) {
      const mo = await getMPMerchantOrder(String(finalId));
      const md = extractMetadata(mo);
      const fromExt = decodeExternalReference(md.external_reference);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug =
        md.course_slug ??
        fromExt.course_slug ??
        mo?.items?.[0]?.category_id ??
        null;

      const productType = md.product_type || fromExt.product_type || 'course';
      const organizationId = md.organization_id || fromExt.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug || fromExt.plan_slug;
      const billingPeriod = md.billing_period || fromExt.billing_period;
      const couponCode = md.coupon_code || fromExt.coupon_code || null;
      const couponId = md.coupon_id || fromExt.coupon_id || null;

      // CRITICAL: Convert auth_id to public.users.id (required for both courses AND subscriptions - merchant_order)
      let moPublicUserId: string | null = null;
      if (resolvedUserId) {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", resolvedUserId)
          .maybeSingle();

        if (profileError || !userProfile) {
          console.error('[MP webhook] ❌ Failed to resolve auth_id to user_id (MO):', {
            auth_id: resolvedUserId,
            error: profileError
          });
        } else {
          moPublicUserId = userProfile.id;
          console.log('[MP webhook] ✅ Resolved auth_id to user_id (MO):', {
            auth_id: resolvedUserId,
            user_id: moPublicUserId
          });
        }
      }

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
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: orderId,
        providerEventType: "merchant_order.webhook",
        status: "PROCESSED",
        rawPayload: mo,
        orderId: orderId,
        customId: md.external_reference ?? null,
        userHint: resolvedUserId,
        courseHint: resolvedSlug,
        providerPaymentId: null,
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
                resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
                
                if (!resolvedPlanId) {
                  console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                  return { success: true, processed: "error", id: 'plan_not_found' };
                }
                
                console.log(`[MP webhook] ✅ Resolved plan_id: ${resolvedPlanId}`);
              }
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
                return { success: true, processed: "error", id: 'missing_plan_data' };
              }
              
              // Insert payment (subscription) - userId is REQUIRED even for subscriptions
              await insertPayment(supabase, "mercadopago", {
                providerPaymentId: providerPaymentId,
                userId: moPublicUserId, // ✅ CRITICAL: Required for payments table
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                productType: 'subscription',
                organizationId: organizationId,
                productId: resolvedPlanId,
              });

              // Upgrade organization plan
              await upgradeOrganizationPlan(supabase, {
                organizationId: organizationId,
                planId: resolvedPlanId,
                billingPeriod: billingPeriod as 'monthly' | 'annual',
                paymentId: providerPaymentId,
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
            if (resolvedSlug) course_id = await getCourseIdBySlug(supabase, resolvedSlug);

            if (moPublicUserId && course_id) {
              const paymentResult = await insertPayment(supabase, "mercadopago", {
                providerPaymentId: providerPaymentId,
                userId: moPublicUserId,
                courseId: course_id,
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                productType: 'course',
                couponCode: couponCode,
                couponId: couponId,
              });

              // IDEMPOTENT: Only mark coupon as used if payment was NEWLY inserted
              if (paymentResult.inserted && couponId) {
                console.log(`[MP webhook] 🎟️ Marking coupon as used (MO): ${couponCode} (${couponId})`);
                const couponResult = await markCouponAsUsed(supabase, couponId);
                if (!couponResult.success) {
                  console.error(`[MP webhook] ⚠️ Failed to mark coupon as used (MO):`, couponResult.error);
                }
              }

              await upsertEnrollment(supabase, moPublicUserId, course_id, effectiveMonths);

              console.log(`[MP webhook] ✅ Course merchant order processed successfully`);
            } else {
              console.error(`[MP webhook] ❌ Missing course data in merchant order:`, { 
                auth_id: resolvedUserId, 
                moPublicUserId, 
                course_id, 
                resolvedSlug 
              });
            }
          }
        }
      }

      return { success: true, processed: "merchant_order", id: finalId };
    }

    // === OTROS / DESCONOCIDOS ===
    await logPaymentEvent(supabase, "mercadopago", {
      providerEventId: finalId ?? null,
      providerEventType: type || "unknown.webhook",
      status: "PROCESSED",
      rawPayload: body,
      orderId: null,
      customId: null,
      userHint: null,
      courseHint: null,
      providerPaymentId: null,
      amount: null,
      currency: null,
    });

    return { success: true, processed: "received", id: type ?? 'null' };
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    return { success: false, error: e.message || String(e) };
  }
}
