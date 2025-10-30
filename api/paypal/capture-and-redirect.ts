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

    // Redirect to unified success page (React component)
    // Note: user_id is NOT in query params for security - the frontend will get it from auth session
    return res.redirect(303, `/checkout/success?course_slug=${finalCourseSlug}&provider=paypal`);
    
    /* CÓDIGO ANTERIOR (HTML inline) - AHORA USA PÁGINA REACT UNIFICADA
    // Get course and enrollment data for success page
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', finalCourseSlug)
      .single();
    
    const { data: enrollmentData } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    const startDate = enrollmentData?.started_at ? new Date(enrollmentData.started_at) : new Date();
    const expireDate = enrollmentData?.expires_at ? new Date(enrollmentData.expires_at) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Return beautiful success page with course info
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <title>¡Pago Exitoso! - Archub</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
              max-width: 600px;
              width: 100%;
              padding: 40px;
              animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .check-icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              animation: scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            @keyframes scaleIn {
              from { transform: scale(0); }
              to { transform: scale(1); }
            }
            .check-icon::after {
              content: '✓';
              color: white;
              font-size: 48px;
              font-weight: bold;
            }
            h1 {
              text-align: center;
              color: #1f2937;
              font-size: 32px;
              margin-bottom: 12px;
            }
            .subtitle {
              text-align: center;
              color: #6b7280;
              font-size: 16px;
              margin-bottom: 32px;
            }
            .course-info {
              background: #f9fafb;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
              display: flex;
              gap: 16px;
              align-items: start;
            }
            .course-icon {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #eab308 0%, #84cc16 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              font-size: 28px;
            }
            .course-details h3 {
              color: #1f2937;
              font-size: 18px;
              margin-bottom: 8px;
            }
            .course-details p {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            }
            .dates {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
            }
            .date-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
            }
            .date-label {
              color: #6b7280;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .date-value {
              color: #1f2937;
              font-size: 15px;
              font-weight: 600;
            }
            .info-box {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
              font-size: 14px;
              color: #78350f;
              line-height: 1.6;
            }
            .button {
              display: block;
              width: 100%;
              background: linear-gradient(135deg, #eab308 0%, #84cc16 100%);
              color: white;
              text-align: center;
              padding: 16px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 12px;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 30px rgba(234, 179, 8, 0.3);
            }
            .button-secondary {
              background: transparent;
              color: #6b7280;
              border: 1px solid #e5e7eb;
            }
            .button-secondary:hover {
              background: #f9fafb;
              box-shadow: none;
            }
            @media (max-width: 640px) {
              .container { padding: 24px; }
              h1 { font-size: 24px; }
              .dates { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check-icon"></div>
            <h1>¡Felicitaciones!</h1>
            <p class="subtitle">Te has suscrito exitosamente al curso</p>
            
            <div class="course-info">
              <div class="course-icon">📚</div>
              <div class="course-details">
                <h3>${courseData?.name || 'Master en Archicad'}</h3>
                <p>${courseData?.description || 'Domina Archicad desde cero hasta nivel profesional'}</p>
              </div>
            </div>

            <div class="dates">
              <div class="date-card">
                <div class="date-label">Inicio</div>
                <div class="date-value">${formatDate(startDate)}</div>
              </div>
              <div class="date-card">
                <div class="date-label">Vencimiento</div>
                <div class="date-value">${formatDate(expireDate)}</div>
              </div>
            </div>

            <div class="info-box">
              💡 Puedes acceder a tu curso desde la sección <strong>Capacitaciones</strong> en el menú principal. 
              Todo tu progreso se guardará automáticamente.
            </div>

            <a href="/learning/courses/${finalCourseSlug}" class="button">
              Ir al curso ahora →
            </a>
            
            <a href="/learning/courses" class="button button-secondary">
              Ver todos mis cursos
            </a>
          </div>
        </body>
      </html>
    `);
    */
    
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
