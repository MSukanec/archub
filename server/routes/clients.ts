import type { Express } from "express";
import type { RouteDeps } from './_base';
import { handleGetClientRoles } from '../../api/_lib/handlers/clients/getClientRoles.js';
import { extractToken, createAuthenticatedClient } from '../../api/lib/auth-helpers.js';

/**
 * Register client routes
 * 
 * Endpoints:
 * - GET /api/client-roles - Get all client roles for organization
 */
export function registerClientRoutes(app: Express, deps: RouteDeps) {
  // GET /api/client-roles - Get all client roles for organization
  app.get("/api/client-roles", async (req, res) => {
    try {
      const { organization_id } = req.query;
      
      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const supabase = createAuthenticatedClient(token);

      const result = await handleGetClientRoles(
        { organizationId: organization_id as string },
        supabase
      );
      
      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(400).json({ error: result.error });
      }

    } catch (error: any) {
      console.error('Error in client-roles handler:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch client roles" });
    }
  });
}
