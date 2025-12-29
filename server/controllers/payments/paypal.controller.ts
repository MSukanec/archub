import type { Request, Response } from "express";
import { createCourseOrder } from "../../lib/handlers/checkout/paypal/createCourseOrder.js";
import { createSubscriptionOrder } from "../../lib/handlers/checkout/paypal/createSubscriptionOrder.js";
import { captureCourseOrder } from "../../lib/handlers/checkout/paypal/captureCourseOrder.js";
import { captureSubscriptionOrder } from "../../lib/handlers/checkout/paypal/captureSubscriptionOrder.js";
import { processWebhook } from "../../lib/handlers/checkout/paypal/processWebhook.js";
import { syncPayPalPlans } from "../../lib/handlers/checkout/paypal/sync-plans.js";
import { handleCorsPreflight } from "../../lib/handlers/checkout/shared/cors.js";
import { capturePayPalOrder, getPayPalOrder } from "../../lib/handlers/checkout/paypal/api.js";
import { createServiceSupabaseClient } from "../../lib/handlers/checkout/shared/auth.js";
import { insertPayment } from "../../lib/handlers/checkout/shared/payments.js";
import { upsertEnrollment } from "../../lib/handlers/checkout/shared/enrollments.js";
import { logPaymentEvent } from "../../lib/handlers/checkout/shared/events.js";
import { markCouponAsUsed } from "../../lib/handlers/checkout/shared/coupons.js";
import { createUpgradeOrder } from "../../lib/handlers/checkout/paypal/createUpgradeOrder.js";
import { handleUpgradeCapture } from "../../lib/handlers/checkout/paypal/handleUpgradeCapture.js";
import { createSeatOrder } from "../../lib/handlers/checkout/paypal/createSeatOrder.js";
import { handleSeatCapture } from "../../lib/handlers/checkout/paypal/handleSeatCapture.js";

export async function createCourse(req: Request, res: Response) {
  try {
    const result = await createCourseOrder(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error,
        ...(result.details && { details: result.details })
      });
    }
    
    if ('freeEnrollment' in result && result.freeEnrollment) {
      return res.json({
        ok: true,
        freeEnrollment: true,
        couponCode: result.couponCode,
        couponId: result.couponId
      });
    }
    
    if ('orderId' in result) {
      return res.json({
        ok: true,
        order_id: result.orderId,
        approval_url: result.approvalUrl,
        order: result.order
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: "Unexpected result format"
    });
  } catch (error: any) {
    console.error("[PayPal create-course controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create course order"
    });
  }
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const result = await createSubscriptionOrder(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error,
        ...(result.details && { details: result.details })
      });
    }
    
    if ('gifted' in result && result.gifted) {
      return res.json({
        ok: true,
        gifted: true,
        subscription_id: result.subscriptionId,
        message: result.message
      });
    }
    
    if ('orderId' in result) {
      return res.json({
        ok: true,
        order_id: result.orderId,
        approval_url: result.approvalUrl,
        order: result.order
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: "Unexpected result format"
    });
  } catch (error: any) {
    console.error("[PayPal create-subscription controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create subscription order"
    });
  }
}

export async function captureCourse(req: Request, res: Response) {
  try {
    const result = await captureCourseOrder(req as any);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      capture: result.capture
    });
  } catch (error: any) {
    console.error("[PayPal capture-course controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to capture course order"
    });
  }
}

export async function captureSubscription(req: Request, res: Response) {
  try {
    const result = await captureSubscriptionOrder(req as any);
    
    if (!result.success) {
      return res.status(500).send(result.html);
    }
    
    return res.status(200).send(result.html);
  } catch (error: any) {
    console.error("[PayPal capture-subscription controller] Error:", error);
    const errorHtml = `
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
            <p>Hubo un problema al procesar tu suscripción.</p>
            <p style="margin-top: 1rem;">
              <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
            </p>
          </div>
        </body>
      </html>
    `;
    return res.status(500).send(errorHtml);
  }
}

