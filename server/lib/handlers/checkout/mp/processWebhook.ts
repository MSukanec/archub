import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { getMPPayment, getMPMerchantOrder } from "./api.js";
import { getMPPreapproval } from "./subscriptions-api.js";
import { extractMetadata, decodeExternalReference } from "./encoding.js";
import { MP_WEBHOOK_SECRET } from "./config.js";

export type ProcessWebhookResult =
  | { success: true; processed: string; id: string }
  | { success: false; error: string };

async function parseBody(req: Request): Promise<any> {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {}
    }
  } catch {}
  try {
    const raw: string = await new Promise((resolve) => {
      let data = "";
      req.on("data", (c: Buffer) => (data += c.toString("utf8")));
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

export async function processWebhook(req: Request): Promise<ProcessWebhookResult> {
  const supabase = createServiceSupabaseClient();

  try {
    // 1. Validate secret (temporarily disabled for debug)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[MP webhook] secret mismatch - CONTINUING FOR DEBUG");
      }
    }

    // 2. Parse body
    const body = await parseBody(req);
    const type = body?.type || body?.topic || 
      (typeof body?.action === "string" ? String(body.action).split(".")[0] : undefined);

    const idFromBody = body?.data?.id || body?.id || null;
    const idFromQuery = (req.query?.["data.id"] as string) || (req.query?.["id"] as string) || null;
    const finalId = idFromBody || idFromQuery || null;

    // === PAYMENT ===
    if (type === "payment" && finalId) {
      const pay = await getMPPayment(String(finalId));
      const md = extractMetadata(pay);
      const externalRef = md.external_reference || "";
      
      // Extract metadata from preferences tables
      let fromDb: any = null;
      let preferenceTable: string | null = null;

      if (externalRef.startsWith("mpu_") || externalRef.startsWith("mpr_") || externalRef.startsWith("mps_")) {
        preferenceTable = "mp_subscription_preferences";
        const { data: prefData, error: prefError } = await supabase
          .from("mp_subscription_preferences")
          .select("*")
          .eq("id", externalRef)
          .maybeSingle();
        
        if (prefData && !prefError) {
          fromDb = {
            user_id: prefData.user_id,
            organization_id: prefData.organization_id,
            plan_slug: prefData.plan_slug,
            plan_id: prefData.plan_id,
            billing_period: prefData.billing_period,
            product_type: prefData.product_type || (externalRef.startsWith("mpu_") ? 'subscription_upgrade' : 
                          externalRef.startsWith("mps_") ? 'seat' : 'subscription'),
            invitee_email: prefData.invitee_email,
            role_id: prefData.role_id,
            subscription_id: prefData.subscription_id,
            amount_ars: prefData.amount_ars,
            coupon_code: prefData.coupon_code,
            coupon_id: prefData.coupon_id,
          };
        }
      } else if (externalRef.startsWith("mp_")) {
        // Course: resolve course_id from course_slug via separate query
        // (We don't rely on mp_course_preferences table)
        if (md.course_slug) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("id")
            .eq("slug", md.course_slug)
            .maybeSingle();
          
          if (courseData) {
            fromDb = {
              course_id: courseData.id,
              product_type: 'course',
            };
          }
        }
      }

      // Fallback to old base64 method if no DB data
      const fromExt = fromDb || decodeExternalReference(externalRef);
      
      const providerPaymentId = String(pay?.id ?? "");
      const status = String(pay?.status ?? "");
      const amount = Number(pay?.transaction_amount ?? 0);
      const currency = String(pay?.currency_id ?? "ARS");

      // CRITICAL: Determine product type from external_reference prefix (most reliable)
      // DO NOT default to 'course' - fail fast if type cannot be determined
      let productType: string | null = null;
      
      if (externalRef.startsWith("mpu_")) {
        productType = 'subscription_upgrade';
      } else if (externalRef.startsWith("mpr_")) {
        productType = 'subscription';
      } else if (externalRef.startsWith("mps_")) {
        productType = 'seat';
      } else if (externalRef.startsWith("mp_")) {
        productType = 'course';
      } else if (md.product_type) {
        productType = md.product_type;
      } else if (fromExt.product_type) {
        productType = fromExt.product_type;
      }
      
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;

      // 1. Log RAW event
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: providerPaymentId,
        providerEventType: "payment.webhook",
        status: "RECEIVED",
        rawPayload: pay,
        orderId: String(pay?.order?.id ?? ""),
        customId: externalRef,
        userHint: resolvedUserId,
        courseHint: fromExt.course_slug || null,
        providerPaymentId: providerPaymentId,
        amount: amount || null,
        currency: currency,
      });

      // 2. Validate status is "approved"
      if (status !== "approved") {
        console.log(`[MP webhook] Payment not approved: ${status}`);
        return { success: true, processed: "not_approved", id: finalId };
      }

      // 3. Fail fast if product type cannot be determined
      if (!productType) {
        console.error(`[MP webhook] ❌ Cannot determine product_type from external_reference: ${externalRef}`);
        return { success: true, processed: "unknown_product_type", id: finalId };
      }

      // 4. Call appropriate RPC based on product type with VALIDATION
      if (productType === 'subscription' || productType === 'subscription_upgrade' || productType === 'seat') {
        // VALIDATE required identifiers for subscription-type payments
        if (!resolvedUserId) {
          console.error(`[MP webhook] ❌ Missing user_id for ${productType}`);
          return { success: true, processed: "missing_user_id", id: finalId };
        }
        
        if (!fromExt.organization_id) {
          console.error(`[MP webhook] ❌ Missing organization_id for ${productType}`);
          return { success: true, processed: "missing_organization_id", id: finalId };
        }

        // For new subscriptions and upgrades, plan_id is required
        if ((productType === 'subscription' || productType === 'subscription_upgrade') && !fromExt.plan_id) {
          console.error(`[MP webhook] ❌ Missing plan_id for ${productType}`);
          return { success: true, processed: "missing_plan_id", id: finalId };
        }

        // For seats, role_id is required
        if (productType === 'seat' && !fromExt.role_id) {
          console.error(`[MP webhook] ❌ Missing role_id for seat payment`);
          return { success: true, processed: "missing_role_id", id: finalId };
        }

        const metadata = {
          preference_id: externalRef,
          preference_table: preferenceTable,
          external_reference: externalRef,
          plan_slug: fromExt.plan_slug,
          invitee_email: fromExt.invitee_email,
          role_id: fromExt.role_id,
          subscription_id: fromExt.subscription_id,
          preapproval_id: pay?.preapproval_id || null,
        };

        console.log(`[MP webhook] Calling handle_payment_subscription_success:`, {
          provider: 'mercadopago',
          provider_payment_id: providerPaymentId,
          user_id: resolvedUserId,
          organization_id: fromExt.organization_id,
          plan_id: fromExt.plan_id,
          billing_period: fromExt.billing_period,
          product_type: productType,
          amount,
          currency,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
          p_provider: 'mercadopago',
          p_provider_payment_id: providerPaymentId,
          p_user_id: resolvedUserId,
          p_organization_id: fromExt.organization_id,
          p_plan_id: fromExt.plan_id || null,
          p_billing_period: fromExt.billing_period || null,
          p_amount: amount,
          p_currency: currency,
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[MP webhook] RPC error:`, rpcError);
          return { success: true, processed: "rpc_error", id: finalId };
        }

        console.log(`[MP webhook] ✅ RPC success:`, rpcResult);
        return { success: true, processed: productType, id: finalId };
      } 
      
      if (productType === 'course') {
        // VALIDATE required identifiers for course payments
        if (!resolvedUserId) {
          console.error(`[MP webhook] ❌ Missing user_id for course payment`);
          return { success: true, processed: "missing_user_id", id: finalId };
        }
        
        if (!fromExt.course_id) {
          console.error(`[MP webhook] ❌ Missing course_id for course payment`);
          return { success: true, processed: "missing_course_id", id: finalId };
        }

        const metadata = {
          preference_id: externalRef,
          preference_table: preferenceTable,
          course_slug: fromExt.course_slug,
          months: fromExt.months || 12,
          coupon_code: fromExt.coupon_code,
          coupon_id: fromExt.coupon_id,
        };

        console.log(`[MP webhook] Calling handle_payment_course_success:`, {
          provider: 'mercadopago',
          provider_payment_id: providerPaymentId,
          user_id: resolvedUserId,
          course_id: fromExt.course_id,
          amount,
          currency,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_course_success', {
          p_provider: 'mercadopago',
          p_provider_payment_id: providerPaymentId,
          p_user_id: resolvedUserId,
          p_course_id: fromExt.course_id,
          p_amount: amount,
          p_currency: currency,
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[MP webhook] RPC error:`, rpcError);
          return { success: true, processed: "rpc_error", id: finalId };
        }

        console.log(`[MP webhook] ✅ RPC success:`, rpcResult);
        return { success: true, processed: "course", id: finalId };
      }

      // Should never reach here since we validated productType above
      console.error(`[MP webhook] ❌ Unhandled product_type: ${productType}`);
      return { success: true, processed: "unhandled_product_type", id: finalId };
    }

    // === MERCHANT ORDER ===
    if (type === "merchant_order" && finalId) {
      const mo = await getMPMerchantOrder(String(finalId));
      
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: String(mo?.id ?? finalId),
        providerEventType: "merchant_order.webhook",
        status: "RECEIVED",
        rawPayload: mo,
        orderId: String(mo?.id ?? ""),
        customId: mo?.external_reference ?? null,
        userHint: null,
        courseHint: null,
        providerPaymentId: null,
        amount: mo?.total_amount ?? null,
        currency: null,
      });

      return { success: true, processed: "merchant_order", id: finalId };
    }

    // === SUBSCRIPTION PREAPPROVAL ===
    if (type === "subscription_preapproval" && finalId) {
      console.log("[MP webhook] Processing preapproval:", finalId);
      
      const preapprovalResult = await getMPPreapproval(String(finalId));
      
      if (!preapprovalResult.success) {
        console.error("[MP webhook] Failed to get preapproval:", preapprovalResult.error);
        return { success: true, processed: "preapproval_fetch_error", id: finalId };
      }
      
      const preapproval = preapprovalResult.preapproval;
      const status = preapproval?.status;
      const externalRef = preapproval?.external_reference || "";
      const amount = preapproval?.auto_recurring?.transaction_amount || 0;
      const currency = preapproval?.auto_recurring?.currency_id || "ARS";
      const payerEmail = preapproval?.payer_email || null;

      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: finalId,
        providerEventType: "subscription_preapproval",
        status: "RECEIVED",
        rawPayload: preapproval,
        orderId: null,
        customId: externalRef,
        userHint: null,
        courseHint: null,
        providerPaymentId: String(finalId),
        amount: amount || null,
        currency: currency,
      });

      // Only process authorized preapprovals
      if (status === "authorized") {
        // Get preference data
        const { data: prefData } = await supabase
          .from("mp_subscription_preferences")
          .select("*")
          .eq("id", externalRef)
          .maybeSingle();

        if (!prefData) {
          console.warn(`[MP webhook] No preference found for preapproval: ${externalRef}`);
          return { success: true, processed: "preapproval_no_preference", id: finalId };
        }

        const metadata = {
          preference_id: externalRef,
          preapproval_id: finalId,
          payer_email: payerEmail,
        };

        console.log(`[MP webhook] Calling handle_payment_subscription_success for preapproval:`, {
          provider: 'mercadopago',
          provider_payment_id: `preapproval_${finalId}`,
          user_id: prefData.user_id,
          organization_id: prefData.organization_id,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
          p_provider: 'mercadopago',
          p_provider_payment_id: `preapproval_${finalId}`,
          p_user_id: prefData.user_id,
          p_organization_id: prefData.organization_id,
          p_plan_id: prefData.plan_id,
          p_billing_period: prefData.billing_period,
          p_amount: amount,
          p_currency: currency,
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[MP webhook] RPC error for preapproval:`, rpcError);
          return { success: true, processed: "preapproval_rpc_error", id: finalId };
        }

        console.log(`[MP webhook] ✅ Preapproval RPC success:`, rpcResult);
      }

      return { success: true, processed: "preapproval", id: finalId };
    }

    // === SUBSCRIPTION AUTHORIZED PAYMENT (Automatic Renewal) ===
    if (type === "subscription_authorized_payment" && finalId) {
      console.log("[MP webhook] Processing subscription renewal:", finalId);
      
      const pay = await getMPPayment(String(finalId));
      const preapprovalId = pay.preapproval_id;
      const status = pay.status;
      const amount = pay.transaction_amount || 0;
      const currency = pay.currency_id || "ARS";
      
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: finalId,
        providerEventType: "subscription_authorized_payment",
        status: "RECEIVED",
        rawPayload: pay,
        orderId: null,
        customId: preapprovalId,
        userHint: null,
        courseHint: null,
        providerPaymentId: String(finalId),
        amount: amount || null,
        currency: currency,
      });

      if (status === "approved" && preapprovalId) {
        const metadata = {
          preapproval_id: preapprovalId,
          is_renewal: true,
        };

        console.log(`[MP webhook] Calling handle_payment_subscription_success for renewal:`, {
          provider: 'mercadopago',
          provider_payment_id: String(finalId),
          preapproval_id: preapprovalId,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
          p_provider: 'mercadopago',
          p_provider_payment_id: String(finalId),
          p_user_id: null,
          p_organization_id: null,
          p_plan_id: null,
          p_billing_period: null,
          p_amount: amount,
          p_currency: currency,
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[MP webhook] RPC error for renewal:`, rpcError);
          return { success: true, processed: "renewal_rpc_error", id: finalId };
        }

        console.log(`[MP webhook] ✅ Renewal RPC success:`, rpcResult);
      }

      return { success: true, processed: "subscription_renewal", id: finalId };
    }

    // === UNKNOWN / OTHER ===
    await logPaymentEvent(supabase, "mercadopago", {
      providerEventId: finalId ?? null,
      providerEventType: type || "unknown.webhook",
      status: "RECEIVED",
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
    console.error("[MP webhook] error:", e);
    return { success: false, error: e.message || String(e) };
  }
}
