import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getAdminClient } from './_base';
import { getClientPortalData } from '../lib/handlers/client-portal/getClientPortalData.js';
import { extractToken, createAuthenticatedClient } from '../lib/auth/helpers.js';
import { z } from 'zod';

const portalSettingsSchema = z.object({
  show_dashboard: z.boolean(),
  show_installments: z.boolean(),
  show_payments: z.boolean(),
  show_logs: z.boolean(),
  show_amounts: z.boolean(),
  show_progress: z.boolean(),
  allow_comments: z.boolean(),
});

async function verifyProjectMembership(token: string, projectId: string) {
  const supabase = getAdminClient();
  const authenticatedClient = createAuthenticatedClient(token);
  const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();
  
  if (authError || !user) {
    return { authorized: false, userId: null, organizationId: null };
  }
  
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
    
  if (!dbUser) {
    return { authorized: false, userId: null, organizationId: null };
  }
  
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single();
    
  if (!project) {
    return { authorized: false, userId: dbUser.id, organizationId: null };
  }
  
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select(`
      id, 
      role_id,
      role:roles!left (name)
    `)
    .eq('organization_id', project.organization_id)
    .eq('user_id', dbUser.id)
    .eq('is_active', true)
    .maybeSingle();
  
  console.log('[ClientPortal Config] Membership query result:', { membership, error: membershipError?.message });
    
  if (!membership) {
    return { authorized: false, userId: dbUser.id, organizationId: project.organization_id };
  }
  
  const roleName = (membership.role as any)?.name?.toLowerCase();
  const isAdmin = ['owner', 'admin', 'administrador', 'propietario'].includes(roleName);
  
  console.log('[ClientPortal Config] User role:', roleName, 'isAdmin:', isAdmin);
  
  return { 
    authorized: true, 
    isAdmin,
    memberId: membership.id,
    organizationId: project.organization_id 
  };
}

export function registerClientPortalRoutes(app: Express, deps: RouteDeps) {
  // GET portal settings for a project
  app.get("/api/client-portal/:projectId/config", async (req, res) => {
    try {
      const { projectId } = req.params;
      const token = extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { authorized, organizationId } = await verifyProjectMembership(token, projectId);
      
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized to view portal settings" });
      }
      
      const supabase = getAdminClient();
      
      // Try to get existing settings
      const { data: settings, error } = await supabase
        .from('client_portal_settings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching portal settings:', error);
        return res.status(500).json({ error: "Failed to fetch settings" });
      }
      
      // Return existing settings or defaults
      if (settings) {
        return res.status(200).json(settings);
      }
      
      // Return default settings if none exist
      return res.status(200).json({
        project_id: projectId,
        organization_id: organizationId,
        show_dashboard: true,
        show_installments: true,
        show_payments: true,
        show_logs: true,
        show_amounts: true,
        show_progress: true,
        allow_comments: false,
      });
    } catch (error: any) {
      console.error('Error in GET portal config:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch portal settings" });
    }
  });
  
  // PUT portal settings for a project (create or update)
  app.put("/api/client-portal/:projectId/config", async (req, res) => {
    try {
      const { projectId } = req.params;
      const token = extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { authorized, memberId, organizationId } = await verifyProjectMembership(token, projectId);
      
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized to update portal settings" });
      }
      
      const parseResult = portalSettingsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid settings data", details: parseResult.error.errors });
      }
      
      const supabase = getAdminClient();
      
      // Upsert settings
      const { data: settings, error } = await supabase
        .from('client_portal_settings')
        .upsert({
          project_id: projectId,
          organization_id: organizationId,
          ...parseResult.data,
          updated_at: new Date().toISOString(),
          updated_by: memberId,
        }, {
          onConflict: 'project_id'
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error saving portal settings:', error);
        return res.status(500).json({ error: "Failed to save settings" });
      }
      
      return res.status(200).json(settings);
    } catch (error: any) {
      console.error('Error in PUT portal config:', error);
      return res.status(500).json({ error: error.message || "Failed to save portal settings" });
    }
  });

  app.get("/api/client-portal/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { clientId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      const token = extractToken(req.headers.authorization);
      let isAdminPreview = false;
      let supabase = getAdminClient();

      console.log('[ClientPortal] Auth header present:', !!req.headers.authorization);
      console.log('[ClientPortal] Token extracted:', !!token);

      if (token) {
        const authenticatedClient = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();
        
        console.log('[ClientPortal] Auth user:', user?.id, 'error:', authError?.message);
        
        if (!authError && user) {
          const { data: dbUser } = await authenticatedClient
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          console.log('[ClientPortal] DB user found:', !!dbUser, 'id:', dbUser?.id);

          if (dbUser) {
            const { data: project } = await supabase
              .from('projects')
              .select('organization_id')
              .eq('id', projectId)
              .single();

            console.log('[ClientPortal] Project org:', project?.organization_id);

            if (project) {
              const { data: membership, error: membershipError } = await supabase
                .from('organization_members')
                .select('id, role_id')
                .eq('organization_id', project.organization_id)
                .eq('user_id', dbUser.id)
                .eq('is_active', true)
                .maybeSingle();

              console.log('[ClientPortal] Membership query - org:', project.organization_id, 'user:', dbUser.id);
              console.log('[ClientPortal] Membership found:', !!membership, 'error:', membershipError?.message);

              if (membership) {
                isAdminPreview = true;
                supabase = authenticatedClient;
              }
            }
          }
        }
      }

      const data = await getClientPortalData(supabase, {
        projectId,
        clientId: clientId as string | undefined,
        isAdminPreview,
      });

      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching client portal data:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch portal data" });
    }
  });
}
