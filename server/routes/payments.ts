import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getAdminClient } from './_base';
import { createClient } from '@supabase/supabase-js';

// Import controllers
import * as mpController from '../controllers/payments/mp.controller.js';
import * as paypalController from '../controllers/payments/paypal.controller.js';
import * as bankTransferController from '../controllers/payments/bankTransfer.controller.js';

// Import proration calculator
import { calculateProration } from '../lib/handlers/checkout/shared/proration.js';

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

async function enrollUserInCourse(user_id: string, course_id: string, months: number = 12) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  
  const enrollmentData = { 
    user_id, 
    course_id, 
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  };
  
  const { data, error } = await getAdminClient()
    .from('course_enrollments')
    .insert(enrollmentData)
    .select();
  
  if (error) {
    if (error.code === '23505') {
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
      return updated;
    }
    console.error('❌ [enrollUserInCourse] ERROR:', error);
    throw error;
  }
  
  return data;
}

// ==================== PAYMENT ROUTES ====================

export function registerPaymentRoutes(app: Express, deps: RouteDeps) {
  // ==================== PRORATION CALCULATOR ====================
  
  // POST /api/checkout/calculate-proration - Calculate upgrade price with proration credit
  app.post("/api/checkout/calculate-proration", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const authSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }

      const { organization_id, target_plan_slug, billing_period } = req.body;

      if (!organization_id || !target_plan_slug || !billing_period) {
        return res.status(400).json({ 
          error: "Faltan parámetros: organization_id, target_plan_slug, billing_period" 
        });
      }

      // Get user from users table (auth_id -> users.id)
      const adminClient = getAdminClient();
      const { data: dbUser, error: userError } = await adminClient
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (userError || !dbUser) {
        console.error('[proration] User lookup error:', userError);
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      // SECURITY: Verify user belongs to the organization
      const { data: membership, error: membershipError } = await adminClient
        .from('organization_members')
        .select('id, role_id')
        .eq('user_id', dbUser.id)
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (membershipError) {
        console.error('[proration] Membership check error:', membershipError);
        return res.status(500).json({ error: "Error verificando pertenencia a organización" });
      }

      if (!membership) {
        return res.status(403).json({ error: "No tienes acceso a esta organización" });
      }

      const result = await calculateProration(adminClient, {
        organizationId: organization_id,
        targetPlanSlug: target_plan_slug,
        billingPeriod: billing_period as 'monthly' | 'annual',
      });

      console.log('[proration] Calculated:', {
        hasActiveSubscription: result.hasActiveSubscription,
        currentPlan: result.currentPlan?.name,
        targetPlan: result.targetPlan.name,
        credit: result.credit,
        finalPrice: result.finalPrice,
      });

      return res.json({ ok: true, data: result });
    } catch (error: any) {
      console.error('[proration] Error:', error);
      return res.status(500).json({ error: error.message || "Error interno" });
    }
  });

  // ==================== MERCADO PAGO CHECKOUT & WEBHOOKS ====================
  
  // POST /api/checkout/mp/create-course
  app.post("/api/checkout/mp/create-course", mpController.createCourse);
  
  // POST /api/checkout/mp/create-subscription (Legacy - one-time payment)
  app.post("/api/checkout/mp/create-subscription", mpController.createSubscription);
  
  // POST /api/checkout/mp/create-recurring (NEW - recurring subscription via Preapproval API)
  app.post("/api/checkout/mp/create-recurring", mpController.createRecurring);
  
  // GET /api/checkout/mp/success-handler (NO auth required - redirect endpoint for courses)
  app.get("/api/checkout/mp/success-handler", mpController.successHandler);
  
  // GET /api/checkout/mp/subscription-success (NO auth required - redirect endpoint for subscriptions)
  app.get("/api/checkout/mp/subscription-success", mpController.subscriptionSuccessHandler);
  
  // POST /api/checkout/mp/webhook (NO auth required - webhook endpoint)
  app.post("/api/checkout/mp/webhook", mpController.webhook);
  app.options("/api/checkout/mp/webhook", mpController.webhook);

  // ==================== PAYPAL CHECKOUT & WEBHOOKS ====================
  
  // POST /api/checkout/paypal/create-course
  app.post("/api/checkout/paypal/create-course", paypalController.createCourse);
  
  // POST /api/checkout/paypal/create-subscription
  app.post("/api/checkout/paypal/create-subscription", paypalController.createSubscription);
  
  // POST /api/checkout/paypal/capture-course
  app.post("/api/checkout/paypal/capture-course", paypalController.captureCourse);
  
  // GET /api/checkout/paypal/capture-subscription (NO auth required - returns HTML)
  app.get("/api/checkout/paypal/capture-subscription", paypalController.captureSubscription);
  
  // GET /api/checkout/paypal/capture-and-redirect (NO auth required - redirect endpoint)
  app.get("/api/checkout/paypal/capture-and-redirect", paypalController.captureAndRedirect);
  
  // POST /api/checkout/paypal/webhook (NO auth required - webhook endpoint)
  app.post("/api/checkout/paypal/webhook", paypalController.webhook);
  app.options("/api/checkout/paypal/webhook", paypalController.webhook);

  // POST /api/admin/paypal/sync-plans (Admin only - creates PayPal products and billing plans)
  app.post("/api/admin/paypal/sync-plans", paypalController.syncPlans);

  // POST /api/admin/mp/sync-plans (Admin only - creates MercadoPago preapproval plans)
  app.post("/api/admin/mp/sync-plans", mpController.syncPlans);

  // POST /api/dev/mp/sync-plans (DEV ONLY - no auth required for testing)
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/dev/mp/sync-plans", async (req, res) => {
      try {
        const adminClient = getAdminClient();
        
        // Get exchange rate
        const { data: exchangeRate, error: exchangeError } = await adminClient
          .from("exchange_rates")
          .select("rate")
          .eq("from_currency", "USD")
          .eq("to_currency", "ARS")
          .eq("is_active", true)
          .single();

        if (exchangeError || !exchangeRate) {
          return res.status(500).json({ error: "Tasa de cambio USD/ARS no encontrada" });
        }

        const arsRate = Number(exchangeRate.rate);
        console.log(`[DEV MP sync] Usando tasa de cambio USD/ARS: ${arsRate}`);

        // Get paid plans (excluding free)
        const { data: plans, error: plansError } = await adminClient
          .from("plans")
          .select("id, name, slug, monthly_amount, annual_amount, mp_plan_monthly_id, mp_plan_annual_id")
          .neq("slug", "free");

        console.log(`[DEV MP sync] Plans query result:`, { plans, plansError });

        if (plansError) {
          console.error(`[DEV MP sync] Error fetching plans:`, plansError);
          return res.status(500).json({ error: plansError.message, details: plansError });
        }

        if (!plans?.length) {
          return res.status(404).json({ error: "No se encontraron planes de pago activos", plansFound: plans });
        }

        // Import MP functions dynamically
        const { createMPPreapprovalPlan, getMPPreapprovalPlan } = await import('../lib/handlers/checkout/mp/subscriptions-api.js');

        const results = [];
        const backUrl = 'https://0.0.0.0:5000/checkout/success';

        for (const plan of plans) {
          let monthlyPlanId = plan.mp_plan_monthly_id;
          let annualPlanId = plan.mp_plan_annual_id;
          let created = false;

          // Check/create monthly plan
          if (monthlyPlanId) {
            const existing = await getMPPreapprovalPlan(monthlyPlanId);
            if (!existing.success) monthlyPlanId = null;
          }

          if (!monthlyPlanId && plan.monthly_amount && Number(plan.monthly_amount) > 0) {
            const priceARS = Math.round(Number(plan.monthly_amount) * arsRate * 100) / 100;
            const result = await createMPPreapprovalPlan({
              reason: `Seencel ${plan.name} - Mensual`,
              auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: priceARS, currency_id: "ARS" },
              back_url: backUrl,
              external_reference: `seencel_plan_${plan.slug}_monthly`,
            });
            if (result.success) {
              monthlyPlanId = result.planId;
              created = true;
              console.log(`[DEV MP sync] Created monthly plan ${monthlyPlanId} - ARS $${priceARS}`);
            }
          }

          // Check/create annual plan
          if (annualPlanId) {
            const existing = await getMPPreapprovalPlan(annualPlanId);
            if (!existing.success) annualPlanId = null;
          }

          if (!annualPlanId && plan.annual_amount && Number(plan.annual_amount) > 0) {
            const priceARS = Math.round(Number(plan.annual_amount) * arsRate * 100) / 100;
            const result = await createMPPreapprovalPlan({
              reason: `Seencel ${plan.name} - Anual`,
              auto_recurring: { frequency: 12, frequency_type: "months", transaction_amount: priceARS, currency_id: "ARS" },
              back_url: backUrl,
              external_reference: `seencel_plan_${plan.slug}_annual`,
            });
            if (result.success) {
              annualPlanId = result.planId;
              created = true;
              console.log(`[DEV MP sync] Created annual plan ${annualPlanId} - ARS $${priceARS}`);
            }
          }

          // Update DB if created
          if (created) {
            await adminClient
              .from("plans")
              .update({ mp_plan_monthly_id: monthlyPlanId, mp_plan_annual_id: annualPlanId })
              .eq("id", plan.id);
          }

          results.push({ planSlug: plan.slug, monthlyPlanId, annualPlanId, created });
        }

        return res.json({ success: true, results });
      } catch (error: any) {
        console.error("[DEV MP sync] Error:", error);
        return res.status(500).json({ error: error.message });
      }
    });
  }

  // POST /api/dev/mp/activate-pending-subscription (DEV ONLY - manually activate pending MP subscription)
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/dev/mp/activate-pending-subscription", async (req, res) => {
      try {
        const { preapproval_id, preference_id } = req.body;
        
        if (!preapproval_id && !preference_id) {
          return res.status(400).json({ error: "preapproval_id or preference_id is required" });
        }
        
        const { handleSubscriptionReturn } = await import('../lib/handlers/checkout/mp/handleSubscriptionReturn.js');
        
        const mockReq = {
          query: {
            preapproval_id: preapproval_id,
          }
        } as any;
        
        const result = await handleSubscriptionReturn(mockReq);
        
        if (result.success) {
          return res.json({ 
            ok: true, 
            activated: result.activated, 
            message: result.message 
          });
        } else {
          return res.status(400).json({ 
            ok: false, 
            error: result.error 
          });
        }
      } catch (error: any) {
        console.error("[DEV MP activate-pending] Error:", error);
        return res.status(500).json({ error: error.message });
      }
    });
    
    // GET /api/dev/mp/pending-subscriptions (DEV ONLY - list pending MP subscriptions)
    app.get("/api/dev/mp/pending-subscriptions", async (req, res) => {
      try {
        const adminClient = getAdminClient();
        
        const { data, error } = await adminClient
          .from("mp_subscription_preferences")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.json({ ok: true, preferences: data });
      } catch (error: any) {
        console.error("[DEV MP pending-subs] Error:", error);
        return res.status(500).json({ error: error.message });
      }
    });
  }

  // ==================== BANK TRANSFER ====================
  // NOTE: Bank transfer routes are now handled in server/routes/bank-transfer.ts
  // with the new architecture using image_bucket + image_path instead of receipt_url
  // The routes below are kept commented for reference only
  
  // Legacy routes (replaced by bank-transfer.ts):
  // app.post("/api/bank-transfer/create", bankTransferController.create);
  // app.options("/api/bank-transfer/create", bankTransferController.create);
  // app.post("/api/bank-transfer/upload", bankTransferController.upload);
  // app.options("/api/bank-transfer/upload", bankTransferController.upload);

  // ==================== ADMIN ROUTES (Bank Transfer Management) ====================

  // GET /api/admin/payments - Get all pending bank transfer payments (admin only)
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
      
      const { data: payments, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select(`
          *,
          users:user_id (id, full_name, email),
          courses:course_id (id, title, slug)
        `)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error("Error fetching payments:", fetchError);
        return res.status(500).json({ error: "Failed to fetch payments" });
      }
      
      return res.json(payments);
    } catch (error: any) {
      console.error("Error in /api/admin/payments:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/payments/all - Get all completed payments with user and coupon info (admin only)
  app.get("/api/admin/payments/all", async (req, res) => {
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
      
      // Fetch payments with user and course relations
      const { data: payments, error: fetchError } = await adminClient
        .from('payments')
        .select(`
          *,
          users:user_id (id, auth_id, full_name, email),
          courses:course_id (id, title, slug)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error("Error fetching all payments:", fetchError);
        return res.status(500).json({ error: "Failed to fetch payments" });
      }

      if (!payments || payments.length === 0) {
        return res.json([]);
      }

      // Fetch coupon redemptions for these payments
      const paymentIds = payments.map((p: any) => p.id);
      let redemptionsMap = new Map();
      const { data: redemptions, error: redemptionsError } = await adminClient
        .from('coupon_redemptions')
        .select('order_id, coupon_id, amount_saved, coupons!inner(code)')
        .in('order_id', paymentIds);

      if (!redemptionsError && redemptions) {
        redemptionsMap = new Map(
          redemptions.map((r: any) => [
            r.order_id,
            {
              coupon_code: r.coupons?.code,
              discount: r.amount_saved
            }
          ])
        );
      }

      // Enrich payments with coupon data
      const enrichedPayments = payments.map((payment: any) => ({
        ...payment,
        coupon_redemptions: redemptionsMap.get(payment.id) || null
      }));
      
      return res.json(enrichedPayments);
    } catch (error: any) {
      console.error("Error in /api/admin/payments/all:", error);
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
      const { months = 12 } = req.body;
      const adminClient = getAdminClient();
      
      const { data: payment, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select('*, users:user_id (id), courses:course_id (id)')
        .eq('id', id)
        .single();
      
      if (fetchError || !payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ error: "Payment is not pending" });
      }

      if (!payment.course_id) {
        console.error('❌ [approve] Missing course_id - cannot enroll user');
        return res.status(500).json({ 
          error: "Failed to enroll user", 
          details: "Course ID not found in payment record." 
        });
      }

      const courseId = payment.course_id;
      
      const { error: updateError } = await adminClient
        .from('bank_transfer_payments')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (updateError) {
        console.error("Error updating payment:", updateError);
        return res.status(500).json({ error: "Failed to update payment" });
      }

      if (payment.payment_id) {
        await adminClient
          .from('payments')
          .update({ status: 'completed', approved_at: new Date().toISOString() })
          .eq('id', payment.payment_id);
      }
      
      if (!payment.users?.id) {
        console.error('❌ [approve] Missing user ID - cannot enroll user');
        return res.status(500).json({ 
          error: "Failed to enroll user", 
          details: "User ID not found in payment record." 
        });
      }
      
      try {
        await enrollUserInCourse(payment.users.id, courseId, months);
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
      
      const { error: updateError } = await adminClient
        .from('bank_transfer_payments')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (updateError) {
        console.error("Error updating payment:", updateError);
        return res.status(500).json({ error: "Failed to update payment" });
      }

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
