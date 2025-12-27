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
import { registerClientRoutes } from './routes/clients';
import { registerAIRoutes } from './routes/ai';
import { registerSupportRoutes } from './routes/support';
import { registerPersonnelRoutes } from './routes/personnel';
import { registerSubscriptionRoutes } from './routes/subscriptions';
import { registerBillingRoutes } from './routes/billing';
import { registerLearningRoutes } from './routes/learning';
import { registerOrganizationRoutes } from './routes/organization';
import { registerCommunityRoutes } from './routes/community';
import { registerImportRoutes } from './routes/import';
import { registerMediaRoutes } from './routes/media';
import { registerEmailRoutes } from './routes/email';
import { registerLayoutRoutes } from './routes/layout';
import { registerClientPortalRoutes } from './routes/client-portal';
import { registerPdfRoutes } from './routes/pdf';
import { registerFounderRoutes } from './routes/founders';
import { registerForumRoutes } from './routes/forum';
import { registerPinsRoutes } from './routes/pins';
import { registerExtensionRoutes } from './routes/extension';
import { registerAcquisitionRoutes } from './routes/acquisition';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get shared dependencies
  const deps = getRouteDeps();
  
  // Register acquisition routes (user acquisition tracking for OAuth)
  registerAcquisitionRoutes(app, deps);
  
  // Register email routes (Resend integration)
  registerEmailRoutes(app, deps);
  
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

  // Register learning routes (courses dashboard, lesson notes, progress)
  registerLearningRoutes(app, deps);

  // Register admin routes (courses, modules, lessons, enrollments, dashboard)
  registerAdminRoutes(app, deps);

  // Register payment routes (MercadoPago and PayPal checkout, webhooks)
  registerPaymentRoutes(app, deps);

  // Register bank transfer routes (create, upload receipt, get status)
  registerBankTransferRoutes(app, deps);

  // Register contact routes (professional contacts)
  registerContactRoutes(app, deps);

  // Register client routes (client roles)
  registerClientRoutes(app, deps);

  // Register personnel routes (personnel rates, payments, attendance)
  registerPersonnelRoutes(app, deps);

  // Register AI routes (home greeting, suggestions)
  registerAIRoutes(app, deps);

  // Register support routes (support messages)
  registerSupportRoutes(app, deps);

  // Register subscription routes (current subscription, schedule downgrade)
  registerSubscriptionRoutes(app, deps);

  // Register billing routes (next invoice, billing cycles)
  registerBillingRoutes(app, deps);

  // Register organization routes (members, invitations, profile)
  registerOrganizationRoutes(app, deps);

  // Register community routes (active users, organizations, projects, stats)
  registerCommunityRoutes(app, deps);

  // Register import routes (AI suggest mapping, save mappings)
  registerImportRoutes(app, deps);

  // Register media routes (gallery, upload, delete)
  registerMediaRoutes(app, deps);

  // Register layout routes (hero sections for carousels)
  registerLayoutRoutes(app, deps);

  // Register client portal routes (public project view for clients)
  registerClientPortalRoutes(app, deps);

  // Register PDF routes (templates, customization)
  registerPdfRoutes(app, deps);

  // Register founders portal routes (events, voting, forum, directory)
  registerFounderRoutes(app, deps);

  // Register forum routes (categories, threads, posts, reactions)
  registerForumRoutes(app, deps);

  // Register pins routes (Chrome extension - Pinterest-like pins)
  registerPinsRoutes(app, deps);

  // Register extension routes (context endpoint for Chrome extension)
  registerExtensionRoutes(app, deps);

  // Public feature flags endpoint (for blocking purchases, etc.)
  app.get("/api/feature-flags", async (req, res) => {
    try {
      const { data: flags, error } = await getAdminClient()
        .from('feature_flags')
        .select('key, value, category')
        .order('key');
      
      if (error) {
        console.error('[FeatureFlags] Error fetching flags:', error);
        return res.json({});
      }
      
      const flagsMap: Record<string, boolean> = {};
      for (const flag of flags || []) {
        flagsMap[flag.key] = flag.value;
      }
      
      res.set('Cache-Control', 'public, max-age=5');
      return res.json(flagsMap);
    } catch (e: any) {
      console.error('[FeatureFlags] Error:', e);
      return res.json({});
    }
  });

  // Flow blocking status endpoint (public - for preventive blocking)
  app.get("/api/ops/flow-status", async (req, res) => {
    try {
      const flowKey = req.query.flow as string;
      
      const FLOW_BLOCK_RULES: Record<string, { alertTypes: string[]; severities: string[] }> = {
        user_signup: {
          alertTypes: ['system.integrity.failed', 'system.signup.blocked'],
          severities: ['critical'],
        },
        billing_checkout: {
          alertTypes: ['payment.approved_but_not_applied', 'payment.approved_not_applied'],
          severities: ['critical', 'high'],
        },
      };

      const { data: alerts, error } = await getAdminClient()
        .from('ops_alerts')
        .select('id, alert_type, severity, status, title')
        .in('status', ['open', 'ack'])
        .in('severity', ['critical', 'high']);

      if (error) {
        return res.json({ blocked: false, alerts: [] });
      }

      if (!flowKey) {
        return res.json({ 
          blocked: false, 
          alerts: alerts || [],
          flows: Object.keys(FLOW_BLOCK_RULES),
        });
      }

      const rules = FLOW_BLOCK_RULES[flowKey];
      if (!rules) {
        return res.json({ blocked: false, alerts: [] });
      }

      const blockingAlerts = (alerts || []).filter((alert) => {
        const matchesType = rules.alertTypes.some(
          (type) => alert.alert_type === type || alert.alert_type.includes(type.replace('system.', ''))
        );
        const matchesSeverity = rules.severities.includes(alert.severity);
        
        if (flowKey === 'user_signup' && alert.alert_type === 'system.integrity.failed' && alert.severity === 'critical') {
          return true;
        }
        
        return matchesType && matchesSeverity;
      });

      return res.json({
        flow: flowKey,
        blocked: blockingAlerts.length > 0,
        alerts: blockingAlerts,
      });
    } catch (e: any) {
      return res.json({ blocked: false, error: e.message });
    }
  });

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

  // ==========================================
  // SEO: Sitemap.xml endpoint for Google indexing
  // ==========================================
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Get all published courses from database
      const { data: courses, error } = await getAdminClient()
        .from('courses')
        .eq('is_deleted', false)
        .select('slug, updated_at')
        .eq('is_active', true)
        .eq('visibility', 'public')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching courses for sitemap:', error);
        return res.status(500).send('Error generating sitemap');
      }

      // Base URL - use VITE_SITE_URL if available, otherwise default
      const baseUrl = process.env.VITE_SITE_URL || 'https://seencel.com';
      
      // Generate XML sitemap
      const now = new Date().toISOString();
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Static pages
      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/cursos', priority: '0.9', changefreq: 'daily' },
      ];
      
      staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });
      
      // Dynamic course pages
      courses?.forEach(course => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/cursos/${course.slug}</loc>\n`;
        xml += `    <lastmod>${course.updated_at || now}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += '  </url>\n';
      });
      
      xml += '</urlset>';
      
      // Set content type to XML
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
