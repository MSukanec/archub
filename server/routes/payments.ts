import type { Express } from "express";
import type { RouteDeps } from './_base';
import { extractToken, createAuthenticatedClient, getAdminClient, supabase } from './_base';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(authHeader: string) {
  const token = authHeader.substring(7);
  
  const authSupabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  
  const { data: { user }, error } = await authSupabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: "Invalid or expired token" };
  }
  
  const { data: adminCheck } = await authSupabase
    .from('admin_users')
    .select('auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();
  
  if (!adminCheck) {
    return { isAdmin: false, error: "Admin access required" };
  }
  
  return { isAdmin: true, user };
}

// ==================== PAYPAL HELPER FUNCTIONS ====================

function getPayPalBaseUrl() {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';
}

async function getPayPalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!id || !secret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required. Please set them in your environment variables.');
  }
  
  const tokenRes = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`PayPal token error: ${tokenRes.status} ${text}`);
  }
  
  const json = await tokenRes.json();
  return json.access_token as string;
}

async function paypalFetch(path: string, opts: RequestInit & { accessToken?: string } = {}) {
  const token = opts.accessToken ?? (await getPayPalAccessToken());
  const res = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  let json: any;
  try { json = body ? JSON.parse(body) : null; } catch { json = body; }
  if (!res.ok) throw new Error(`PayPal ${path} ${res.status}: ${body}`);
  return json;
}

async function getCoursePriceUSD(course_slug: string) {
  const { data, error } = await getAdminClient()
    .from('courses')
    .select('price')
    .eq('slug', course_slug)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    throw new Error(`Precio no encontrado para ${course_slug}`);
  }
  
  return { currency: 'USD', amount: String(data.price) };
}

async function logPayPalPayment(payload: {
  payment_id: string;
  status: string;
  amount: string;
  currency: string;
  user_id?: string | null;
  course_slug?: string | null;
  raw?: any;
}) {
  await getAdminClient().from('payments_log').insert({
    provider: 'paypal',
    payment_id: payload.payment_id,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency,
    user_id: payload.user_id ?? null,
    course_slug: payload.course_slug ?? null,
    raw: payload.raw ?? null,
  });
}

async function enrollUserInCourse(user_id: string, course_id: string, months: number = 12) {
  console.log('📚 [enrollUserInCourse] Starting enrollment...', { user_id, course_id, months });
  
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  
  const enrollmentData = { 
    user_id, 
    course_id, 
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  };
  
  console.log('📚 [enrollUserInCourse] Enrollment data:', enrollmentData);
  
  // Usar INSERT simple - si el usuario ya está inscrito, el constraint único lo detectará
  const { data, error } = await getAdminClient()
    .from('course_enrollments')
    .insert(enrollmentData)
    .select();
  
  if (error) {
    // Si el error es por duplicado (usuario ya inscrito), es aceptable
    if (error.code === '23505') {
      console.log('⚠️ [enrollUserInCourse] User already enrolled, extending expiration...');
      // Actualizar solo la fecha de expiración
      const { data: updated, error: updateError } = await getAdminClient()
        .from('course_enrollments')
        .update({ expires_at: expiresAt.toISOString(), status: 'active' })
        .eq('user_id', user_id)
        .eq('course_id', course_id)
        .select();
      
      if (updateError) {
        console.error('❌ [enrollUserInCourse] ERROR updating expiration:', updateError);
        throw updateError;
      }
      console.log('✅ [enrollUserInCourse] Success! Expiration extended:', updated);
      return updated;
    }
    console.error('❌ [enrollUserInCourse] ERROR:', error);
    throw error;
  }
  
  console.log('✅ [enrollUserInCourse] Success! Enrollment created:', data);
  return data;
}

async function getPlanPrice(plan_slug: string, billing_period: 'monthly' | 'annual', provider: string, currency: string) {
  console.log('💰 [getPlanPrice] Getting plan price...', { plan_slug, billing_period, provider, currency });
  
  // Obtener el plan con precios en USD
  const { data: plan, error: planError } = await getAdminClient()
    .from('plans')
    .select('id, name, slug, monthly_amount, annual_amount')
    .eq('slug', plan_slug)
    .eq('is_active', true)
    .single();
  
  if (planError || !plan) {
    console.error('❌ [getPlanPrice] Plan not found:', planError);
    throw new Error(`Plan no encontrado: ${plan_slug}`);
  }
  
  let amount = billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount;
  
  // Si la moneda es ARS, convertir usando exchange_rates
  if (currency === 'ARS') {
    const { data: exchangeRate, error: exchangeError } = await getAdminClient()
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'ARS')
      .eq('is_active', true)
      .single();
    
    if (exchangeError || !exchangeRate) {
      console.error('❌ [getPlanPrice] Exchange rate not found:', exchangeError);
      throw new Error('Tasa de cambio no disponible');
    }
    
    amount = amount * Number(exchangeRate.rate);
  }
  
  console.log('✅ [getPlanPrice] Price found:', { plan, amount, billing_period, currency });
  
  return {
    plan_id: plan.id,
    plan_name: plan.name,
    currency: currency,
    amount: String(amount)
  };
}

