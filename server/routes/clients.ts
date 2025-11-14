import type { Express } from "express";
import type { RouteDeps } from './_base';
import { handleGetClientRoles } from '../../api/_lib/handlers/clients/getClientRoles.js';
import { createClientRole } from '../../api/_lib/handlers/clients/createClientRole.js';
import { updateClientRole } from '../../api/_lib/handlers/clients/updateClientRole.js';
import { deleteClientRole } from '../../api/_lib/handlers/clients/deleteClientRole.js';
import { extractToken, createAuthenticatedClient } from '../../api/lib/auth-helpers.js';

/**
 * Register client routes
 * 
 * Endpoints:
 * - GET /api/client-roles - Get all client roles for organization
 * - POST /api/client-roles - Create new client role
 * - PATCH /api/client-roles/:id - Update client role
 * - DELETE /api/client-roles/:id - Delete client role
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

  // POST /api/client-roles - Create new client role
  app.post("/api/client-roles", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);
      const { name, organization_id } = req.body;

      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' });
      }

      const role = await createClientRole({ supabase }, { name, organization_id });
      return res.status(201).json(role);
    } catch (error: any) {
      console.error('Error creating client role:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // PATCH /api/client-roles/:id - Update client role
  app.patch("/api/client-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const token = extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);
      const { name, organization_id } = req.body;

      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' });
      }

      const role = await updateClientRole({ supabase }, id, organization_id, { name });
      return res.status(200).json(role);
    } catch (error: any) {
      console.error('Error updating client role:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // DELETE /api/client-roles/:id - Delete client role
  app.delete("/api/client-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { organization_id } = req.query;
      const token = extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      if (!organization_id || typeof organization_id !== 'string') {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      const supabase = createAuthenticatedClient(token);

      await deleteClientRole({ supabase }, id, organization_id);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting client role:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
