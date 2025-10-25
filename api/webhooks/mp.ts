import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('🔔 MP Webhook received:', req.body);

    const { type, data } = req.body;

    if (type !== 'payment') {
      console.log('Ignoring non-payment notification:', type);
      return res.status(200).json({ ok: true });
    }

    if (!data || !data.id) {
      console.log('Invalid webhook data - missing payment ID');
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN not configured');
      return res.status(500).json({ error: "Payment gateway not configured" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const client = new MercadoPagoConfig({ 
      accessToken: mpAccessToken
    });
    const payment = new Payment(client);

    const paymentData = await payment.get({ id: data.id });

    console.log('💳 Payment data:', {
      id: paymentData.id,
      status: paymentData.status,
      metadata: paymentData.metadata
    });

    if (paymentData.status !== 'approved') {
      console.log('Payment not approved, status:', paymentData.status);
      return res.status(200).json({ ok: true, message: 'Payment not approved yet' });
    }

    const metadata = paymentData.metadata;
    
    if (!metadata || !metadata.course_id || !metadata.user_id) {
      console.error('Missing required metadata:', metadata);
      return res.status(400).json({ error: "Invalid payment metadata" });
    }

    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', metadata.user_id)
      .eq('course_id', metadata.course_id)
      .maybeSingle();

    if (existingEnrollment) {
      console.log('Enrollment already exists, skipping');
      return res.status(200).json({ ok: true, message: 'Enrollment already exists' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: metadata.user_id,
        course_id: metadata.course_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: 'mercadopago',
        amount_paid: metadata.final_price || metadata.list_price,
        currency: 'ARS'
      });

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      return res.status(500).json({ error: "Failed to create enrollment" });
    }

    if (metadata.coupon_id) {
      await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: metadata.coupon_id,
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          original_price: metadata.list_price,
          discount_amount: metadata.discount || 0,
          final_price: metadata.final_price
        });
    }

    console.log('✅ Enrollment created successfully via webhook');

    return res.status(200).json({ 
      ok: true, 
      message: 'Enrollment created successfully' 
    });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      error: "Failed to process webhook",
      message: error.message 
    });
  }
}
