import type { VercelRequest } from "@vercel/node";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { capturePayPalOrder } from "./api.js";

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
  req: VercelRequest
): Promise<CaptureSubscriptionOrderResult> {
  const supabase = createServiceSupabaseClient();

  try {
    const { token, PayerID } = req.query;

    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "No se encontró el token del pago.",
        html: ERROR_HTML("No se encontró el token del pago."),
      };
    }

    console.log("[PayPal capture-subscription] Token:", token, "PayerID:", PayerID);

    // === CAPTURAR LA ORDEN EN PAYPAL ===
    // Solo capturamos la orden aquí. El webhook procesará todo lo demás.
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

    console.log(
      "[PayPal capture-subscription] ✅ Order captured:",
      orderId,
      "Status:",
      status
    );

    // Parse custom_id to get subscription metadata
    let userId: string | null = null;
    let planId: string | null = null;
    let organizationId: string | null = null;
    let billingPeriod: "monthly" | "annual" | null = null;

    if (customId && customId.includes("|")) {
      const parts = customId.split("|");
      if (parts.length === 4) {
        userId = parts[0] || null;
        planId = parts[1] || null;
        organizationId = parts[2] || null;
        billingPeriod =
          parts[3] === "monthly" || parts[3] === "annual" ? parts[3] : null;

        console.log("[PayPal capture-subscription] Parsed metadata:", {
          userId,
          planId,
          organizationId,
          billingPeriod,
        });
      }
    }

    let upgraded = false;

    // Process subscription if we have all data and payment is completed
    if (
      userId &&
      planId &&
      organizationId &&
      billingPeriod &&
      status === "COMPLETED" &&
      providerPaymentId
    ) {
      // Log payment event for auditing
      await logPaymentEvent(supabase, "paypal", {
        providerEventId: providerPaymentId,
        providerEventType: "PAYMENT.CAPTURE.COMPLETED",
        status: "PROCESSED",
        rawPayload: captureData,
        orderId: orderId,
        customId: customId,
        userHint: userId,
        providerPaymentId: providerPaymentId,
        amount: amountValue ? parseFloat(amountValue) : null,
        currency: currencyCode,
      });

      console.log("[PayPal capture-subscription] ✅ Payment event logged");

      // Check if payment already exists (idempotency)
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", providerPaymentId)
        .single();

      if (existingPayment) {
        console.log(
          "[PayPal capture-subscription] ℹ️ Payment already processed (idempotent)"
        );
      } else {
        console.log("[PayPal capture-subscription] Processing new subscription...");

        // Insert payment
        await insertPayment(supabase, "paypal", {
          providerPaymentId: providerPaymentId,
          organizationId: organizationId,
          productId: planId,
          amount: amountValue ? parseFloat(amountValue) : null,
          currency: currencyCode || "USD",
          status: "completed",
          productType: "subscription",
        });

        console.log("[PayPal capture-subscription] ✅ Payment created");

        // Upgrade organization plan
        await upgradeOrganizationPlan(supabase, {
          organizationId: organizationId,
          planId: planId,
          billingPeriod: billingPeriod,
          paymentId: providerPaymentId,
          amount: amountValue ? parseFloat(amountValue) : 0,
          currency: currencyCode || "USD",
        });

        console.log("[PayPal capture-subscription] ✅ Organization updated");
        upgraded = true;
      }
    } else {
      console.log(
        "[PayPal capture-subscription] ℹ️ Missing data or payment not completed, webhook will handle it"
      );
    }

    return {
      success: true,
      html: SUCCESS_HTML,
      upgraded,
    };
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
