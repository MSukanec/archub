import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders, err, ok, paypalFetch } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']).setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end('ok');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method !== 'POST') return err(res, 'Method not allowed', 405);
    const { order_id } = req.body || {};
    if (!order_id) return err(res, 'Falta order_id');

    const capture = await paypalFetch(`/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    return ok(res, capture);
  } catch (e: any) {
    return err(res, e.message || 'Error capturando orden', 500);
  }
}
