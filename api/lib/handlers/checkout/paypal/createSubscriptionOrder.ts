import type { VercelRequest } from "@vercel/node";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { buildURLContext } from "../shared/urls.js";
import { logPayPalMode } from "./config.js";
import { createPayPalOrder } from "./api.js";

export type CreateSubscriptionOrderResult =
  | { success: true; orderId: string; approvalUrl: string; order: any }
  | { success: false; error: string; status?: number; details?: any };

export async function createSubscriptionOrder(
  req: VercelRequest
): Promise<CreateSubscriptionOrderResult> {
  try {
    const {
      plan_slug,
      organization_id,
      billing_period,
      amount_usd,
      description = "Seencel subscription",
    } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log("[PayPal create-subscription-order] Request received:", {
      plan_slug,
      organization_id,
      billing_period,
      amount_usd,
    });

    // Validar parámetros requeridos
    if (!plan_slug || !organization_id || !billing_period) {
      return {
        success: false,
        error: "Missing plan_slug, organization_id or billing_period",
        status: 400,
      };
    }

    // SECURITY: Extract and validate auth token
    const authResult = getAuthenticatedClient(req);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 401,
      };
    }

    const { supabase } = authResult;

    // SECURITY: Get user_id from authenticated session, NOT from request body
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
    console.log("[PayPal create-subscription-order] Authenticated user:", user_id);

    // CRÍTICO: Verificar que el usuario pertenece a la organización y es admin
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

    // Obtener plan con precios en USD
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount")
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

    // SECURITY: Get price from plans table (USD base)
    const priceAmount =
      billing_period === "monthly"
        ? plan.monthly_amount
        : plan.annual_amount;

    const amount = Number(priceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
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

    const productId = plan.id;
    const productTitle = `Plan ${plan.name} - ${billing_period === "monthly" ? "Monthly" : "Annual"}`;
    const productSlug = plan_slug;
    const productDescription = `${billing_period === "monthly" ? "Monthly" : "Annual"} subscription to ${plan.name} plan`;

    console.log("[PayPal create-subscription-order] Subscription order:", {
      plan_id: plan.id,
      plan_name: plan.name,
      billing_period,
      amount,
      organization_id,
    });

    logPayPalMode("create-subscription-order");

    // Build URLs
    const { returnBase } = buildURLContext(req);

    // Generate unique invoice_id (PayPal max 127 chars)
    // Use shortened UUIDs (first 8 chars) for logging/debug only
    const shortPlanId = productId.substring(0, 8);
    const shortUserId = user_id.substring(0, 8);
    const shortOrgId = organization_id.substring(0, 8);
    const timestamp = Date.now();

    // Format: sub:UUID;u:UUID;o:UUID;bp:VALUE;ts:TIMESTAMP (~62 chars)
    const uniqueInvoiceId = `sub:${shortPlanId};u:${shortUserId};o:${shortOrgId};bp:${billing_period};ts:${timestamp}`;

    // Custom ID with FULL UUIDs in pipe-delimited format (PayPal max 127 chars)
    // Format: user_id|plan_id|organization_id|billing_period (~118 chars)
    const custom_id = `${user_id}|${productId}|${organization_id}|${billing_period}`;

    const return_url = `${returnBase}/api/paypal/capture-subscription`;
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

    console.log("[PayPal create-subscription-order] Creating order for:", {
      user_id,
      productSlug,
      amount,
      organization_id,
      billing_period,
      return_url,
      cancel_url,
    });

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

    console.log(
      "[PayPal create-subscription-order] ✅ Order created:",
      result.orderId
    );

    return {
      success: true,
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      order: { id: result.orderId, links: [{ rel: "approve", href: result.approvalUrl }] },
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
