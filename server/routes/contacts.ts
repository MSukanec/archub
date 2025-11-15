import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getContacts } from '../../api/lib/handlers/contacts/getContacts.js';
import { extractToken, getUserFromToken } from '../../api/lib/auth-helpers.js';

/**
 * Register contact routes
 * 
 * Endpoints:
 * - GET /api/contacts - Get all contacts for organization (optimized)
 */
export function registerContactRoutes(app: Express, deps: RouteDeps) {
  // GET /api/contacts - Get all contacts for organization (OPTIMIZED)
  app.get("/api/contacts", async (req, res) => {
    try {
      const { organization_id } = req.query;
      
      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }
      
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const userAuth = await getUserFromToken(token);
      if (!userAuth) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const ctx = { supabase: userAuth.supabase };
      const params = {
        organizationId: organization_id as string,
        userId: userAuth.userId
      };

      const result = await getContacts(ctx, params);
      
      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }

    } catch (error: any) {
      console.error('Error in contacts handler:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch contacts" });
    }
  });
}
