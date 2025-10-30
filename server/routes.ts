import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { getRouteDeps, supabase, getAdminClient, supabaseUrl, supabaseServiceKey } from './routes/_base';
import { registerReferenceRoutes } from './routes/reference';
import { registerUserRoutes } from './routes/user';
import { registerProjectRoutes } from './routes/projects';
import { registerSubcontractRoutes } from './routes/subcontracts';
import { registerCourseRoutes } from './routes/courses';
import { registerAdminRoutes } from './routes/admin';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get shared dependencies
  const deps = getRouteDeps();
  
  // Register reference data routes (countries, task parameters, test endpoint)
  registerReferenceRoutes(app, deps);

  // Register user routes (profile, preferences, current-user)
  registerUserRoutes(app, deps);

  // Register project routes (projects, budgets, budget items, design phase tasks)
  registerProjectRoutes(app, deps);

  // Register subcontract routes (movements, subcontracts, bids, tasks)
  registerSubcontractRoutes(app, deps);

  // Register course routes (lessons progress, notes, enrollments, dashboard)
  registerCourseRoutes(app, deps);

  // Register admin routes (courses, modules, lessons, enrollments, dashboard)
  registerAdminRoutes(app, deps);

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

      // Get course price
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

      // Validate coupon if provided (server-side validation)
      if (code && code.trim()) {
        // Use authenticatedSupabase instead of supabase to preserve user context
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
      const appUrl = process.env.APP_URL || process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';

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

      const { data: priceData } = await supabase
        .from('course_prices')
        .select('amount, currency_code')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const coursePrice = priceData?.amount || 0;

      // Validate coupon using authenticated client
      const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: coursePrice,
        p_currency: priceData?.currency_code || 'ARS'
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

      // Log payment
      const { error: logError } = await supabase
        .from('payments_log')
        .insert({
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          provider: 'mercadopago',
          provider_payment_id: String(paymentData.id),
          status: paymentData.status,
          amount: metadata.final_price,
          currency: 'ARS',
          external_reference: paymentData.external_reference,
          raw_payload: paymentData
        });

      if (logError) {
        console.error('Error logging payment (non-critical):', logError);
      }

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
  
  // Helper functions for PayPal (adapted from api/paypal/_utils.ts)
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
      .from('course_prices')
      .select('currency_code, amount, courses!inner(slug)')
      .eq('courses.slug', course_slug)
      .eq('provider', 'paypal')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      throw new Error(`Precio no encontrado para ${course_slug} (paypal)`);
    }
    
    return { currency: data.currency_code || 'USD', amount: String(data.amount) };
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

  async function enrollUserInCourse(user_id: string, course_slug: string) {
    await getAdminClient().from('course_enrollments').upsert(
      { user_id, course_slug, started_at: new Date().toISOString() },
      { onConflict: 'user_id,course_slug' }
    );
  }

  // POST /api/paypal/create-order
  app.post("/api/paypal/create-order", async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      return res.status(200).send("ok");
    }

    try {
      const { user_id, course_slug, amount_usd, description = "Archub purchase" } = req.body || {};
      
      if (!user_id || !course_slug || !amount_usd) {
        return res.status(400).json({ ok: false, error: "Missing user_id, course_slug or amount_usd" });
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
          error: `OAuth PayPal falló: ${tokenResp.status}`,
          details: tokenText,
        });
      }
      const tokenJson = JSON.parse(tokenText);
      const access_token = tokenJson.access_token;
      if (!access_token) {
        return res.status(500).json({ ok: false, error: "No se obtuvo 'access_token' de PayPal" });
      }

      // 2) Resolve course_id from course_slug
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', course_slug)
        .single();

      if (courseError || !course) {
        return res.status(404).json({ ok: false, error: "Course not found" });
      }
      
      // Determine return URL base (dynamic for Replit preview and production)
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const host = req.headers['x-forwarded-host'] || req.headers['host'];
      const returnBase = `${protocol}://${host}`;

      // Generate unique invoice_id (PayPal requires uniqueness)
      const uniqueInvoiceId = `user:${user_id};course:${course.id};ts:${Date.now()}`;
      
      const createResp = await fetch(`${base}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: { currency_code: "USD", value: String(amount_usd) },
              description,
              invoice_id: uniqueInvoiceId,
            },
          ],
          application_context: {
            brand_name: "Archub",
            user_action: "PAY_NOW",
            return_url: `${returnBase}/api/paypal/capture-and-redirect?course_slug=${course_slug}`,
            cancel_url: `${returnBase}/learning/courses`,
          },
        }),
      });

      const createText = await createResp.text();
      let createJson: any;
      try {
        createJson = JSON.parse(createText);
      } catch {
        createJson = { raw: createText };
      }

      if (!createResp.ok) {
        console.error("PayPal Create Order error:", createResp.status, createJson);
        return res.status(500).json({ 
          ok: false, 
          error: `CreateOrder falló: ${createResp.status}`, 
          details: createJson 
        });
      }

      return res.status(200).json({ ok: true, order: createJson });
    } catch (e: any) {
      console.error("create-order ERROR:", e);
      return res.status(500).json({ ok: false, error: e?.message ?? "Unknown error" });
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
      const handler = await import('../api/paypal/capture-and-redirect.js');
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

  // POST /api/paypal/webhook - DEPRECATED
  // El webhook real está en Supabase Edge Function `paypal_webhook`
  app.post("/api/paypal/webhook", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(410).json({
      ok: false,
      message: "Este endpoint no se usa. El webhook válido es la Edge Function `paypal_webhook` en Supabase."
    });
  });

  // ============================================
  // End PayPal Integration Routes
  // ============================================

  // ============================================
  // Mercado Pago Integration Routes
  // ============================================

  // POST /api/mp/create-preference - Proxy to Vercel function
  app.post("/api/mp/create-preference", async (req, res) => {
    try {
      const handler = await import('../api/mp/create-preference.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP create-preference] Error:", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // GET /api/mp/success-handler - Verify payment and enroll
  app.get("/api/mp/success-handler", async (req, res) => {
    try {
      const handler = await import('../api/mp/success-handler.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP success-handler] Error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html><head><title>Error - Archub</title><meta charset="UTF-8"></head>
        <body style="font-family: system-ui; text-align: center; padding: 2rem;">
          <h1>⚠️ Error</h1>
          <p>Hubo un problema al procesar tu pago: ${error.message}</p>
          <p><a href="/learning/courses" style="color: #2563eb;">Volver a Capacitaciones</a></p>
        </body></html>
      `);
    }
  });

  // POST /api/mp/webhook - Payment notifications from Mercado Pago
  app.post("/api/mp/webhook", async (req, res) => {
    try {
      const handler = await import('../api/mp/webhook.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP webhook] Error:", error);
      res.status(200).json({ ok: true, error: "logged" });
    }
  });

  // ============================================
  // End Mercado Pago Integration Routes
  // ============================================

  // Diagnostic endpoints for payments
  app.get("/api/diag/last-payment-events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, error } = await getAdminClient()
        .from('payment_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return res.json({ ok: true, events: data });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get("/api/diag/last-payments", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, error } = await getAdminClient()
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return res.json({ ok: true, payments: data });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  // TEMPORARY DEBUG ENDPOINT
  app.get("/api/debug/user-info", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get auth user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Search by email
      const { data: userByEmail } = await authenticatedSupabase
        .from('users')
        .select('id, email, auth_id, full_name')
        .ilike('email', user.email!)
        .maybeSingle();
      
      // Search by auth_id
      const { data: userByAuthId } = await authenticatedSupabase
        .from('users')
        .select('id, email, auth_id, full_name')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      // Get RPC result
      const { data: rpcUser } = await authenticatedSupabase.rpc('archub_get_user');
      
      // Get enrollments with the correct user_id
      const correctUserId = userByAuthId?.id || userByEmail?.id;
      const { data: enrollments } = correctUserId 
        ? await authenticatedSupabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', correctUserId)
        : { data: null };
      
      // Get ALL enrollments to see what user_ids exist
      const { data: allEnrollments } = await authenticatedSupabase
        .from('course_enrollments')
        .select('user_id, course_id, status, created_at')
        .limit(20);
      
      return res.json({
        auth_user_id: user.id,
        auth_user_email: user.email,
        user_by_email: userByEmail,
        user_by_auth_id: userByAuthId,
        rpc_user_id: rpcUser?.user?.id || null,
        rpc_user_auth_id: rpcUser?.user?.auth_id || null,
        correct_user_id: correctUserId,
        enrollments_for_correct_user: enrollments,
        all_enrollments_sample: allEnrollments,
      });
    } catch (error: any) {
      console.error('Debug endpoint error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
