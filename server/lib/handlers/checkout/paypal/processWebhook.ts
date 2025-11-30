import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { insertPayment } from "../shared/payments.js";
import { upsertEnrollment } from "../shared/enrollments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getPlanIdBySlug } from "../shared/helpers.js";
import { decodeInvoiceId, decodeCustomId } from "./encoding.js";
import { getPayPalAccessToken } from "./auth.js";
import { PAYPAL_BASE_URL } from "./config.js";
import { getSubscription } from "./subscriptions-api.js";

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
  if (
    evt?.event_type?.startsWith("CHECKOUT.ORDER") &&
    typeof r?.id === "string"
  )
    return r.id;
  const rel = r?.supplementary_data?.related_ids;
  if (rel?.order_id) return rel.order_id;
  const up = Array.isArray(r?.links)
    ? r.links.find(
        (l: any) => l?.rel === "up" && l.href?.includes("/v2/checkout/orders/")
      )
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

    // Map shortened keys to full keys for backward compatibility
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

async function handleSubscriptionEvent(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  json: any,
  eventType: string
): Promise<ProcessWebhookResult> {
  const resource = json?.resource;
  const subscriptionId = resource?.id;
  const customId = resource?.custom_id;
  const status = resource?.status;

  console.log(`[PayPal webhook] Processing ${eventType}:`, { subscriptionId, status, customId });

  if (!subscriptionId) {
    return { success: true, processed: false, eventType };
  }

  await logPaymentEvent(supabase, "paypal", {
    providerEventId: json.id,
    providerEventType: eventType,
    status: "PROCESSED",
    rawPayload: json,
    orderId: subscriptionId,
    customId: customId,
    providerPaymentId: subscriptionId,
  });

  if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({ 
        status: eventType.includes("CANCELLED") ? 'cancelled' : 'suspended',
        cancelled_at: new Date().toISOString() 
      })
      .eq('provider_subscription_id', subscriptionId);

    if (updateError) {
      console.error(`[PayPal webhook] Error updating subscription status:`, updateError);
    }
    return { success: true, processed: true, eventType };
  }

  return { success: true, processed: true, eventType };
}

async function handleSubscriptionRenewal(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  json: any,
  eventType: string
): Promise<ProcessWebhookResult> {
  const resource = json?.resource;
  const saleId = resource?.id;
  const billingAgreementId = resource?.billing_agreement_id;
  const amount = Number(resource?.amount?.total || resource?.amount?.value || 0);
  const currency = resource?.amount?.currency || "USD";
  const state = resource?.state?.toUpperCase();

  console.log(`[PayPal webhook] Processing renewal ${eventType}:`, { saleId, billingAgreementId, amount, state });

  if (!billingAgreementId || state !== "COMPLETED") {
    return { success: true, processed: false, eventType };
  }

  await logPaymentEvent(supabase, "paypal", {
    providerEventId: json.id,
    providerEventType: eventType,
    status: "PROCESSED",
    rawPayload: json,
    orderId: billingAgreementId,
    providerPaymentId: saleId,
    amount: amount,
    currency: currency,
  });

  const { data: existingSub, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('id, organization_id, plan_id, billing_period, amount, currency')
    .eq('provider_subscription_id', billingAgreementId)
    .eq('status', 'active')
    .maybeSingle();

  if (subError || !existingSub) {
    console.log(`[PayPal webhook] No active subscription found for billing agreement:`, billingAgreementId);
    return { success: true, processed: false, eventType };
  }

  const paymentResult = await insertPayment(supabase, "paypal", {
    providerPaymentId: saleId,
    organizationId: existingSub.organization_id,
    productId: existingSub.plan_id,
    amount: amount,
    currency: currency,
    status: "completed",
    productType: "subscription",
  });

  if (paymentResult.inserted) {
    const newExpiresAt = new Date();
    if (existingSub.billing_period === 'monthly') {
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
    } else {
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
    }

    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        expires_at: newExpiresAt.toISOString(),
        amount: amount,
      })
      .eq('id', existingSub.id);

    if (updateError) {
      console.error(`[PayPal webhook] Error extending subscription:`, updateError);
    } else {
      console.log(`[PayPal webhook] ✅ Subscription renewed for org ${existingSub.organization_id}, new expiry: ${newExpiresAt.toISOString()}`);
    }
  }

  return { success: true, processed: true, eventType };
}

