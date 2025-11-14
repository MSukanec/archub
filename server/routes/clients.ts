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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const supabase = createAuthenticatedClient(token);

      // Get user from token
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get organization_id from user preferences (server-side, not from request)
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organization_id = preferences.last_organization_id;

      // CRITICAL: Verify user is an active member of this organization
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organization_id)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this organization' });
      }

      if (!membership.is_active) {
        return res.status(403).json({ error: 'User membership is not active' });
      }

      const result = await handleGetClientRoles(
        { organizationId: organization_id },
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

      // Get user from token
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get organization_id from user preferences (server-side, not from request)
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organization_id = preferences.last_organization_id;

      // CRITICAL: Verify user is an active member of this organization
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organization_id)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this organization' });
      }

      if (!membership.is_active) {
        return res.status(403).json({ error: 'User membership is not active' });
      }

      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
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

      // Get user from token
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get organization_id from user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organization_id = preferences.last_organization_id;

      // CRITICAL: Verify user is an active member of this organization
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organization_id)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this organization' });
      }

      if (!membership.is_active) {
        return res.status(403).json({ error: 'User membership is not active' });
      }

      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
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
      const token = extractToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);

      // Get user from token
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get organization_id from user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organization_id = preferences.last_organization_id;

      // CRITICAL: Verify user is an active member of this organization
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organization_id)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this organization' });
      }

      if (!membership.is_active) {
        return res.status(403).json({ error: 'User membership is not active' });
      }

      await deleteClientRole({ supabase }, id, organization_id);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting client role:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
      }
  });
}
