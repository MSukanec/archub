import type { Request, Response } from "express";
import { createCourseOrder } from "../../lib/handlers/checkout/paypal/createCourseOrder.js";
import { createSubscriptionOrder } from "../../lib/handlers/checkout/paypal/createSubscriptionOrder.js";
import { captureCourseOrder } from "../../lib/handlers/checkout/paypal/captureCourseOrder.js";
import { captureSubscriptionOrder } from "../../lib/handlers/checkout/paypal/captureSubscriptionOrder.js";
import { processWebhook } from "../../lib/handlers/checkout/paypal/processWebhook.js";
import { handleCorsPreflight } from "../../lib/handlers/checkout/shared/cors.js";
import { capturePayPalOrder, getPayPalOrder } from "../../lib/handlers/checkout/paypal/api.js";
import { createServiceSupabaseClient } from "../../lib/handlers/checkout/shared/auth.js";
import { insertPayment } from "../../lib/handlers/checkout/shared/payments.js";
import { upsertEnrollment } from "../../lib/handlers/checkout/shared/enrollments.js";

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
    
    return res.json({
      ok: true,
      order_id: result.orderId,
      approval_url: result.approvalUrl,
      order: result.order
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
    console.log('[PayPal capture-and-redirect] Starting capture for order:', token);
    
    if (!token) {
      console.error('[PayPal capture-and-redirect] Missing token');
      return res.status(400).send(errorHtml('Token de orden faltante'));
    }
    
    // 1. Get the order first to extract custom_id (contains user_id|course_id|coupon info)
    const orderDetails = await getPayPalOrder(token);
    console.log('[PayPal capture-and-redirect] Order details:', JSON.stringify(orderDetails, null, 2));
    
    const purchaseUnit = orderDetails.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id;
    
    if (!customId) {
      console.error('[PayPal capture-and-redirect] No custom_id in order');
      return res.status(400).send(errorHtml('Información de orden incompleta'));
    }
    
    // Parse custom_id: format is "user_id|course_id" or "user_id|course_id|coupon_code|coupon_id"
    const parts = customId.split('|');
    const userId = parts[0];
    const courseId = parts[1];
    const couponCode = parts[2] || null;
    const couponId = parts[3] || null;
    
    console.log('[PayPal capture-and-redirect] Parsed custom_id:', { userId, courseId, couponCode, couponId });
    
    if (!userId || !courseId) {
      console.error('[PayPal capture-and-redirect] Invalid custom_id format:', customId);
      return res.status(400).send(errorHtml('Formato de orden inválido'));
    }
    
    // 2. Capture the payment
    console.log('[PayPal capture-and-redirect] Capturing order...');
    const captureResult = await capturePayPalOrder(token);
    console.log('[PayPal capture-and-redirect] Capture result:', JSON.stringify(captureResult, null, 2));
    
    if (captureResult.status !== 'COMPLETED') {
      console.error('[PayPal capture-and-redirect] Capture not completed:', captureResult.status);
      return res.status(400).send(errorHtml('El pago no fue completado'));
    }
    
    // Extract payment details
    const capturedPayment = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(capturedPayment?.amount?.value || '0');
    const currency = capturedPayment?.amount?.currency_code || 'USD';
    const providerPaymentId = capturedPayment?.id || token;
    
    console.log('[PayPal capture-and-redirect] Payment captured:', { amount, currency, providerPaymentId });
    
    // 3. Insert payment record using service role (bypasses RLS)
    const supabase = createServiceSupabaseClient();
    
    const paymentResult = await insertPayment(supabase, 'paypal', {
      providerPaymentId,
      userId,
      courseId,
      amount,
      currency,
      status: 'completed',
      productType: 'course',
      couponCode,
      couponId,
    });
    
    if (paymentResult.error) {
      console.error('[PayPal capture-and-redirect] Payment insert error:', paymentResult.error);
      // Continue anyway - user should still get enrolled
    } else {
      console.log('[PayPal capture-and-redirect] Payment inserted:', paymentResult.paymentId);
    }
    
    // 4. Enroll user in course (12 months access)
    await upsertEnrollment(supabase, userId, courseId, 12);
    console.log('[PayPal capture-and-redirect] ✅ User enrolled successfully');
    
    // 5. Redirect to course page
    const redirectUrl = courseSlug 
      ? `/learning/courses/${courseSlug}?payment=success`
      : `/learning/courses?payment=success`;
    
    console.log('[PayPal capture-and-redirect] Redirecting to:', redirectUrl);
    return res.redirect(302, redirectUrl);
    
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