export async function processWebhook(
  req: Request
): Promise<ProcessWebhookResult> {
  const supabase = createServiceSupabaseClient();

  try {
    const json =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const eventType = json?.event_type ?? "UNKNOWN";

    let order_id = extractOrderId(json);
    let invoice_id = json?.resource?.purchase_units?.[0]?.invoice_id ?? null;
    let custom_id_raw = json?.resource?.purchase_units?.[0]?.custom_id ?? null;

    if (!invoice_id && order_id) {
      invoice_id = await fetchOrderInvoiceId(order_id);
    }

    const resource = json?.resource;
    const amount = Number(
      resource?.amount?.value ??
        resource?.purchase_units?.[0]?.amount?.value ??
        0
    );
    const currency = String(
      resource?.amount?.currency_code ??
        resource?.purchase_units?.[0]?.amount?.currency_code ??
        "USD"
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

    // Try to decode custom_id first (contains full UUIDs)
    if (custom_id_raw) {
      try {
        // New pipe-delimited format
        if (custom_id_raw.includes("|")) {
          const parts = custom_id_raw.split("|");

          // Subscription format: user_id|plan_id|organization_id|billing_period (4 parts)
          if (
            parts.length === 4 &&
            (parts[3] === "monthly" || parts[3] === "annual")
          ) {
            user_hint = parts[0] || null;
            plan_id = parts[1] || null;
            organization_id = parts[2] || null;
            billing_period = parts[3];
            product_type = "subscription";
          }
          // Course format with coupon: user_id|course_id|coupon_code|coupon_id (4 parts)
          else if (parts.length === 4) {
            user_hint = parts[0] || null;
            course_hint = parts[1] || null;
            product_type = "course";
          }
          // Course format without coupon: user_id|course_id (2 parts)
          else if (parts.length === 2) {
            user_hint = parts[0] || null;
            course_hint = parts[1] || null;
            product_type = "course";
          }
        }
        // Old base64 JSON format (backward compatibility)
        else {
          const decoded = Buffer.from(custom_id_raw, "base64").toString("utf8");
          const customData = JSON.parse(decoded);

          // New format with shortened keys
          if (customData.u || customData.t) {
            user_hint = customData.u ?? null;
            product_type = customData.t ?? null;
            plan_slug = customData.ps ?? null;
            plan_id = customData.p ?? null;
            organization_id = customData.o ?? null;
            billing_period = customData.bp ?? null;
            course_hint = customData.c ?? null;
          }
          // Old format with full keys
          else if (customData.user_id || customData.product_type) {
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
        console.error(
          "[PayPal webhook] ⚠️ Failed to decode custom_id, falling back to invoice_id:",
          e
        );
      }
    }

    // Fallback to invoice_id if custom_id didn't provide data
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

    await logPaymentEvent(supabase, "paypal", {
      providerEventId: json.id ?? null,
      providerEventType: eventType,
      status: "PROCESSED",
      rawPayload: json,
      orderId: order_id,
      customId: invoice_id,
      userHint: user_hint,
      courseHint: course_hint,
      providerPaymentId: captureId,
      amount: amount || null,
      currency: currency,
    });

    if (eventType.startsWith("BILLING.SUBSCRIPTION")) {
      return handleSubscriptionEvent(supabase, json, eventType);
    }

    if (eventType === "PAYMENT.SALE.COMPLETED") {
      return handleSubscriptionRenewal(supabase, json, eventType);
    }

    const isApproved =
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      status === "COMPLETED" ||
      status === "APPROVED";

    if (isApproved) {
      if (product_type === "subscription") {
        if (organization_id && billing_period && captureId) {
          // CRITICAL: Resolve auth_id (user_hint) to users.id
          let publicUserId: string | null = null;
          if (user_hint) {
            const { data: userProfile, error: profileError } = await supabase
              .from("users")
              .select("id")
              .eq("auth_id", user_hint)
              .maybeSingle();

            if (profileError || !userProfile) {
              console.error("[PayPal webhook] ❌ Failed to resolve auth_id to user_id:", {
                auth_id: user_hint,
                error: profileError,
              });
              // Cannot proceed without user - log error and return
              return { success: true, processed: false, eventType };
            }
            
            publicUserId = userProfile.id;
          } else {
            console.error("[PayPal webhook] ❌ Missing user_hint for subscription");
            return { success: true, processed: false, eventType };
          }

          let resolvedPlanId = plan_id;

          if (!resolvedPlanId && plan_slug) {
            resolvedPlanId = await getPlanIdBySlug(supabase, plan_slug);

            if (!resolvedPlanId) {
              console.error(
                `[PayPal webhook] ❌ Failed to resolve plan_id from slug "${plan_slug}"`
              );
              return {
                success: false,
                error: "plan_not_found",
                warn: `plan_slug: ${plan_slug}`,
              };
            }
          }

          if (!resolvedPlanId) {
            console.error(`[PayPal webhook] ❌ Missing both plan_id and plan_slug`);
            return {
              success: false,
              error: "missing_plan_data",
            };
          }

          // Insert payment with idempotency
          const paymentResult = await insertPayment(supabase, "paypal", {
            providerPaymentId: captureId,
            userId: publicUserId, // ✅ CRITICAL: Pass resolved users.id
            amount: amount || null,
            currency: currency,
            status: "completed",
            productType: "subscription",
            organizationId: organization_id,
            productId: resolvedPlanId,
          });

          // IDEMPOTENT: Only upgrade organization if payment was NEWLY inserted
          if (paymentResult.inserted && paymentResult.paymentId) {
            await upgradeOrganizationPlan(supabase, {
              organizationId: organization_id,
              planId: resolvedPlanId,
              billingPeriod: billing_period,
              paymentId: paymentResult.paymentId, // ✅ Use UUID from payments table
              amount: amount,
              currency: currency,
            });
          } else if (!paymentResult.inserted) {
            // Duplicate webhook - payment already processed
          } else {
            console.error(`[PayPal webhook] ❌ No payment ID returned for subscription`);
          }
        } else {
          console.error(`[PayPal webhook] ❌ Missing subscription data:`, {
            organization_id,
            billing_period,
            captureId,
          });
        }
      } else {
        if (user_hint && course_hint && captureId) {
          await insertPayment(supabase, "paypal", {
            providerPaymentId: captureId,
            userId: user_hint,
            courseId: course_hint,
            amount: amount || null,
            currency: currency,
            status: "completed",
            productType: "course",
          });

          await upsertEnrollment(supabase, user_hint, course_hint, months);
        } else {
          console.error(`[PayPal webhook] ❌ Missing course data:`, {
            user_hint,
            course_hint,
            captureId,
          });
        }
      }

      return { success: true, processed: true, eventType };
    } else {
      return { success: true, processed: false, eventType };
    }
  } catch (e: any) {
    console.error("[PayPal webhook] Error:", e);
    return {
      success: false,
      error: String(e?.message || e),
      warn: "handler_error",
    };
  }
}
