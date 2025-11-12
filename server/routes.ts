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
  // Organization Invitations Routes
  // ============================================
  
  // GET /api/pending-invitations/:userId - Get pending invitations for a user
  app.get("/api/pending-invitations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const token = deps.extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = deps.createAuthenticatedClient(token);
      
      // Verify the authenticated user matches the requested userId
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser || dbUser.id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Query pending invitations with organization and role data
      // Note: This query needs to be done via a view or RPC in Supabase due to PostgREST limitations
      // For now, we'll fetch invitations and then enrich with additional data
      const { data: invitations, error: invError } = await authenticatedSupabase
        .from('organization_invitations')
        .select(`
          id,
          organization_id,
          role_id,
          invited_by,
          created_at,
          status
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (invError) {
        console.error('Error fetching pending invitations:', invError);
        return res.status(500).json({ error: 'Failed to fetch pending invitations' });
      }
      
      if (!invitations || invitations.length === 0) {
        return res.json([]);
      }
      
      // Fetch organization and role data for each invitation
      const enrichedInvitations = await Promise.all(
        invitations.map(async (inv) => {
          // Get organization data with logo
          const { data: org, error: orgError } = await authenticatedSupabase
            .from('organizations')
            .select('name, logo_url')
            .eq('id', inv.organization_id)
            .single();
          
          if (orgError) {
            console.error('Error fetching organization:', orgError);
          }
          
          // Get role name
          const { data: role, error: roleError } = await authenticatedSupabase
            .from('roles')
            .select('name')
            .eq('id', inv.role_id)
            .single();
          
          if (roleError) {
            console.error('Error fetching role:', roleError);
          }
          
          // Get organization members (up to 10 for display, only active members)
          const { data: members, error: membersError } = await authenticatedSupabase
            .from('organization_members')
            .select(`
              id,
              user_id,
              users (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('organization_id', inv.organization_id)
            .eq('is_active', true)
            .limit(10);
          
          if (membersError) {
            console.error('Error fetching members:', membersError);
          }
          
          // Transform members to flat structure
          const transformedMembers = (members || []).map((m: any) => ({
            id: m.users?.id || m.id,
            full_name: m.users?.full_name || 'Usuario',
            avatar_url: m.users?.avatar_url,
          }));
          
          return {
            id: inv.id,
            organization_id: inv.organization_id,
            organization_name: org?.name || 'Organización',
            organization_avatar: (org?.logo_url && org.logo_url.trim() !== '') ? org.logo_url : null,
            role_id: inv.role_id,
            role_name: role?.name || 'Miembro',
            invited_by: inv.invited_by,
            created_at: inv.created_at,
            members: transformedMembers,
          };
        })
      );
      
      res.json(enrichedInvitations);
    } catch (error: any) {
      console.error("[pending-invitations] Error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // POST /api/accept-invitation - Accept an organization invitation
  app.post("/api/accept-invitation", async (req, res) => {
    try {
      const { invitationId } = req.body;
      const token = deps.extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      if (!invitationId) {
        return res.status(400).json({ error: "invitationId is required" });
      }
      
      const authenticatedSupabase = deps.createAuthenticatedClient(token);
      
      // Get authenticated user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get the invitation (without status filter to handle idempotency)
      const { data: invitation, error: invError } = await authenticatedSupabase
        .from('organization_invitations')
        .select('id, organization_id, role_id, user_id, status')
        .eq('id', invitationId)
        .eq('user_id', dbUser.id)
        .maybeSingle();
      
      if (invError || !invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // If already accepted, check if member exists (idempotency)
      if (invitation.status === 'accepted') {
        const { data: existingMember } = await authenticatedSupabase
          .from('organization_members')
          .select('id')
          .eq('user_id', dbUser.id)
          .eq('organization_id', invitation.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (existingMember) {
          return res.json({ success: true });
        }
      } else if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation already processed" });
      }
      
      // Check for existing membership
      const { data: existingMember } = await authenticatedSupabase
        .from('organization_members')
        .select('id')
        .eq('user_id', dbUser.id)
        .eq('organization_id', invitation.organization_id)
        .maybeSingle();
      
      if (existingMember) {
        // Just mark as accepted
        await authenticatedSupabase
          .from('organization_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitationId);
        
        return res.json({ success: true });
      }
      
      // Update status FIRST (prevents duplicate accepts)
      const { error: updateError } = await authenticatedSupabase
        .from('organization_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('status', 'pending');
      
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        return res.status(500).json({ error: 'Failed to update invitation status' });
      }
      
      // Create member AFTER status update
      const { error: memberError } = await authenticatedSupabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: dbUser.id,
          role_id: invitation.role_id,
          is_active: true,
        });
      
      if (memberError) {
        console.error('Error creating organization member:', memberError);
        return res.status(500).json({ error: 'Failed to create organization member. Please contact support.' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[accept-invitation] Error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // POST /api/reject-invitation - Reject an organization invitation
  app.post("/api/reject-invitation", async (req, res) => {
    try {
      const { invitationId } = req.body;
      const token = deps.extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      if (!invitationId) {
        return res.status(400).json({ error: "invitationId is required" });
      }
      
      const authenticatedSupabase = deps.createAuthenticatedClient(token);
      
      // Get authenticated user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify the invitation belongs to the current user and is pending
      const { data: invitation, error: invError } = await authenticatedSupabase
        .from('organization_invitations')
        .select('id, user_id, status')
        .eq('id', invitationId)
        .eq('user_id', dbUser.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (invError || !invitation) {
        return res.status(404).json({ error: "Invitation not found or already processed" });
      }
      
      // Update invitation status to rejected
      const { error: updateError } = await authenticatedSupabase
        .from('organization_invitations')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);
      
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        return res.status(500).json({ error: 'Failed to reject invitation' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[reject-invitation] Error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ============================================
  // Mercado Pago Integration Routes (Proxies)
  // ============================================

  // DEPRECATED - Use create-course-preference or create-subscription-preference instead
  // POST /api/mp/create-preference - Proxy to Vercel function (LEGACY UNIFIED ENDPOINT)
  app.post("/api/mp/create-preference", async (req, res) => {
    try {
      const handler = await import('../api/mp/create-preference.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP create-preference] Error:", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // POST /api/mp/create-course-preference - Proxy to Vercel function
  app.post("/api/mp/create-course-preference", async (req, res) => {
    try {
      const handler = await import('../api/mp/create-course-preference.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP create-course-preference] Error:", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // POST /api/mp/create-subscription-preference - Proxy to Vercel function
  app.post("/api/mp/create-subscription-preference", async (req, res) => {
    try {
      const handler = await import('../api/mp/create-subscription-preference.js');
      await handler.default(req as any, res as any);
    } catch (error: any) {
      console.error("[MP create-subscription-preference] Error:", error);
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
