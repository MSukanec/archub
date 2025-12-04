import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getAdminClient } from './_base';
import { getClientPortalData } from '../lib/handlers/client-portal/getClientPortalData.js';
import { extractToken, createAuthenticatedClient } from '../lib/auth/helpers.js';

export function registerClientPortalRoutes(app: Express, deps: RouteDeps) {
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
