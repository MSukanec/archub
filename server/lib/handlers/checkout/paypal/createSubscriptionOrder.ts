import type { Request } from "express";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext } from "../shared/urls.js";
import { createPayPalOrder } from "./api.js";
import { createSubscription as createPayPalSubscription } from "./subscriptions-api.js";
import { calculateProration } from "../shared/proration.js";
import { validateSubscriptionCoupon, createGiftedSubscription } from "../shared/subscription-coupons.js";
import { getAdminClient } from "../../../../routes/_base.js";
import { logPayPalMode } from "./config.js";

export type CreateSubscriptionOrderResult =
  | { success: true; orderId: string; approvalUrl: string; order: any; isRecurring?: boolean; subscriptionId?: string }
  | { success: true; gifted: true; subscriptionId: string; message: string }
  | { success: false; error: string; status?: number; details?: any };

export async function createSubscriptionOrder(
  req: Request
): Promise<CreateSubscriptionOrderResult> {
  try {
    const {
      plan_slug,
      organization_id,
      billing_period,
      amount_usd,
      description = "Seencel subscription",
      coupon_code,
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!plan_slug || !organization_id || !billing_period) {
      return {
        success: false,
        error: "Missing plan_slug, organization_id or billing_period",
        status: 400,
      };
    }

    const authResult = getAuthenticatedClient(req);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 401,
      };
    }

    const { supabase } = authResult;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[PayPal create-subscription-order] Auth error:", userError);
      return {
        success: false,
        error: "Authentication failed",
        status: 401,
      };
    }

    const user_id = user.id;

    const adminCheck = await verifyAdminRoleForOrganization(
      supabase,
      user_id,
      organization_id
    );

    if (!adminCheck.success) {
      console.error(
        "[PayPal create-subscription-order] Admin check failed:",
        adminCheck.error
      );
      return {
        success: false,
        error: adminCheck.error,
        status: 403,
      };
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount, paypal_plan_monthly_id, paypal_plan_annual_id")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return {
        success: false,
        error: "Plan not found or inactive",
        status: 404,
      };
    }

    const priceAmount =
      billing_period === "monthly"
        ? plan.monthly_amount
        : plan.annual_amount;

    const basePrice = Number(priceAmount);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      console.error('[PayPal create-subscription-order] Invalid price:', {
        plan_slug,
        billing_period,
        monthly_amount: plan.monthly_amount,
        annual_amount: plan.annual_amount
      });
      return {
        success: false,
        error: "Invalid price",
        status: 500,
      };
    }

    console.log('[PayPal create-subscription-order] Creating subscription order');

    // ============================================================
    // COUPON VALIDATION & GIFTED SUBSCRIPTION HANDLING
    // ============================================================
    if (coupon_code) {
      console.log('[PayPal create-subscription-order] Validating coupon:', coupon_code);
      
      // Get internal user ID for per-user limit validation
      const userData = await getUserData(supabase, user_id);
      
      const couponResult = await validateSubscriptionCoupon({
        supabase,
        couponCode: coupon_code,
        planId: plan.id,
        price: basePrice,
        currency: 'USD',
        userId: userData.id,
      });

      if (!couponResult.valid) {
        console.error('[PayPal create-subscription-order] Coupon validation failed:', couponResult.reason);
        return { 
          success: false, 
          error: couponResult.reason || "Invalid coupon", 
          status: 400 
        };
      }

      // If coupon gives 100% discount, create gifted subscription directly (no payment gateway)
      if (couponResult.isFree) {
        console.log('[PayPal create-subscription-order] 100% discount coupon - creating gifted subscription');
        
        const userData = await getUserData(supabase, user_id);
        const adminClient = getAdminClient();
        
        const giftedResult = await createGiftedSubscription({
          supabase: adminClient,
          authId: user_id,
          organizationId: organization_id,
          planId: plan.id,
          planSlug: plan_slug,
          billingPeriod: billing_period,
          couponId: couponResult.couponId!,
          couponCode: couponResult.couponCode!,
          userId: userData.id,
          currency: 'USD',
          payerEmail: user.email ?? undefined,
        });

        if (!giftedResult.success) {
          return { 
            success: false, 
            error: giftedResult.error || "Error creating gifted subscription", 
            status: 500 
          };
        }

        return {
          success: true,
          gifted: true,
          subscriptionId: giftedResult.subscriptionId,
          message: "Subscription activated with 100% discount coupon",
        };
      }

      // Partial discount: log for now (PayPal recurring subscriptions don't support dynamic pricing easily)
      console.log('[PayPal create-subscription-order] Partial discount coupon - proceeding with discounted price:', {
        discount: couponResult.discount,
        finalPrice: couponResult.finalPrice,
      });
    }

    const seats = 1;
    const amount = basePrice * seats;

    const productId = plan.id;
    const productTitle = `Plan ${plan.name} - ${billing_period === "monthly" ? "Monthly" : "Annual"}`;
    const productSlug = plan_slug;
    const productDescription = `${billing_period === "monthly" ? "Monthly" : "Annual"} subscription to ${plan.name} plan`;

    logPayPalMode("create-subscription-order");

    const { returnBase } = buildURLContext(req);

    const paypalPlanId = billing_period === "monthly" 
      ? plan.paypal_plan_monthly_id 
      : plan.paypal_plan_annual_id;

    if (paypalPlanId) {
      console.log("[PayPal create-subscription-order] Using PayPal Subscriptions API (recurring billing)");
      
      const custom_id = `${user_id}|${productId}|${organization_id}|${billing_period}`;
      
      const return_url = `${returnBase}/api/checkout/paypal/capture-subscription?type=recurring`;
      const cancel_url = `${returnBase}/organization/billing?payment=cancelled`;

      const planOverride = undefined;
      
      // NOTE: PayPal proration is temporarily disabled.
      // The current PayPal billing plans only have a single REGULAR cycle.
      // When we override the price, it affects ALL future renewals, not just the first payment.
      // 
      // TO FIX: Rebuild PayPal billing plans with two cycles:
      // 1. TRIAL cycle (sequence 1) - can be overridden for prorated amount
      // 2. REGULAR cycle (sequence 2) - stays at full price for renewals
      //
      // For now, upgrades will charge full price to ensure correct renewal amounts.
      // MercadoPago proration still works correctly.
      console.log("[PayPal create-subscription-order] Proration disabled - PayPal plans need TRIAL+REGULAR cycles");

      const subscriptionResult = await createPayPalSubscription({
        planId: paypalPlanId,
        subscriber: {
          name: {
            given_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
            surname: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
          },
          email_address: user.email || ''
        },
        customId: custom_id,
        returnUrl: return_url,
        cancelUrl: cancel_url,
        brandName: "Seencel",
        planOverride,
      });

      if (!subscriptionResult.success) {
        console.error("[PayPal create-subscription-order] Subscription API error:", subscriptionResult);
        return {
          success: false,
          error: subscriptionResult.error || "Failed to create PayPal subscription",
          status: 500,
          details: subscriptionResult
        };
      }

      const subscription = subscriptionResult.subscription;
      const approvalLink = subscription.links?.find((link: any) => link.rel === 'approve');

      if (!approvalLink?.href) {
        return {
          success: false,
          error: "No approval URL in PayPal response",
          status: 500,
          details: subscription
        };
      }

      console.log("[PayPal create-subscription-order] Recurring subscription created:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        hasPlanOverride: !!planOverride,
      });

      return {
        success: true,
        orderId: subscription.id,
        subscriptionId: subscription.id,
        approvalUrl: approvalLink.href,
        order: subscription,
        isRecurring: true
      };
    }

    console.log("[PayPal create-subscription-order] Using legacy CAPTURE flow (plan has no PayPal billing plan IDs)");
    
    const shortPlanId = productId.substring(0, 8);
    const shortUserId = user_id.substring(0, 8);
    const shortOrgId = organization_id.substring(0, 8);
    const timestamp = Date.now();

    const uniqueInvoiceId = `sub:${shortPlanId};u:${shortUserId};o:${shortOrgId};bp:${billing_period};ts:${timestamp}`;

    const custom_id = `${user_id}|${productId}|${organization_id}|${billing_period}`;

    const return_url = `${returnBase}/api/checkout/paypal/capture-subscription`;
    const cancel_url = `${returnBase}/organization/billing?payment=cancelled`;

    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: String(amount),
          },
          description: productDescription,
          invoice_id: uniqueInvoiceId,
          custom_id: custom_id,
        },
      ],
      application_context: {
        brand_name: "Seencel",
        user_action: "PAY_NOW",
        return_url,
        cancel_url,
      },
    };

    const result = await createPayPalOrder(orderBody);

    if (!result.success) {
      console.error(
        "[PayPal create-subscription-order] PayPal error:",
        result.body
      );
      return {
        success: false,
        error: result.error,
        status: result.status,
        details: result.body,
      };
    }

    return {
      success: true,
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      order: { id: result.orderId, links: [{ rel: "approve", href: result.approvalUrl }] },
      isRecurring: false
    };
  } catch (e: any) {
    console.error("[PayPal create-subscription-order] Fatal error:", e);
    return {
      success: false,
      error: String(e?.message || e),
      status: 500,
    };
  }
}
