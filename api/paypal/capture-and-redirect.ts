import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, paypalBase, getAccessToken } from './_utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function parseInvoiceId(invoiceId: string): { user?: string; course?: string } {
  const out: Record<string, string> = {};
  if (!invoiceId) return out;
  for (const part of invoiceId.split(';')) {
    const [k, v] = part.split(':').map((s) => s.trim());
    if (k && v) out[k] = v;
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { token, PayerID, course_slug } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pago - Archub</title>
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
            <title>Error - Archub</title>
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
    const invoiceId = captureData?.purchase_units?.[0]?.invoice_id || null;
    const amount = captureData?.purchase_units?.[0]?.amount?.value || null;
    const currency = captureData?.purchase_units?.[0]?.amount?.currency_code || null;

    console.log('[PayPal capture-and-redirect] Order ID:', orderId, 'Status:', status, 'Invoice:', invoiceId);

    // Parse invoice_id para obtener user_id y course_id
    const { user: userId, course: courseId } = parseInvoiceId(invoiceId || '');
    console.log('[PayPal capture-and-redirect] Parsed - User ID:', userId, 'Course ID:', courseId);

    // === GUARDAR EN LA BASE DE DATOS ===
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // 1. Guardar en paypal_events
    const { error: eventError } = await supabase.from('paypal_events').insert({
      provider_event_id: orderId,
      provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
      status: 'PROCESSED',
      raw_payload: captureData,
      order_id: orderId,
      custom_id: invoiceId,
      user_hint: userId || null,
      course_hint: courseId || null,
    });

    if (eventError) {
      console.error('[PayPal capture-and-redirect] Error insertando en paypal_events:', eventError);
    } else {
      console.log('[PayPal capture-and-redirect] ✅ Guardado en paypal_events');
    }

    // 2. Guardar en payment_logs (si existe la tabla)
    try {
      const { error: logError } = await supabase.from('payment_logs').insert({
        user_id: userId || null,
        course_id: courseId || null,
        provider: 'paypal',
        provider_payment_id: orderId,
        amount: amount ? parseFloat(amount) : null,
        currency: currency || 'USD',
        status: status === 'COMPLETED' ? 'completed' : 'pending',
        raw_payload: captureData,
      });

      if (logError) {
        console.error('[PayPal capture-and-redirect] Error insertando en payment_logs:', logError);
      } else {
        console.log('[PayPal capture-and-redirect] ✅ Guardado en payment_logs');
      }
    } catch (e) {
      console.warn('[PayPal capture-and-redirect] payment_logs table might not exist:', e);
    }

    // 3. Crear enrollment si tenemos user_id y course_id
    if (userId && courseId && status === 'COMPLETED') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 año

      const { error: enrollError } = await supabase.from('course_enrollments').upsert(
        {
          user_id: userId,
          course_id: courseId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'user_id,course_id' }
      );

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
          <title>Pago Exitoso - Archub</title>
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
              window.location.href = '/learning/courses/${finalCourseSlug}';
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
