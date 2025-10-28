import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders, err, ok, getCoursePriceUSD, paypalFetch } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']).setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end('ok');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method !== 'POST') return err(res, 'Method not allowed', 405);
    const { user_id, course_slug } = req.body || {};
    if (!user_id || !course_slug) return err(res, 'Faltan user_id o course_slug');

    const { currency, amount } = await getCoursePriceUSD(course_slug);

    const custom = JSON.stringify({ user_id, course_slug });

    const baseUrl = req.headers['x-forwarded-proto'] 
      ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host'] || req.headers['host']}`
      : `https://${req.headers['host']}`;

    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: currency, value: amount },
            custom_id: custom,
          },
        ],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${baseUrl}/api/paypal/capture-and-redirect?course_slug=${encodeURIComponent(course_slug)}`,
          cancel_url: `${baseUrl}/learning/courses/${encodeURIComponent(course_slug)}`
        },
      }),
    });

    // Find the approval link from the order response
    const approvalLink = order.links?.find((link: any) => link.rel === 'approve')?.href;
    
    return ok(res, { 
      orderID: order.id,
      approvalUrl: approvalLink 
    });
  } catch (e: any) {
    return err(res, e.message || 'Error creando orden', 500);
  }
}
