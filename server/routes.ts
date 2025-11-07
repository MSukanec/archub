import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';
import { getRouteDeps, supabase, getAdminClient, supabaseUrl, supabaseServiceKey } from './routes/_base';
import { registerReferenceRoutes } from './routes/reference';
import { registerUserRoutes } from './routes/user';
import { registerProjectRoutes } from './routes/projects';
import { registerSubcontractRoutes } from './routes/subcontracts';
import { registerCourseRoutes } from './routes/courses';
import { registerAdminRoutes } from './routes/admin';
import { registerPaymentRoutes } from './routes/payments';
import { registerBankTransferRoutes } from './routes/bank-transfer';
import { registerContactRoutes } from './routes/contacts';
import { registerAIRoutes } from './routes/ai';
import { registerSupportRoutes } from './routes/support';
import { registerPersonnelRoutes } from './routes/personnel';

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

  // Register payment routes (MercadoPago and PayPal checkout, webhooks)
  registerPaymentRoutes(app, deps);

  // Register bank transfer routes (create, upload receipt, get status)
  registerBankTransferRoutes(app, deps);

  // Register contact routes (professional contacts)
  registerContactRoutes(app, deps);

  // Register personnel routes (personnel rates, payments, attendance)
  registerPersonnelRoutes(app, deps);

  // Register AI routes (home greeting, suggestions)
  registerAIRoutes(app, deps);

  // Register support routes (support messages)
  registerSupportRoutes(app, deps);

  // ============================================
  // Organization Member Invitation (Proxy to Vercel function)
  // ============================================
  
  app.post("/api/invite-member", async (req, res) => {
    try {
      const handler = await import('../api/invite-member');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[invite-member] Error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ============================================
  // Mercado Pago Integration Routes (Proxies)
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
      const { data: rpcUser } = await authenticatedSupabase.rpc('get_user');
      
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