export async function captureAndRedirect(req: Request, res: Response) {
  const courseSlug = req.query.course_slug as string;
  const token = req.query.token as string; // PayPal order ID
  
  const errorHtml = (message: string) => `
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
          <p style="margin-top: 1rem;">
            <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Cursos</a>
          </p>
        </div>
      </body>
    </html>
  `;
  
  try {
    if (!token) {
      console.error('[PayPal capture-and-redirect] Missing token');
      return res.status(400).send(errorHtml('Token de orden faltante'));
    }
    
    // 1. Get the order first to extract custom_id (contains user_id|course_id|coupon info)
    const orderDetails = await getPayPalOrder(token);
    
    const purchaseUnit = orderDetails.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id;
    
    if (!customId) {
      console.error('[PayPal capture-and-redirect] No custom_id in order');
      return res.status(400).send(errorHtml('Información de orden incompleta'));
    }
    
    // Parse custom_id: format is "user_id|course_id" or "user_id|course_id|coupon_code|coupon_id"
    // NOTE: The user_id here is already the users.id (not auth_id) because createCourseOrder does the lookup
    const parts = customId.split('|');
    const userId = parts[0];
    const courseId = parts[1];
    const couponCode = parts[2] || null;
    const couponId = parts[3] || null;
    
    if (!userId || !courseId) {
      console.error('[PayPal capture-and-redirect] Invalid custom_id format:', customId);
      return res.status(400).send(errorHtml('Formato de orden inválido'));
    }
    
    // Create service client for database operations
    const supabase = createServiceSupabaseClient();
    
    // 2. Capture the payment
    const captureResult = await capturePayPalOrder(token);
    
    if (captureResult.status !== 'COMPLETED') {
      console.error('[PayPal capture-and-redirect] Capture not completed:', captureResult.status);
      return res.status(400).send(errorHtml('El pago no fue completado'));
    }
    
    // Extract payment details
    const capturedPayment = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(capturedPayment?.amount?.value || '0');
    const currency = capturedPayment?.amount?.currency_code || 'USD';
    const providerPaymentId = capturedPayment?.id || token;
    
    // 3. Log payment event
    await logPaymentEvent(supabase, 'paypal', {
      providerEventType: 'PAYMENT.CAPTURE.COMPLETED',
      status: 'completed',
      orderId: orderDetails.id,
      customId,
      providerPaymentId,
      amount,
      currency,
      rawPayload: captureResult,
    });
    
    // 4. Insert payment record using service role (bypasses RLS)
    const paymentResult = await insertPayment(supabase, 'paypal', {
      providerPaymentId,
      userId,
      courseId,
      amount,
      currency,
      status: 'completed',
      productType: 'course',
    });
    
    if (paymentResult.error) {
      console.error('[PayPal capture-and-redirect] Payment insert error:', paymentResult.error);
    }
    
    // 5. Redeem coupon if one was used
    if (couponId && paymentResult.paymentId) {
      const couponResult = await markCouponAsUsed(
        supabase,
        couponId,
        userId,
        courseId,
        paymentResult.paymentId,
        amount,
        currency
      );
      
      if (!couponResult.success) {
        console.error('[PayPal capture-and-redirect] Coupon redemption failed:', couponResult.error);
      }
    }
    
    // 6. Enroll user in course (12 months access)
    const enrollmentResult = await upsertEnrollment(supabase, userId, courseId, 12);
    if (!enrollmentResult.success) {
      console.error('[PayPal capture-and-redirect] Enrollment failed:', enrollmentResult.error);
      return res.status(400).send(errorHtml(`No se pudo inscribir al usuario en el curso: ${enrollmentResult.error}`));
    }
    
    // 7. Return HTML with loader and client-side redirect
    const redirectUrl = courseSlug 
      ? `/learning/courses/${courseSlug}?payment=success`
      : `/learning/courses?payment=success`;
    
    const loaderHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Procesando pago...</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 400px;
              width: 90%;
            }
            .spinner {
              display: inline-block;
              width: 48px;
              height: 48px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h2 {
              color: #333;
              margin-bottom: 10px;
              font-size: 24px;
            }
            p {
              color: #666;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>¡Pago procesado!</h2>
            <p>Cargando tu curso...</p>
          </div>
          <script>
            // Redirect after 1 second to allow user to see the success message
            setTimeout(() => {
              window.location.href = '${redirectUrl}';
            }, 1000);
          </script>
        </body>
      </html>
    `;
    
    return res.send(loaderHtml);
    
  } catch (error: any) {
    console.error('[PayPal capture-and-redirect] Error:', error);
    return res.status(500).send(errorHtml('Hubo un problema al procesar tu pago.'));
  }
}

export async function webhook(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res as any);
  }

  try {
    const result = await processWebhook(req as any);
    
    if (!result.success) {
      console.error("[PayPal webhook controller] Error:", result.error);
      return res.status(200).json({
        ok: true,
        error: result.error,
        warn: result.warn || null
      });
    }
    
    return res.status(200).json({
      ok: true,
      processed: result.processed,
      event_type: result.eventType
    });
  } catch (error: any) {
    console.error("[PayPal webhook controller] Fatal error:", error);
    return res.status(200).json({
      ok: true,
      error: error.message || "Failed to process webhook"
    });
  }
}

export async function syncPlans(req: Request, res: Response) {
  try {
    const result = await syncPayPalPlans(req as any);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      results: result.results
    });
  } catch (error: any) {
    console.error("[PayPal sync-plans controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to sync PayPal plans"
    });
  }
}

export async function createUpgrade(req: Request, res: Response) {
  try {
    const result = await createUpgradeOrder(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    if (result.isFreeUpgrade) {
      return res.json({
        ok: true,
        freeUpgrade: true,
        order_id: result.orderId,
        approval_url: result.approvalUrl
      });
    }
    
    return res.json({
      ok: true,
      order_id: result.orderId,
      approval_url: result.approvalUrl
    });
  } catch (error: any) {
    console.error("[PayPal create-upgrade controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create upgrade order"
    });
  }
}

export async function captureUpgrade(req: Request, res: Response) {
  try {
    const result = await handleUpgradeCapture(req as any);
    
    if (!result.success) {
      console.error("[PayPal capture-upgrade controller] Error:", result.error);
      return res.redirect(result.redirectUrl || '/organization/billing?payment=error');
    }
    
    return res.redirect(result.redirectUrl);
  } catch (error: any) {
    console.error("[PayPal capture-upgrade controller] Fatal error:", error);
    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
    return res.redirect(`${baseUrl}/organization/billing?payment=error&reason=internal_error`);
  }
}

export async function createSeat(req: Request, res: Response) {
  try {
    const result = await createSeatOrder(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      order_id: result.orderId,
      approval_url: result.approvalUrl,
      preference_id: result.preferenceId
    });
  } catch (error: any) {
    console.error("[PayPal create-seat controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create seat order"
    });
  }
}

export async function captureSeat(req: Request, res: Response) {
  try {
    await handleSeatCapture(req, res);
  } catch (error: any) {
    console.error("[PayPal capture-seat controller] Fatal error:", error);
    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
    return res.redirect(`${baseUrl}/organization/members?payment=error&reason=internal_error`);
  }
}
