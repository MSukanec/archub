import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, paypalBase, getAccessToken } from './_utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  try {
    const { token, PayerID, course_slug } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pago - Seencel</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">⚠️ Error</h1>
              <p>No se encontró el token del pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    console.log('[PayPal capture-and-redirect] Token:', token, 'PayerID:', PayerID, 'course_slug:', course_slug);

    // === CAPTURAR LA ORDEN EN PAYPAL ===
    const base = paypalBase();
    const accessToken = await getAccessToken();
    
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    const captureData = await captureResponse.json();
    console.log('[PayPal capture-and-redirect] Capture response:', JSON.stringify(captureData, null, 2));

    if (!captureResponse.ok) {
      console.error('[PayPal capture-and-redirect] Capture failed:', captureData);
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Seencel</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">⚠️ Error al Capturar el Pago</h1>
              <p>No pudimos completar el pago en PayPal.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    // === EXTRAER DATOS DEL PAGO ===
    const orderId = captureData.id;
    const status = captureData.status;
    const captureObj = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
    const invoiceId = captureObj?.invoice_id || null;
    const providerPaymentId = captureObj?.id || null;
    const amountValue = captureObj?.amount?.value || null;
    const currencyCode = captureObj?.amount?.currency_code || null;

    console.log('[PayPal capture-and-redirect] Order ID:', orderId, 'Status:', status, 'Invoice ID:', invoiceId);

    // Parse invoice_id: "user:UUID;course:UUID"
    let userId: string | null = null;
    let courseId: string | null = null;
    
    if (invoiceId) {
      try {
        const parts = invoiceId.split(';');
        for (const part of parts) {
          const [key, value] = part.split(':');
          if (key === 'user') userId = value;
          if (key === 'course') courseId = value;
        }
        
        console.log('[PayPal capture-and-redirect] Parsed invoice_id:', { userId, courseId });
      } catch (e) {
        console.error('[PayPal capture-and-redirect] Error parsing invoice_id:', e);
      }
    }
    
    console.log('[PayPal capture-and-redirect] Final - User ID:', userId, 'Course ID:', courseId);

    // === GUARDAR EN LA BASE DE DATOS ===

    // 1. Guardar en payment_events
    const { error: eventError } = await supabase.from('payment_events').insert({
      provider: 'paypal',
      provider_event_id: providerPaymentId,
      provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
      status: 'PROCESSED',
      raw_payload: captureData,
      order_id: orderId,
      custom_id: invoiceId,
      user_hint: userId,
      course_hint: courseId,
      provider_payment_id: providerPaymentId,
      amount: amountValue ? parseFloat(amountValue) : null,
      currency: currencyCode,
    });

    if (eventError) {
      console.error('[PayPal capture-and-redirect] Error insertando en payment_events:', eventError);
    } else {
      console.log('[PayPal capture-and-redirect] ✅ Guardado en payment_events');
    }

    // 2. Si tenemos user_id y course_id, crear payment y enrollment
    if (userId && courseId && status === 'COMPLETED') {
      // Insert en payments (ignorar si ya existe)
      const { error: paymentError } = await supabase.from('payments').insert({
        provider: 'paypal',
        provider_payment_id: providerPaymentId,
        user_id: userId,
        course_id: courseId,
        amount: amountValue ? parseFloat(amountValue) : null,
        currency: currencyCode || 'USD',
        status: 'completed',
      });

      if (paymentError) {
        // Si el error es por duplicado (código 23505), lo ignoramos
        if (paymentError.code === '23505') {
          console.log('[PayPal capture-and-redirect] ⚠️ Payment ya existe (ignorado)');
        } else {
          console.error('[PayPal capture-and-redirect] Error insertando payment:', paymentError);
        }
      } else {
        console.log('[PayPal capture-and-redirect] ✅ Payment insertado');
      }

      // Upsert enrollment
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);
      const { error: enrollError } = await supabase.from('course_enrollments').upsert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id,course_id' });

      if (enrollError) {
        console.error('[PayPal capture-and-redirect] Error insertando en course_enrollments:', enrollError);
      } else {
        console.log('[PayPal capture-and-redirect] ✅ Enrollment creado/actualizado');
      }
    }

    const finalCourseSlug = typeof course_slug === 'string' ? course_slug : 'master-archicad';

    return res.status(200).send(`
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
            <p>Tu pago ha sido procesado correctamente.</p>
            <p style="color: #6b7280;">Redirigiendo al curso...</p>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = '/learning/courses/${finalCourseSlug}?enrolled=true';
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (e: any) {
    console.error('[PayPal capture-and-redirect] Error fatal:', e);
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Archub</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626;">⚠️ Error</h1>
            <p>Hubo un problema al procesar tu pago.</p>
            <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">${String(e?.message || e)}</p>
            <p style="margin-top: 1rem;">
              <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
            </p>
          </div>
        </body>
      </html>
    `);
  }
}
