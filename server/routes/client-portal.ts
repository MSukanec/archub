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

      if (token) {
        const authenticatedClient = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();
        
        if (!authError && user) {
          const { data: dbUser } = await authenticatedClient
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (dbUser) {
            const { data: project } = await supabase
              .from('projects')
              .select('organization_id')
              .eq('id', projectId)
              .single();

            if (project) {
              const { data: membership } = await supabase
                .from('organization_members')
                .select('id, role')
                .eq('organization_id', project.organization_id)
                .eq('user_id', dbUser.id)
                .eq('is_active', true)
                .single();

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
