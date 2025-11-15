import type { VercelRequest, VercelResponse } from '@vercel/node';
import { captureSubscriptionOrder } from '../lib/handlers/checkout/paypal/captureSubscriptionOrder.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result = await captureSubscriptionOrder(req);

  if (!result.success) {
    return res.status(500).setHeader("Content-Type", "text/html").send(result.html);
  }

  return res.status(200).setHeader("Content-Type", "text/html").send(result.html);
}
