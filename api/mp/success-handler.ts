import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  
  try {
    const { payment_id, collection_id, collection_status, preference_id, course_slug, external_reference } = req.query;
    
    console.log('[MP success-handler] Query params:', { payment_id, collection_id, collection_status, preference_id, course_slug, external_reference });

    // Mercado Pago puede enviar payment_id o collection_id
    const mpPaymentId = (payment_id || collection_id) as string | undefined;
    
    if (!mpPaymentId) {
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
              <p>No se encontró el ID del pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    // === OBTENER DETALLES DEL PAGO DESDE MERCADO PAGO ===
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const mpPaymentData = await mpResponse.json();
    console.log('[MP success-handler] Payment data:', JSON.stringify(mpPaymentData, null, 2));

    if (!mpResponse.ok) {
      console.error('[MP success-handler] Error fetching payment:', mpPaymentData);
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
              <h1 style="color: #dc2626;">⚠️ Error al Verificar el Pago</h1>
              <p>No pudimos verificar el pago con Mercado Pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    // === EXTRAER DATOS DEL PAGO ===
    const status = mpPaymentData.status; // "approved", "pending", "rejected", etc.
    const providerPaymentId = mpPaymentData.id ? String(mpPaymentData.id) : null;
    const amountValue = mpPaymentData.transaction_amount || null;
    const currencyCode = mpPaymentData.currency_id || 'ARS';
    const externalRef = mpPaymentData.external_reference || (external_reference as string) || null;

    console.log('[MP success-handler] Extracted:', { status, providerPaymentId, amountValue, currencyCode, externalRef });

    // Decodificar custom_id (base64) para obtener user_id, course_slug, months
    let userId: string | null = null;
    let courseSlug: string | null = null;
    let courseId: string | null = null;
    let months: number = 12;

    if (externalRef) {
      try {
        const decodedJson = Buffer.from(externalRef, 'base64').toString('utf-8');
        const customData = JSON.parse(decodedJson);
        userId = customData.user_id || null;
        courseSlug = customData.course_slug || (course_slug as string) || null;
        months = customData.months || 12;

        if (courseSlug) {
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', courseSlug)
            .maybeSingle();
          courseId = course?.id || null;
        }

        console.log('[MP success-handler] Decoded custom_id:', { userId, courseSlug, courseId, months });
      } catch (e) {
        console.error('[MP success-handler] Error decodificando external_reference:', e);
      }
    }

    // === GUARDAR EN LA BASE DE DATOS ===

    // 1. Guardar en payment_events
    const { error: eventError } = await supabase.from('payment_events').insert({
      provider: 'mercadopago',
      provider_event_id: providerPaymentId,
      provider_event_type: 'PAYMENT.SUCCESS',
      status: 'PROCESSED',
      raw_payload: mpPaymentData,
      order_id: preference_id ? String(preference_id) : null,
      custom_id: externalRef,
      user_hint: userId,
      course_hint: courseSlug,
      provider_payment_id: providerPaymentId,
      amount: amountValue ? parseFloat(amountValue) : null,
      currency: currencyCode,
    });

    if (eventError) {
      console.error('[MP success-handler] Error insertando en payment_events:', eventError);
    } else {
      console.log('[MP success-handler] ✅ Guardado en payment_events');
    }

    // 2. Si el pago fue aprobado y tenemos user_id + course_id → crear payment y enrollment
    if (status === 'approved' && userId && courseId) {
      // Insert en payments (ignorar si ya existe)
      const { error: paymentError } = await supabase.from('payments').insert({
        provider: 'mercadopago',
        provider_payment_id: providerPaymentId,
        user_id: userId,
        course_id: courseId,
        amount: amountValue ? parseFloat(amountValue) : null,
        currency: currencyCode,
        status: 'completed',
      });

      if (paymentError) {
        // Si el error es por duplicado (código 23505), lo ignoramos
        if (paymentError.code === '23505') {
          console.log('[MP success-handler] ⚠️ Payment ya existe (ignorado)');
        } else {
          console.error('[MP success-handler] Error insertando payment:', paymentError);
        }
      } else {
        console.log('[MP success-handler] ✅ Payment insertado');
      }

      // Upsert enrollment
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);
      const { error: enrollError } = await supabase.from('course_enrollments').upsert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id,course_id' });

      if (enrollError) {
        console.error('[MP success-handler] Error insertando en course_enrollments:', enrollError);
      } else {
        console.log('[MP success-handler] ✅ Enrollment creado/actualizado');
      }
    } else if (status !== 'approved') {
      console.log('[MP success-handler] Pago no aprobado, status:', status);
    }

    const finalCourseSlug = courseSlug || (course_slug as string) || 'master-archicad';

    // Mostrar página de éxito/pendiente/rechazado según status
    if (status === 'approved') {
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
    } else if (status === 'pending') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pago Pendiente - Seencel</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #f59e0b;">⏳ Pago Pendiente</h1>
              <p>Tu pago está siendo procesado.</p>
              <p style="color: #6b7280;">Te notificaremos cuando se complete.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    } else {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pago Rechazado - Seencel</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">⚠️ Pago Rechazado</h1>
              <p>Tu pago no pudo ser procesado.</p>
              <p style="color: #6b7280;">Por favor intentá de nuevo o usá otro método de pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses/${finalCourseSlug}" style="color: #2563eb; text-decoration: none;">Volver al Curso</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

  } catch (e: any) {
    console.error('[MP success-handler] Error fatal:', e);
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
