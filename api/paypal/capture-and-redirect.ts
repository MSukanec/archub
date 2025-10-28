import type { VercelRequest, VercelResponse } from '@vercel/node';
import { paypalFetch, logPayment, enrollIfNeeded, supabaseAdmin } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { token, course_slug } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.redirect(302, '/learning/courses?error=invalid_token');
    }

    if (!course_slug || typeof course_slug !== 'string') {
      return res.redirect(302, '/learning/courses?error=invalid_course');
    }

    // Capture the order
    const capture = await paypalFetch(`/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Extract data from the capture response
    const captureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const amount = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0';
    const currency = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || 'USD';
    const customId = capture?.purchase_units?.[0]?.custom_id;

    let user_id: string | null = null;
    
    if (customId) {
      try {
        const parsed = JSON.parse(customId);
        user_id = parsed?.user_id ?? null;
      } catch (_) {}
    }

    // Log the payment
    await logPayment({
      provider: 'paypal',
      payment_id: captureId || token,
      status: 'approved',
      amount,
      currency,
      user_id,
      course_slug,
      raw: capture,
    });

    // Enroll the user
    if (user_id && course_slug) {
      await enrollIfNeeded(user_id, course_slug);
    }

    // Redirect to payment return page
    return res.redirect(302, `/learning/payment-return?course=${encodeURIComponent(course_slug)}`);
    
  } catch (e: any) {
    console.error('Error capturing PayPal order:', e);
    const course = req.query.course_slug;
    const errorParam = encodeURIComponent(e.message || 'Error al procesar el pago');
    if (course && typeof course === 'string') {
      return res.redirect(302, `/learning/courses/${course}?error=${errorParam}`);
    }
    return res.redirect(302, `/learning/courses?error=${errorParam}`);
  }
}
