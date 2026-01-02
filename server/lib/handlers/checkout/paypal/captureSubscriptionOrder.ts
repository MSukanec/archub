import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { capturePayPalOrder } from "./api.js";
import { getSubscription } from "./subscriptions-api.js";

export type CaptureSubscriptionOrderResult =
  | { success: true; html: string; upgraded: boolean }
  | { success: false; error: string; html: string };

const ERROR_HTML = (message: string, detail?: string) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Error - Seencel</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
    <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h1 style="color: #dc2626;">⚠️ Error</h1>
      <p>${message}</p>
      ${detail ? `<p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">${detail}</p>` : ''}
      <p style="margin-top: 1rem;">
        <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
      </p>
    </div>
  </body>
</html>
`;

const SUCCESS_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Pago Exitoso - Seencel</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
    <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
      <h1 style="color: #16a34a;">✅ Pago Exitoso</h1>
      <p>Tu suscripción ha sido procesada correctamente.</p>
      <p style="color: #6b7280;">Redirigiendo...</p>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
    <script>
      setTimeout(() => {
        window.location.href = '/organization/billing?payment=success';
      }, 2000);
    </script>
  </body>
</html>
`;

export async function captureSubscriptionOrder(
  req: Request
): Promise<CaptureSubscriptionOrderResult> {
  const supabase = createServiceSupabaseClient();

  try {
    const { token, subscription_id, PayerID, type } = req.query;

    const isRecurring = type === "recurring" || subscription_id;
    const subscriptionIdParam = (subscription_id || token) as string | undefined;

    if (isRecurring && subscriptionIdParam) {
      return handleRecurringSubscription(supabase, subscriptionIdParam);
    }

    return handleLegacyCaptureFlow(supabase, token as string | undefined);
  } catch (e: any) {
    console.error("[PayPal capture-subscription] Error fatal:", e);
    return {
      success: false,
      error: String(e?.message || e),
      html: ERROR_HTML(
        "Hubo un problema al procesar tu suscripción.",
        String(e?.message || e)
      ),
    };
  }
}