async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
}) {
  console.log('🏢 [upgradeOrganizationPlan] Starting upgrade...', params);
  
  // 1. Cancelar suscripción activa anterior (si existe)
  const { error: cancelError } = await getAdminClient()
    .from('organization_subscriptions')
    .update({ 
      status: 'expired', 
      cancelled_at: new Date().toISOString() 
    })
    .eq('organization_id', params.organization_id)
    .eq('status', 'active');
  
  if (cancelError) {
    console.error('⚠️ [upgradeOrganizationPlan] Error cancelling previous subscription:', cancelError);
  }
  
  // 2. Calcular expires_at
  const expiresAt = new Date();
  if (params.billing_period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  // 3. Crear nueva suscripción activa
  const { data: subscription, error: subError } = await getAdminClient()
    .from('organization_subscriptions')
    .insert({
      organization_id: params.organization_id,
      plan_id: params.plan_id,
      payment_id: params.payment_id,
      status: 'active',
      billing_period: params.billing_period,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount: params.amount,
      currency: params.currency,
    })
    .select()
    .single();
  
  if (subError) {
    console.error('❌ [upgradeOrganizationPlan] ERROR creating subscription:', subError);
    throw subError;
  }
  
  // 4. Actualizar organizations.plan_id
  const { error: orgError } = await getAdminClient()
    .from('organizations')
    .update({ plan_id: params.plan_id })
    .eq('id', params.organization_id);
  
  if (orgError) {
    console.error('❌ [upgradeOrganizationPlan] ERROR updating organization:', orgError);
    throw orgError;
  }
  
  console.log('✅ [upgradeOrganizationPlan] Success! Subscription created:', subscription);
  
  return subscription;
}

// ==================== PAYMENT ROUTES ====================

export function registerPaymentRoutes(app: Express, deps: RouteDeps) {
  const { supabase } = deps;

  // ==================== MERCADO PAGO CHECKOUT & WEBHOOKS ====================
  
  // Create Mercado Pago preference with coupon support
  app.post("/api/checkout/mp/create", async (req, res) => {
    try {
      const { courseSlug, code } = req.body;

      if (!courseSlug) {
        return res.status(400).json({ error: "courseSlug is required" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.substring(7);

      // Get authenticated user
      const authenticatedSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }

      // Get user profile (public.users id)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return res.status(404).json({ error: "User profile not found" });
      }

      // Get course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return res.status(404).json({ error: "Course not found" });
      }

      // Get course price in USD and convert to ARS
      const { data: courseData, error: courseDataError } = await supabase
        .from('courses')
        .select('price')
        .eq('id', course.id)
        .single();

      if (courseDataError || !courseData) {
        console.error('Error fetching course price:', courseDataError);
        return res.status(404).json({ error: "Course price not found" });
      }

      // Convert USD to ARS using exchange_rates
      const { data: exchangeRate, error: exchangeError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', 'ARS')
        .eq('is_active', true)
        .single();

      if (exchangeError || !exchangeRate) {
        console.error('Error fetching exchange rate:', exchangeError);
        return res.status(500).json({ error: "Exchange rate not available" });
      }

      const priceInARS = Number(courseData.price) * Number(exchangeRate.rate);
      let finalPrice = priceInARS;
      let couponData: any = null;

      // Validate coupon if provided (server-side validation)
      if (code && code.trim()) {
        // Use authenticatedSupabase instead of supabase to preserve user context
        const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
          p_code: code.trim(),
          p_course_id: course.id,
          p_price: priceInARS,
          p_currency: 'ARS'
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

        // Coupon is valid
        couponData = validationResult;
        finalPrice = validationResult.final_price;
      }

      // Initialize Mercado Pago SDK
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error('MP_ACCESS_TOKEN not configured');
        return res.status(500).json({ error: "Payment gateway not configured" });
      }

      const client = new MercadoPagoConfig({ 
        accessToken: mpAccessToken
      });
      const preference = new Preference(client);

      // Prepare metadata
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

      // Create preference
      // Use REPLIT_DOMAINS for production deployment, or fallback to manual APP_URL or localhost
      const appUrl = process.env.APP_URL || 
        (process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'http://localhost:5000');

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
        auto_return: 'approved',
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

      res.json({
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
        preference_id: result.id
      });

    } catch (error: any) {
      console.error('Error creating MP preference:', error);
      res.status(500).json({ 
        error: "Failed to create payment preference",
        message: error.message 
      });
    }
  });

  // Free enrollment with 100% coupon
  app.post("/api/checkout/free-enroll", async (req, res) => {
    try {
      const { courseSlug, code } = req.body;
      const authHeader = req.headers.authorization || '';

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const token = authHeader.substring(7);

      // Get authenticated user
      const authenticatedSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return res.status(404).json({ error: "User profile not found" });
      }

      // Get course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return res.status(404).json({ error: "Course not found" });
      }

      // Validate coupon (must be 100% discount)
      if (!code || !code.trim()) {
        return res.status(400).json({ error: "Coupon code required for free enrollment" });
      }

      const { data: courseData } = await supabase
        .from('courses')
        .select('price')
        .eq('id', course.id)
        .single();

      const coursePrice = courseData?.price || 0;

      // Validate coupon using authenticated client (assuming USD price, will be converted if needed)
      const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: coursePrice,
        p_currency: 'USD'
      });

      if (couponError || !validationResult || !validationResult.ok) {
        console.error('Coupon validation failed:', couponError || validationResult);
        return res.status(400).json({ error: "Invalid coupon" });
      }

      // Verify it's actually 100% discount
      if (validationResult.final_price !== 0) {
        return res.status(400).json({ 
          error: "This coupon does not provide 100% discount. Please use the normal payment flow." 
        });
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', profile.id)
        .eq('course_id', course.id)
        .maybeSingle();

      if (existingEnrollment) {
        return res.status(400).json({ error: "You are already enrolled in this course" });
      }

      // Create course enrollment
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year subscription

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: profile.id,
          course_id: course.id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: 'coupon_100',
          amount_paid: 0,
          currency: priceData?.currency_code || 'ARS'
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        return res.status(500).json({ error: "Failed to create enrollment" });
      }

      // Record coupon redemption
      if (validationResult.coupon_id) {
        await supabase
          .from('coupon_redemptions')
          .insert({
            coupon_id: validationResult.coupon_id,
            user_id: profile.id,
            course_id: course.id,
            original_price: coursePrice,
            discount_amount: validationResult.discount,
            final_price: 0
          });
      }

      console.log('✅ Free enrollment created:', {
        userId: profile.id,
        courseId: course.id,
        couponCode: code
      });

      res.json({ 
        success: true,
        message: 'Enrollment created successfully',
        courseSlug: course.slug
      });

    } catch (error: any) {
      console.error('Error creating free enrollment:', error);
      res.status(500).json({ 
        error: "Failed to create enrollment",
        message: error.message 
      });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/webhooks/mp", async (req, res) => {
    try {
      console.log('🔔 MP Webhook received:', req.body);

      const { type, data } = req.body;

      // Only process payment notifications
      if (type !== 'payment') {
        console.log('Ignoring non-payment notification:', type);
        return res.status(200).json({ ok: true });
      }

      if (!data || !data.id) {
        console.log('Invalid webhook data - missing payment ID');
        return res.status(400).json({ error: "Invalid webhook data" });
      }

      // Initialize MP SDK
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error('MP_ACCESS_TOKEN not configured');
        return res.status(500).json({ error: "Payment gateway not configured" });
      }

      const client = new MercadoPagoConfig({ 
        accessToken: mpAccessToken
      });
      const payment = new Payment(client);

      // Get payment details from MP
      const paymentData = await payment.get({ id: data.id });

      console.log('💳 Payment data:', {
        id: paymentData.id,
        status: paymentData.status,
        metadata: paymentData.metadata
      });

      // Only process approved payments
      if (paymentData.status !== 'approved') {
        console.log('Payment not approved, status:', paymentData.status);
        return res.status(200).json({ ok: true, message: 'Payment not approved yet' });
      }

      const metadata = paymentData.metadata;
      
      if (!metadata || !metadata.course_id || !metadata.user_id) {
        console.error('Missing required metadata:', metadata);
        return res.status(400).json({ error: "Invalid payment metadata" });
      }

      // Check if enrollment already exists (idempotency)
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

      // Create course enrollment
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year subscription

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        // Don't return error to MP, we'll try again on next notification
        return res.status(500).json({ error: "Failed to create enrollment" });
      }

      console.log('✅ Enrollment created successfully');

      // 1️⃣ Log webhook event (auditoría)
      await supabase
        .from('payment_events')
        .insert({
          provider: 'mercadopago',
          provider_event_id: String(paymentData.id),
          provider_event_type: paymentData.status,
          status: 'completed',
          provider_payment_id: String(paymentData.id),
          amount: metadata.final_price,
          currency: 'ARS',
          user_hint: metadata.user_id,
          course_hint: metadata.course_id,
          raw_payload: paymentData
        })
        .select()
        .single();

      // 2️⃣ Create/update payment record (tabla maestra unificada)
      await supabase
        .from('payments')
        .upsert({
          provider: 'mercadopago',
          provider_payment_id: String(paymentData.id),
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          product_type: 'course',
          product_id: metadata.course_id,
          amount: metadata.final_price,
          currency: 'ARS',
          status: 'completed',
          approved_at: new Date().toISOString()
        }, {
          onConflict: 'provider,provider_payment_id'
        });

      // Redeem coupon if present
      if (metadata.coupon_code && metadata.coupon_id) {
        console.log('💰 Redeeming coupon:', metadata.coupon_code);

        const { error: redeemError } = await supabase.rpc('redeem_coupon', {
          p_code: metadata.coupon_code,
          p_course_id: metadata.course_id,
          p_price: metadata.list_price,
          p_currency: 'ARS',
          p_order_id: paymentData.id
        });

        if (redeemError) {
          console.error('Error redeeming coupon (non-critical):', redeemError);
        } else {
          console.log('✅ Coupon redeemed successfully');
        }
      }

      res.status(200).json({ ok: true, message: 'Payment processed successfully' });

    } catch (error: any) {
      console.error('❌ Error processing MP webhook:', error);
      res.status(500).json({ 
        error: "Failed to process webhook",
        message: error.message 
      });
    }
  });

  // ============================================
  // PayPal Integration Routes
  // ============================================

  // POST /api/paypal/create-course-order - Proxy to Vercel function
  app.post("/api/paypal/create-course-order", async (req, res) => {
    try {
      const handler = await import('../../api/paypal/create-course-order.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[PayPal create-course-order] Error:", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // POST /api/paypal/create-subscription-order - Proxy to Vercel function
  app.post("/api/paypal/create-subscription-order", async (req, res) => {
    try {
      const handler = await import('../../api/paypal/create-subscription-order.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[PayPal create-subscription-order] Error:", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // POST /api/paypal/capture-order
  app.post("/api/paypal/capture-order", async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      return res.status(200).send("ok");
    }

    try {
      const { orderId } = req.body ?? {};
      
      if (!orderId) {
        return res.status(400).json({ ok: false, error: "Missing orderId" });
      }

      const cid = process.env.PAYPAL_CLIENT_ID;
      const csec = process.env.PAYPAL_CLIENT_SECRET;
      const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
      const base =
        process.env.PAYPAL_BASE_URL ||
        (env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

      if (!cid || !csec) {
        return res.status(500).json({ ok: false, error: "Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET" });
      }

      // 1) OAuth
      const auth = Buffer.from(`${cid}:${csec}`).toString("base64");
      const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      const tokenText = await tokenResp.text();
      if (!tokenResp.ok) {
        console.error("PayPal OAuth error:", tokenResp.status, tokenText);
        return res.status(500).json({
          ok: false,
          error: `OAuth fallo ${tokenResp.status}`,
          details: tokenText,
        });
      }

      const tokenJson = JSON.parse(tokenText);
      const access_token = tokenJson.access_token;
      if (!access_token) {
        return res.status(500).json({ ok: false, error: "No se obtuvo 'access_token' de PayPal" });
      }

      // 2) Capture Order
      const capResp = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      });

      const capText = await capResp.text();
      let capJson: any;
      try {
        capJson = JSON.parse(capText);
      } catch {
        capJson = { raw: capText };
      }

      if (!capResp.ok) {
        console.error("PayPal Capture error:", capResp.status, capJson);
        return res.status(500).json({
          ok: false,
          error: `Capture fallo ${capResp.status}`,
          details: capJson,
        });
      }

      console.log('[PayPal capture-order] Capture response:', JSON.stringify(capJson, null, 2));

      // 3) Procesar el pago y guardar en base de datos
      const captureOrderId = capJson.id;
      const status = capJson.status;
      const captureObj = capJson?.purchase_units?.[0]?.payments?.captures?.[0];
      const customIdBase64 = captureObj?.custom_id || null;
      const providerPaymentId = captureObj?.id || null;
      const amountValue = captureObj?.amount?.value || null;
      const currencyCode = captureObj?.amount?.currency_code || null;

      console.log('[PayPal capture-order] Order ID:', captureOrderId, 'Status:', status, 'Custom ID:', customIdBase64);

      // Decodificar custom_id y resolver course_id
      let userId: string | null = null;
      let courseId: string | null = null;
      let courseSlug: string | null = null;
      
      if (customIdBase64) {
        try {
          const decodedJson = Buffer.from(customIdBase64, 'base64').toString('utf-8');
          const customData = JSON.parse(decodedJson);
          userId = customData.user_id || null;
          courseSlug = customData.course_slug || null;
          
          if (courseSlug) {
            const { data: course } = await getAdminClient()
              .from('courses')
              .select('id')
              .eq('slug', courseSlug)
              .maybeSingle();
            courseId = course?.id || null;
          }
          
          console.log('[PayPal capture-order] Decoded custom_id:', { userId, courseSlug, courseId });
        } catch (e) {
          console.error('[PayPal capture-order] Error decodificando custom_id:', e);
        }
      }

      console.log('[PayPal capture-order] Parsed - User ID:', userId, 'Course ID:', courseId);

      // Guardar evento en payment_events
      try {
        await getAdminClient().from('payment_events').insert({
          provider: 'paypal',
          provider_event_id: providerPaymentId,
          provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
          status: 'PROCESSED',
          raw_payload: capJson,
          order_id: captureOrderId,
          custom_id: customIdBase64,
          user_hint: userId,
          course_hint: courseSlug,
          provider_payment_id: providerPaymentId,
          amount: amountValue ? parseFloat(amountValue) : null,
          currency: currencyCode,
        });
        console.log('[PayPal capture-order] ✅ Guardado en payment_events');
      } catch (e: any) {
        console.error('[PayPal capture-order] Error insertando en payment_events:', e);
      }

      // Si tenemos user_id y course_id, crear payment y enrollment
      if (userId && courseId && status === 'COMPLETED') {
        try {
          // Insert en payments (ignorar si ya existe)
          const { error: paymentError } = await getAdminClient().from('payments').insert({
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
              console.log('[PayPal capture-order] ⚠️ Payment ya existe (ignorado)');
            } else {
              console.error('[PayPal capture-order] Error insertando payment:', paymentError);
            }
          } else {
            console.log('[PayPal capture-order] ✅ Payment insertado');
          }

          // Upsert enrollment
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);
          await getAdminClient().from('course_enrollments').upsert({
            user_id: userId,
            course_id: courseId,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }, { onConflict: 'user_id,course_id' });
          console.log('[PayPal capture-order] ✅ Enrollment creado/actualizado');
        } catch (e: any) {
          console.error('[PayPal capture-order] Error en payments/enrollment:', e);
        }
      }

      return res.status(200).json({ ok: true, capture: capJson });
    } catch (e: any) {
      console.error("capture-order ERROR:", e);
      return res.status(500).json({ ok: false, error: e?.message ?? "Unknown error" });
    }
  });

  // GET /api/paypal/capture-and-redirect - Proxy to Vercel function
  app.get("/api/paypal/capture-and-redirect", async (req, res) => {
    try {
      const handler = await import('../../api/checkout/paypal/capture-and-redirect');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error('[PayPal capture-and-redirect proxy] Error:', error);
      return res.status(500).send(`
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
              <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">${String(error?.message || error)}</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // GET /api/paypal/capture-subscription - Proxy to Vercel function
  app.get("/api/paypal/capture-subscription", async (req, res) => {
    try {
      const handler = await import('../../api/paypal/capture-subscription');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error('[PayPal capture-subscription proxy] Error:', error);
      return res.status(500).send(`
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
              <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">${String(error?.message || error)}</p>
              <p style="margin-top: 1rem;">
                <a href="/organization/billing" style="color: #2563eb; text-decoration: none;">Volver a Facturación</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // POST /api/paypal/webhook - DEPRECATED
  // El webhook real está en Supabase Edge Function `paypal_webhook`
  app.post("/api/paypal/webhook", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(410).json({
      ok: false,
      message: "Este endpoint no se usa. El webhook válido es la Edge Function `paypal_webhook` en Supabase."
    });
  });

  // ==================== ADMIN PAYMENT MANAGEMENT ====================
  
  // GET /api/admin/payments - Get all bank transfer payments (admin only)
  app.get("/api/admin/payments", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      
      const { data: payments, error: paymentsError } = await adminClient
        .from('bank_transfer_payments')
        .select(`
          *,
          users!bank_transfer_payments_user_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false});
      
      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        return res.status(500).json({ error: "Failed to fetch payments" });
      }
      
      // Now fetch course info for each payment
      const enrichedPayments = await Promise.all(
        (payments || []).map(async (payment) => {
          if (!payment.course_id) {
            return { ...payment, course_info: null };
          }
          
          // Get course details directly
          const { data: course } = await adminClient
            .from('courses')
            .select('id, title, slug, price')
            .eq('id', payment.course_id)
            .maybeSingle();
          
          return { ...payment, course_info: course };
        })
      );
      
      return res.json(enrichedPayments);
    } catch (error: any) {
      console.error("Error in /api/admin/payments:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/payments/:id/approve - Approve bank transfer payment (admin only)
  app.patch("/api/admin/payments/:id/approve", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      const adminClient = getAdminClient();
      
      const { data: payment, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select(`
          *,
          users!bank_transfer_payments_user_id_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError || !payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ error: "Payment is not pending" });
      }
      
      // ✅ Usamos el course_id que está guardado directamente en bank_transfer_payments
      let courseId = payment.course_id;
      
      // ⚠️ VALIDATE EARLY: No courseId = fail before any updates
      if (!courseId) {
        console.error('❌ [approve] Missing courseId - cannot approve payment without valid course');
        return res.status(400).json({ 
          error: "Cannot approve payment", 
          details: "Course ID not found. Please contact support - this payment may have corrupted data."
        });
      }
      
      // Default to 12 months (1 year) for all courses
      const months: number = 12;
      
      console.log('✅ [approve] Validation passed, proceeding with approval:', {
        courseId,
        userId: payment.users?.id,
        months
      });
      
      // 1️⃣ Actualizar bank_transfer_payments
      const { error: updateError } = await adminClient
        .from('bank_transfer_payments')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (updateError) {
        console.error("Error updating payment:", updateError);
        return res.status(500).json({ error: "Failed to update payment" });
      }

      // 2️⃣ Actualizar payments (tabla maestra)
      if (payment.payment_id) {
        await adminClient
          .from('payments')
          .update({ 
            status: 'completed',
            approved_at: new Date().toISOString()
          })
          .eq('id', payment.payment_id);
      }
      
      // 3️⃣ Otorgar acceso al curso
      if (!payment.users?.id) {
        console.error('❌ [approve] Missing user ID - cannot enroll user');
        return res.status(500).json({ 
          error: "Failed to enroll user", 
          details: "User ID not found in payment record." 
        });
      }
      
      console.log('✅ [approve] All validations passed, enrolling user...');
      try {
        await enrollUserInCourse(payment.users.id, courseId, months);
        console.log('✅ [approve] User enrolled successfully');
      } catch (enrollError: any) {
        console.error('❌ [approve] Enrollment failed:', enrollError);
        return res.status(500).json({ 
          error: "Failed to enroll user", 
          details: enrollError.message 
        });
      }
      
      return res.json({ success: true, message: "Payment approved and user enrolled" });
    } catch (error: any) {
      console.error("Error in /api/admin/payments/:id/approve:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/payments/:id/reject - Reject bank transfer payment (admin only)
  app.patch("/api/admin/payments/:id/reject", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      const adminClient = getAdminClient();
      
      const { data: payment, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select('id, status, payment_id')
        .eq('id', id)
        .single();
      
      if (fetchError || !payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ error: "Payment is not pending" });
      }
      
      // 1️⃣ Actualizar bank_transfer_payments
      const { error: updateError } = await adminClient
        .from('bank_transfer_payments')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (updateError) {
        console.error("Error updating payment:", updateError);
        return res.status(500).json({ error: "Failed to update payment" });
      }

      // 2️⃣ Actualizar payments (tabla maestra)
      if (payment.payment_id) {
        await adminClient
          .from('payments')
          .update({ status: 'rejected' })
          .eq('id', payment.payment_id);
      }
      
      return res.json({ success: true, message: "Payment rejected" });
    } catch (error: any) {
      console.error("Error in /api/admin/payments/:id/reject:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
