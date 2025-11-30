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

      const { data: { user }, error: authError } = await authSupabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }

      const { organization_id, target_plan_slug, billing_period } = req.body;

      if (!organization_id || !target_plan_slug || !billing_period) {
        return res.status(400).json({ 
          error: "Faltan parámetros: organization_id, target_plan_slug, billing_period" 
        });
      }

      const result = await calculateProration(getAdminClient(), {
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
  
  // POST /api/checkout/mp/create-subscription
  app.post("/api/checkout/mp/create-subscription", mpController.createSubscription);
  
  // GET /api/checkout/mp/success-handler (NO auth required - redirect endpoint)
  app.get("/api/checkout/mp/success-handler", mpController.successHandler);
  
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