async function handleRecurringSubscription(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  subscriptionId: string
): Promise<CaptureSubscriptionOrderResult> {
  console.log("[PayPal capture-subscription] Processing recurring subscription:", subscriptionId);

  const subscriptionResult = await getSubscription(subscriptionId);

  if (!subscriptionResult.success || !subscriptionResult.subscription) {
    console.error("[PayPal capture-subscription] Failed to get subscription:", subscriptionResult);
    return {
      success: false,
      error: "No se pudo verificar la suscripción en PayPal.",
      html: ERROR_HTML("No se pudo verificar la suscripción en PayPal."),
    };
  }

  const subscription = subscriptionResult.subscription;
  const status = subscription.status;
  const customId = subscription.custom_id || null;

  console.log("[PayPal capture-subscription] Subscription status:", {
    id: subscriptionId,
    status,
    customId
  });

  if (status !== "ACTIVE" && status !== "APPROVED") {
    console.error("[PayPal capture-subscription] Subscription not active:", status);
    return {
      success: false,
      error: `La suscripción no está activa (estado: ${status}).`,
      html: ERROR_HTML(`La suscripción no está activa (estado: ${status}).`),
    };
  }

  let authId: string | null = null;
  let planId: string | null = null;
  let organizationId: string | null = null;
  let billingPeriod: "monthly" | "annual" | null = null;

  if (customId && customId.includes("|")) {
    const parts = customId.split("|");
    if (parts.length === 4) {
      authId = parts[0] || null;
      planId = parts[1] || null;
      organizationId = parts[2] || null;
      billingPeriod = parts[3] === "monthly" || parts[3] === "annual" ? parts[3] : null;
    }
  }

  if (!authId || !planId || !organizationId || !billingPeriod) {
    console.error("[PayPal capture-subscription] Invalid custom_id format:", customId);
    return {
      success: false,
      error: "No se pudo procesar la información de la suscripción.",
      html: ERROR_HTML("No se pudo procesar la información de la suscripción."),
    };
  }

  let publicUserId: string | null = null;
  
  // First try to find user by id (custom_id stores users.id since createSubscriptionOrder)
  const { data: userById, error: userByIdError } = await supabase
    .from("users")
    .select("id")
    .eq("id", authId)
    .maybeSingle();

  if (userById && !userByIdError) {
    publicUserId = userById.id;
    console.log("[PayPal capture-subscription] Found user by id:", publicUserId);
  } else {
    // Fallback: try to find by auth_id for backward compatibility
    const { data: userByAuthId, error: authIdError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .maybeSingle();

    if (userByAuthId && !authIdError) {
      publicUserId = userByAuthId.id;
      console.log("[PayPal capture-subscription] Found user by auth_id (fallback):", publicUserId);
    } else {
      console.error("[PayPal capture-subscription] ❌ Failed to resolve user:", {
        userIdHint: authId,
        byIdError: userByIdError,
        byAuthIdError: authIdError,
      });
      return {
        success: true,
        html: SUCCESS_HTML,
        upgraded: false,
      };
    }
  }

  const billingInfo = subscription.billing_info;
  const lastPayment = billingInfo?.last_payment;
  const amountValue = lastPayment?.amount?.value || subscription.plan?.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value || "0";
  const currencyCode = lastPayment?.amount?.currency_code || "USD";

  await logPaymentEvent(supabase, "paypal", {
    providerEventId: subscriptionId,
    providerEventType: "BILLING.SUBSCRIPTION.ACTIVATED",
    status: "PROCESSED",
    rawPayload: subscription,
    orderId: subscriptionId,
    customId: customId,
    userHint: authId,
    providerPaymentId: subscriptionId,
    amount: parseFloat(amountValue),
    currency: currencyCode,
  });

  const paymentResult = await insertPayment(supabase, "paypal", {
    providerPaymentId: subscriptionId,
    userId: publicUserId,
    organizationId: organizationId,
    productId: planId,
    amount: parseFloat(amountValue),
    currency: currencyCode,
    status: "completed",
    productType: "subscription",
  });

  let upgraded = false;

  if (paymentResult.inserted && paymentResult.paymentId) {
    await upgradeOrganizationPlan(supabase, {
      organizationId: organizationId,
      planId: planId,
      billingPeriod: billingPeriod,
      paymentId: paymentResult.paymentId,
      amount: parseFloat(amountValue),
      currency: currencyCode,
      userId: publicUserId,
      providerSubscriptionId: subscriptionId,
    });

    upgraded = true;
    console.log("[PayPal capture-subscription] ✅ Recurring subscription activated:", {
      subscriptionId,
      organizationId,
      planId,
      billingPeriod
    });
  }

  return {
    success: true,
    html: SUCCESS_HTML,
    upgraded,
  };
}

async function handleLegacyCaptureFlow(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  token: string | undefined
): Promise<CaptureSubscriptionOrderResult> {
  console.log("[PayPal capture-subscription] Processing legacy CAPTURE flow");

  if (!token || typeof token !== "string") {
    return {
      success: false,
      error: "No se encontró el token del pago.",
      html: ERROR_HTML("No se encontró el token del pago."),
    };
  }

  let captureData: any;
  try {
    captureData = await capturePayPalOrder(token);
  } catch (e: any) {
    console.error("[PayPal capture-subscription] Capture failed:", e);
    return {
      success: false,
      error: "No pudimos completar el pago en PayPal.",
      html: ERROR_HTML("No pudimos completar el pago en PayPal."),
    };
  }

  const orderId = captureData.id;
  const status = captureData.status;
  const captureObj = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
  const customId = captureObj?.custom_id || null;
  const providerPaymentId = captureObj?.id || null;
  const amountValue = captureObj?.amount?.value || null;
  const currencyCode = captureObj?.amount?.currency_code || null;

  let authId: string | null = null;
  let planId: string | null = null;
  let organizationId: string | null = null;
  let billingPeriod: "monthly" | "annual" | null = null;

  if (customId && customId.includes("|")) {
    const parts = customId.split("|");
    if (parts.length === 4) {
      authId = parts[0] || null;
      planId = parts[1] || null;
      organizationId = parts[2] || null;
      billingPeriod =
        parts[3] === "monthly" || parts[3] === "annual" ? parts[3] : null;
    }
  }

  let upgraded = false;

  if (
    authId &&
    planId &&
    organizationId &&
    billingPeriod &&
    status === "COMPLETED" &&
    providerPaymentId
  ) {
    let publicUserId: string | null = null;
    
    // First try to find user by id (custom_id stores users.id since createSubscriptionOrder)
    const { data: userById, error: userByIdError } = await supabase
      .from("users")
      .select("id")
      .eq("id", authId)
      .maybeSingle();

    if (userById && !userByIdError) {
      publicUserId = userById.id;
      console.log("[PayPal capture-subscription] Found user by id:", publicUserId);
    } else {
      // Fallback: try to find by auth_id for backward compatibility
      const { data: userByAuthId, error: authIdError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .maybeSingle();

      if (userByAuthId && !authIdError) {
        publicUserId = userByAuthId.id;
        console.log("[PayPal capture-subscription] Found user by auth_id (fallback):", publicUserId);
      } else {
        console.error("[PayPal capture-subscription] ❌ Failed to resolve user:", {
          userIdHint: authId,
          byIdError: userByIdError,
          byAuthIdError: authIdError,
        });
        return {
          success: true,
          html: SUCCESS_HTML,
          upgraded: false,
        };
      }
    }

    await logPaymentEvent(supabase, "paypal", {
      providerEventId: providerPaymentId,
      providerEventType: "PAYMENT.CAPTURE.COMPLETED",
      status: "PROCESSED",
      rawPayload: captureData,
      orderId: orderId,
      customId: customId,
      userHint: authId,
      providerPaymentId: providerPaymentId,
      amount: amountValue ? parseFloat(amountValue) : null,
      currency: currencyCode,
    });

    const paymentResult = await insertPayment(supabase, "paypal", {
      providerPaymentId: providerPaymentId,
      userId: publicUserId,
      organizationId: organizationId,
      productId: planId,
      amount: amountValue ? parseFloat(amountValue) : null,
      currency: currencyCode || "USD",
      status: "completed",
      productType: "subscription",
    });

    if (paymentResult.inserted && paymentResult.paymentId) {
      await upgradeOrganizationPlan(supabase, {
        organizationId: organizationId,
        planId: planId,
        billingPeriod: billingPeriod,
        paymentId: paymentResult.paymentId,
        amount: amountValue ? parseFloat(amountValue) : 0,
        currency: currencyCode || "USD",
        userId: publicUserId,
      });

      upgraded = true;
    } else if (paymentResult.inserted && !paymentResult.paymentId) {
      console.error("[PayPal capture-subscription] ❌ No payment ID returned");
    }
  }

  return {
    success: true,
    html: SUCCESS_HTML,
    upgraded,
  };
}
