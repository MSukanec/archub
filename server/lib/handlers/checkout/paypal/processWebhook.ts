import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { getPayPalAccessToken } from "./auth.js";
import { PAYPAL_BASE_URL } from "./config.js";

export type ProcessWebhookResult =
  | { success: true; processed: boolean; eventType: string }
  | { success: false; error: string; warn?: string };

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
  if (evt?.event_type?.startsWith("CHECKOUT.ORDER") && typeof r?.id === "string") return r.id;
  const rel = r?.supplementary_data?.related_ids;
  if (rel?.order_id) return rel.order_id;
  const up = Array.isArray(r?.links)
    ? r.links.find((l: any) => l?.rel === "up" && l.href?.includes("/v2/checkout/orders/"))
    : null;
  if (up?.href) {
    const m = up.href.match(/\/v2\/checkout\/orders\/([^/?]+)/);
    if (m?.[1]) return m[1];
  }
  return deepFindString(evt, "order_id");
}

async function fetchOrderInvoiceId(orderId: string): Promise<string | null> {
  try {
    const token = await getPayPalAccessToken();
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

function parseInvoiceId(invoiceId: string) {
  const out: Record<string, string> = {};
  if (!invoiceId) return out;
  for (const part of invoiceId.split(";")) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (!k || !v) continue;

    const keyMapping: Record<string, string> = {
      sub: "subscription",
      u: "user",
      o: "organization_id",
      bp: "billing_period",
      ts: "timestamp",
      p: "plan_id",
      c: "course",
      cpn: "coupon",
    };

    const mappedKey = keyMapping[k] || k;
    out[mappedKey] = v;
  }
  return out;
}

export async function processWebhook(req: Request): Promise<ProcessWebhookResult> {
  const supabase = createServiceSupabaseClient();

  try {
    const json = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const eventType = json?.event_type ?? "UNKNOWN";

    let order_id = extractOrderId(json);
    let invoice_id = json?.resource?.purchase_units?.[0]?.invoice_id ?? null;
    let custom_id_raw = json?.resource?.purchase_units?.[0]?.custom_id ?? null;

    if (!invoice_id && order_id) {
      invoice_id = await fetchOrderInvoiceId(order_id);
    }

    const resource = json?.resource;
    const amount = Number(
      resource?.amount?.value ?? resource?.purchase_units?.[0]?.amount?.value ?? 0
    );
    const currency = String(
      resource?.amount?.currency_code ?? resource?.purchase_units?.[0]?.amount?.currency_code ?? "USD"
    );
    const captureId = resource?.id ?? null;
    const status = String(resource?.status ?? "").toUpperCase();

    let user_hint: string | null = null;
    let course_hint: string | null = null;
    let product_type: string | null = null;
    let organization_id: string | null = null;
    let plan_id: string | null = null;
    let plan_slug: string | null = null;
    let billing_period: "monthly" | "annual" | null = null;
    let months: number | null = null;
    let coupon_code: string | null = null;
    let coupon_id: string | null = null;
    let role_id: string | null = null;
    let invitee_email: string | null = null;
    let subscription_id: string | null = null;
    let seat_preference_id: string | null = null;

    // Parse custom_id
    if (custom_id_raw) {
      try {
        if (custom_id_raw.includes("|")) {
          const parts = custom_id_raw.split("|");

          // Upgrade format: user_id|plan_id|organization_id|billing_period|upgrade|shortId (6 parts)
          if (parts.length === 6 && parts[4] === "upgrade") {
            user_hint = parts[0] || null;
            plan_id = parts[1] || null;
            organization_id = parts[2] || null;
            billing_period = (parts[3] as "monthly" | "annual") || null;
            product_type = "subscription_upgrade";
            // shortId is parts[5] - can lookup paypal_upgrade_preferences if needed
          }
          // Subscription format: user_id|plan_id|organization_id|billing_period (4 parts, last is monthly/annual)
          else if (parts.length === 4 && (parts[3] === "monthly" || parts[3] === "annual")) {
            user_hint = parts[0] || null;
            plan_id = parts[1] || null;
            organization_id = parts[2] || null;
            billing_period = parts[3];
            product_type = "subscription";
          }
          // Seat format: user_id|organization_id|role_id|pps_shortId (4 parts, last starts with pps_)
          else if (parts.length === 4 && parts[3]?.startsWith("pps_")) {
            user_hint = parts[0] || null;
            organization_id = parts[1] || null;
            role_id = parts[2] || null;
            seat_preference_id = parts[3];
            product_type = "seat";
            // Note: Seat payments are primarily handled by handleSeatCapture,
            // but we support webhook processing as fallback
          }
          // Course format with coupon: user_id|course_id|coupon_code|coupon_id (4 parts)
          else if (parts.length === 4) {
            user_hint = parts[0] || null;
            course_hint = parts[1] || null;
            coupon_code = parts[2] || null;
            coupon_id = parts[3] || null;
            product_type = "course";
          }
          // Course format without coupon: user_id|course_id (2 parts)
          else if (parts.length === 2) {
            user_hint = parts[0] || null;
            course_hint = parts[1] || null;
            product_type = "course";
          }
        } else {
          // Old base64 JSON format
          const decoded = Buffer.from(custom_id_raw, "base64").toString("utf8");
          const customData = JSON.parse(decoded);

          if (customData.u || customData.t) {
            user_hint = customData.u ?? null;
            product_type = customData.t ?? null;
            plan_slug = customData.ps ?? null;
            plan_id = customData.p ?? null;
            organization_id = customData.o ?? null;
            billing_period = customData.bp ?? null;
            course_hint = customData.c ?? null;
          } else if (customData.user_id || customData.product_type) {
            user_hint = customData.user_id ?? null;
            course_hint = customData.course_id ?? null;
            product_type = customData.product_type ?? null;
            plan_slug = customData.plan_slug ?? null;
            plan_id = customData.plan_id ?? null;
            organization_id = customData.organization_id ?? null;
            billing_period = customData.billing_period ?? null;
          }
        }
      } catch (e) {
        console.error("[PayPal webhook] ⚠️ Failed to decode custom_id:", e);
      }
    }

    // Fallback to invoice_id
    if (!user_hint && !organization_id && invoice_id) {
      const parsed = parseInvoiceId(invoice_id);
      user_hint = parsed.user ?? null;
      course_hint = parsed.course ?? null;
      product_type = parsed.product_type ?? null;
      organization_id = parsed.organization_id ?? null;
      plan_id = parsed.plan_id ?? null;
      plan_slug = parsed.plan_slug ?? null;
      months = parsed.months ? Number(parsed.months) : null;

      const bp = parsed.billing_period;
      if (bp === "monthly" || bp === "annual") {
        billing_period = bp;
      }
    }

    // Fetch seat preference data if we detected a seat payment
    if (product_type === "seat" && seat_preference_id) {
      const { data: seatPref, error: seatPrefError } = await supabase
        .from("paypal_seat_preferences")
        .select("*")
        .eq("id", seat_preference_id)
        .maybeSingle();

      if (seatPref && !seatPrefError) {
        // Enrich with seat preference data
        invitee_email = seatPref.invitee_email || null;
        subscription_id = seatPref.subscription_id || null;
        billing_period = seatPref.billing_period as "monthly" | "annual" || null;
        // Ensure we have the user_id from preference if not already set
        if (!user_hint) user_hint = seatPref.user_id;
        if (!organization_id) organization_id = seatPref.organization_id;
        if (!role_id) role_id = seatPref.role_id;
        console.log("[PayPal webhook] Enriched seat data from preference:", seat_preference_id);
      } else {
        console.warn("[PayPal webhook] ⚠️ Could not fetch seat preference:", seat_preference_id, seatPrefError);
      }
    }

    // 1. Log RAW event
    await logPaymentEvent(supabase, "paypal", {
      providerEventId: json.id ?? null,
      providerEventType: eventType,
      status: "RECEIVED",
      rawPayload: json,
      orderId: order_id,
      customId: invoice_id,
      userHint: user_hint,
      courseHint: course_hint,
      providerPaymentId: captureId,
      amount: amount || null,
      currency: currency,
    });

    // === SUBSCRIPTION LIFECYCLE EVENTS ===
    if (eventType.startsWith("BILLING.SUBSCRIPTION")) {
      const subscriptionId = resource?.id;
      const customId = resource?.custom_id;
      const subscriptionStatus = resource?.status;

      console.log(`[PayPal webhook] Processing ${eventType}:`, { subscriptionId, subscriptionStatus });

      if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
        const metadata = {
          subscription_id: subscriptionId,
          custom_id: customId,
          event_type: eventType,
        };

        const { error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
          p_provider: 'paypal',
          p_provider_payment_id: subscriptionId,
          p_user_id: null,
          p_organization_id: null,
          p_plan_id: null,
          p_billing_period: null,
          p_product_type: eventType.includes("CANCELLED") ? 'subscription_cancelled' : 'subscription_suspended',
          p_amount: 0,
          p_currency: 'USD',
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[PayPal webhook] RPC error for ${eventType}:`, rpcError);
        }
      }

      return { success: true, processed: true, eventType };
    }

    // === SUBSCRIPTION RENEWAL (PAYMENT.SALE.COMPLETED) ===
    if (eventType === "PAYMENT.SALE.COMPLETED") {
      const saleId = resource?.id;
      const billingAgreementId = resource?.billing_agreement_id;
      const saleAmount = Number(resource?.amount?.total || resource?.amount?.value || 0);
      const saleCurrency = resource?.amount?.currency || "USD";
      const state = resource?.state?.toUpperCase();

      console.log(`[PayPal webhook] Processing renewal:`, { saleId, billingAgreementId, state });

      if (billingAgreementId && state === "COMPLETED") {
        const metadata = {
          sale_id: saleId,
          billing_agreement_id: billingAgreementId,
          is_renewal: true,
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
          p_provider: 'paypal',
          p_provider_payment_id: saleId,
          p_user_id: null,
          p_organization_id: null,
          p_plan_id: null,
          p_billing_period: null,
          p_product_type: 'subscription_renewal',
          p_amount: saleAmount,
          p_currency: saleCurrency,
          p_metadata: metadata,
        });

        if (rpcError) {
          console.error(`[PayPal webhook] RPC error for renewal:`, rpcError);
        } else {
          console.log(`[PayPal webhook] ✅ Renewal RPC success:`, rpcResult);
        }
      }

      return { success: true, processed: true, eventType };
    }

    // 2. Validate status is approved/completed
    const isApproved =
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      status === "COMPLETED" ||
      status === "APPROVED";

    if (!isApproved) {
      console.log(`[PayPal webhook] Event not approved: ${eventType}, status: ${status}`);
      return { success: true, processed: false, eventType };
    }

    // 3. Call appropriate RPC based on product type with VALIDATION
    if (product_type === "subscription" || product_type === "subscription_upgrade" || product_type === "seat") {
      // VALIDATE common required identifiers
      if (!user_hint) {
        console.error(`[PayPal webhook] ❌ Missing user_id for ${product_type}`);
        return { success: true, processed: false, eventType };
      }
      
      if (!organization_id) {
        console.error(`[PayPal webhook] ❌ Missing organization_id for ${product_type}`);
        return { success: true, processed: false, eventType };
      }
      
      if (!captureId) {
        console.error(`[PayPal webhook] ❌ Missing captureId for ${product_type}`);
        return { success: true, processed: false, eventType };
      }

      // For subscription and subscription_upgrade, plan_id is required
      if ((product_type === "subscription" || product_type === "subscription_upgrade") && !plan_id) {
        console.error(`[PayPal webhook] ❌ Missing plan_id for ${product_type}`);
        return { success: true, processed: false, eventType };
      }
      
      // For subscription, billing_period is required
      if (product_type === "subscription" && !billing_period) {
        console.error(`[PayPal webhook] ❌ Missing billing_period for subscription`);
        return { success: true, processed: false, eventType };
      }

      // For seats, role_id is required
      if (product_type === "seat" && !role_id) {
        console.error(`[PayPal webhook] ❌ Missing role_id for seat payment`);
        return { success: true, processed: false, eventType };
      }

      const metadata: Record<string, any> = {
        order_id: order_id,
        invoice_id: invoice_id,
        plan_slug: plan_slug,
      };

      // Add seat-specific metadata
      if (product_type === "seat") {
        metadata.role_id = role_id;
        metadata.invitee_email = invitee_email;
        metadata.subscription_id = subscription_id;
        metadata.seat_preference_id = seat_preference_id;
      }

      console.log(`[PayPal webhook] Calling handle_payment_subscription_success:`, {
        provider: 'paypal',
        provider_payment_id: captureId,
        user_id: user_hint,
        organization_id,
        plan_id,
        billing_period,
        product_type,
      });

      const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_subscription_success', {
        p_provider: 'paypal',
        p_provider_payment_id: captureId,
        p_user_id: user_hint,
        p_organization_id: organization_id,
        p_plan_id: plan_id,
        p_billing_period: billing_period,
        p_product_type: product_type,
        p_amount: amount,
        p_currency: currency,
        p_metadata: metadata,
      });

      if (rpcError) {
        console.error(`[PayPal webhook] RPC error:`, rpcError);
        return { success: false, error: "rpc_error", warn: rpcError.message };
      }

      console.log(`[PayPal webhook] ✅ ${product_type} RPC success:`, rpcResult);
      return { success: true, processed: true, eventType };
    }

    // Course purchase
    if (product_type === "course") {
      // VALIDATE all required identifiers
      if (!user_hint) {
        console.error(`[PayPal webhook] ❌ Missing user_id for course purchase`);
        return { success: true, processed: false, eventType };
      }
      
      if (!course_hint) {
        console.error(`[PayPal webhook] ❌ Missing course_id for course purchase`);
        return { success: true, processed: false, eventType };
      }
      
      if (!captureId) {
        console.error(`[PayPal webhook] ❌ Missing captureId for course purchase`);
        return { success: true, processed: false, eventType };
      }

      const metadata = {
        order_id: order_id,
        invoice_id: invoice_id,
        months: months || 12,
        coupon_code: coupon_code,
        coupon_id: coupon_id,
      };

      console.log(`[PayPal webhook] Calling handle_payment_course_success:`, {
        provider: 'paypal',
        provider_payment_id: captureId,
        user_id: user_hint,
        course_id: course_hint,
      });

      const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_course_success', {
        p_provider: 'paypal',
        p_provider_payment_id: captureId,
        p_user_id: user_hint,
        p_course_id: course_hint,
        p_amount: amount,
        p_currency: currency,
        p_metadata: metadata,
      });

      if (rpcError) {
        console.error(`[PayPal webhook] RPC error:`, rpcError);
        return { success: false, error: "rpc_error", warn: rpcError.message };
      }

      console.log(`[PayPal webhook] ✅ Course RPC success:`, rpcResult);
      return { success: true, processed: true, eventType };
    }

    // Fail fast if product_type is unknown or not provided
    if (!product_type) {
      console.error(`[PayPal webhook] ❌ Cannot determine product_type from event data`);
    } else {
      console.error(`[PayPal webhook] ❌ Unhandled product_type: ${product_type}`);
    }
    return { success: true, processed: false, eventType };
  } catch (e: any) {
    console.error("[PayPal webhook] Error:", e);
    return {
      success: false,
      error: String(e?.message || e),
      warn: "handler_error",
    };
  }
}
