import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders, err, ok, logPayment, enrollIfNeeded, getPayPalAccessToken } from './_utils';

async function verifySignature(headers: any, body: any) {
  const authAlgo = headers['paypal-auth-algo'];
  const certUrl = headers['paypal-cert-url'];
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const transmissionTime = headers['paypal-transmission-time'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
  const accessToken = await getPayPalAccessToken();

  const verifyRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });
  const result = await verifyRes.json();
  return result?.verification_status === 'SUCCESS';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']).setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end('ok');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method !== 'POST') return err(res, 'Method not allowed', 405);
    const body = req.body;

    const isValid = await verifySignature(req.headers, body);
    if (!isValid) return err(res, 'Firma de PayPal inválida', 400);

    const eventType = body?.event_type;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body?.resource;
      const amount = resource?.amount?.value || '0';
      const currency = resource?.amount?.currency_code || 'USD';
      const paymentId = resource?.id;

      let user_id: string | null = null;
      let course_slug: string | null = null;

      try {
        const orderId = body?.resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const token = await getPayPalAccessToken();
          const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const orderJson = await orderRes.json();
          const cu = orderJson?.purchase_units?.[0]?.custom_id;
          if (cu) {
            const parsed = JSON.parse(cu);
            user_id = parsed?.user_id ?? null;
            course_slug = parsed?.course_slug ?? null;
          }
        } else {
          const cu = body?.resource?.purchase_units?.[0]?.custom_id;
          if (cu) {
            const parsed = JSON.parse(cu);
            user_id = parsed?.user_id ?? null;
            course_slug = parsed?.course_slug ?? null;
          }
        }
      } catch (_) {}

      await logPayment({
        provider: 'paypal',
        payment_id: paymentId,
        status: 'approved',
        amount,
        currency,
        user_id,
        course_slug,
        raw: body,
      });

      if (user_id && course_slug) {
        await enrollIfNeeded(user_id, course_slug);
      }
    }

    return ok(res, { received: true });
  } catch (e: any) {
    return err(res, e.message || 'Error en webhook', 500);
  }
}
