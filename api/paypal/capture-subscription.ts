import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { paypalBase, getAccessToken } from './_utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  
  try {
    const { token, PayerID } = req.query;
    
    if (!token || typeof token !== 'string') {
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
              <h1 style="color: #dc2626;">⚠️ Error</h1>
              <p>No se encontró el token del pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    console.log('[PayPal capture-subscription] Token:', token, 'PayerID:', PayerID);

    // === CAPTURAR LA ORDEN EN PAYPAL ===
    // Solo capturamos la orden aquí. El webhook procesará todo lo demás.
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
    
    if (!captureResponse.ok) {
      console.error('[PayPal capture-subscription] Capture failed:', captureData);
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
                <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    const orderId = captureData.id;
    const status = captureData.status;
    const captureObj = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
    const customId = captureObj?.custom_id || null;
    const providerPaymentId = captureObj?.id || null;
    const amountValue = captureObj?.amount?.value || null;
    const currencyCode = captureObj?.amount?.currency_code || null;
    
    console.log('[PayPal capture-subscription] ✅ Order captured:', orderId, 'Status:', status);

    // Parse custom_id to get subscription metadata
    let userId: string | null = null;
    let planId: string | null = null;
    let organizationId: string | null = null;
    let billingPeriod: 'monthly' | 'annual' | null = null;
    
    if (customId && customId.includes('|')) {
      const parts = customId.split('|');
      if (parts.length === 4) {
        userId = parts[0] || null;
        planId = parts[1] || null;
        organizationId = parts[2] || null;
        billingPeriod = (parts[3] === 'monthly' || parts[3] === 'annual') ? parts[3] : null;
        
        console.log('[PayPal capture-subscription] Parsed metadata:', {
          userId,
          planId,
          organizationId,
          billingPeriod
        });
      }
    }

    // Process subscription if we have all data and payment is completed
    if (userId && planId && organizationId && billingPeriod && status === 'COMPLETED' && providerPaymentId) {
      
      // Check if payment already exists (idempotency)
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_payment_id', providerPaymentId)
        .single();

      if (existingPayment) {
        console.log('[PayPal capture-subscription] ℹ️ Payment already processed (idempotent)');
      } else {
        console.log('[PayPal capture-subscription] Processing new subscription...');

        // Insert payment
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            provider: 'paypal',
            provider_payment_id: providerPaymentId,
            organization_id: organizationId,
            product_id: planId,
            product_type: 'subscription',
            amount: amountValue ? parseFloat(amountValue) : null,
            currency: currencyCode || 'USD',
            status: 'completed',
          })
          .select('id')
          .single();

        if (paymentError) {
          console.error('[PayPal capture-subscription] Error inserting payment:', paymentError);
        } else {
          console.log('[PayPal capture-subscription] ✅ Payment created');

          // Cancel previous subscriptions
          await supabase
            .from('organization_subscriptions')
            .update({ status: 'expired', cancelled_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('status', 'active');

          // Create new subscription
          const expiresAt = new Date();
          if (billingPeriod === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }

          const { error: subError } = await supabase
            .from('organization_subscriptions')
            .insert({
              organization_id: organizationId,
              plan_id: planId,
              payment_id: payment.id, // Use internal payment ID
              status: 'active',
              billing_period: billingPeriod,
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              amount: amountValue ? parseFloat(amountValue) : null,
              currency: currencyCode || 'USD',
            });

          if (subError) {
            console.error('[PayPal capture-subscription] Error creating subscription:', subError);
          } else {
            console.log('[PayPal capture-subscription] ✅ Subscription created');
          }

          // Update organization plan
          await supabase
            .from('organizations')
            .update({ plan_id: planId })
            .eq('id', organizationId);
          
          console.log('[PayPal capture-subscription] ✅ Organization updated');
        }
      }
    } else {
      console.log('[PayPal capture-subscription] ℹ️ Missing data or payment not completed, webhook will handle it');
    }

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
    `);
    
  } catch (e: any) {
    console.error('[PayPal capture-subscription] Error fatal:', e);
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
            <h1 style="color: #dc2626;">⚠️ Error</h1>
            <p>Hubo un problema al procesar tu suscripción.</p>
            <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">${String(e?.message || e)}</p>
            <p style="margin-top: 1rem;">
              <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
            </p>
          </div>
        </body>
      </html>
    `);
  }
}
