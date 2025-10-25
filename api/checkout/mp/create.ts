import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { courseSlug, code } = req.body;
    const authHeader = req.headers.authorization || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.substring(7);

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const authenticatedSupabase = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid authentication" });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return res.status(404).json({ error: "User profile not found" });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, slug, title')
      .eq('slug', courseSlug)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return res.status(404).json({ error: "Course not found" });
    }

    const { data: priceData, error: priceError } = await supabase
      .from('course_prices')
      .select('*')
      .eq('course_id', course.id)
      .eq('currency_code', 'ARS')
      .or(`provider.eq.mercadopago,provider.eq.any`)
      .eq('is_active', true)
      .order('provider', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priceError || !priceData) {
      console.error('Error fetching price:', priceError);
      return res.status(404).json({ error: "Price not found for this course" });
    }

    let finalPrice = priceData.amount;
    let couponData: any = null;

    if (code && code.trim()) {
      const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: priceData.amount,
        p_currency: priceData.currency_code
      });

      if (couponError) {
        console.error('Error validating coupon:', couponError);
        return res.status(400).json({ error: "Error validating coupon" });
      }

      if (!validationResult || !validationResult.ok) {
        return res.status(400).json({ 
          error: "Invalid coupon", 
          reason: validationResult?.reason || 'UNKNOWN'
        });
      }

      couponData = validationResult;
      finalPrice = validationResult.final_price;
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN not configured');
      return res.status(500).json({ error: "Payment gateway not configured" });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: mpAccessToken
    });
    const preference = new Preference(client);

    const metadata: any = {
      course_id: course.id,
      course_slug: course.slug,
      user_id: profile.id,
      user_auth_id: user.id,
      list_price: priceData.amount,
      final_price: finalPrice
    };

    if (couponData) {
      metadata.coupon_code = code.trim().toUpperCase();
      metadata.coupon_id = couponData.coupon_id;
      metadata.discount = couponData.discount;
    }

    const appUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.APP_URL || 'http://localhost:5000';

    const preferenceData = {
      items: [
        {
          id: course.id,
          title: course.title,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: Number(finalPrice)
        }
      ],
      payer: {
        email: profile.email || user.email,
        name: profile.full_name
      },
      back_urls: {
        success: `${appUrl}/learning/payment-return?status=success&course=${courseSlug}`,
        failure: `${appUrl}/learning/payment-return?status=failure&course=${courseSlug}`,
        pending: `${appUrl}/learning/payment-return?status=pending&course=${courseSlug}`
      },
      auto_return: 'approved' as const,
      notification_url: `${appUrl}/api/webhooks/mp`,
      metadata: metadata
    };

    console.log('Creating MP preference:', {
      courseSlug,
      finalPrice,
      hasCoupon: !!couponData,
      userId: profile.id
    });

    const result = await preference.create({ body: preferenceData });

    return res.status(200).json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference_id: result.id
    });

  } catch (error: any) {
    console.error('Error creating MP preference:', error);
    return res.status(500).json({ 
      error: "Failed to create payment preference",
      message: error.message 
    });
  }
}
