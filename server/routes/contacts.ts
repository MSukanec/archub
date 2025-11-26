import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getContacts } from '../lib/handlers/contacts/getContacts.js';
import { extractToken, getUserFromToken } from '../lib/auth/helpers.js';

/**
 * Register contact routes
 * 
 * Endpoints:
 * - GET /api/contacts - Get all contacts for organization (optimized)
 * - GET /api/contacts/:id - Get single contact by ID
 */
export function registerContactRoutes(app: Express, deps: RouteDeps) {
  // GET /api/contacts/:id - Get single contact by ID
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
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

      // Query single contact with full enrichment (use left join for optional contact_types)
      const { data: contact, error } = await userAuth.supabase
        .from('contacts')
        .select(`
          *,
          contact_type_links(
            contact_types(id, name)
          )
        `)
        .eq('id', id)
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contact:', error);
        return res.status(500).json({ error: "Failed to fetch contact" });
      }

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Transform contact_type_links to flat contact_types array
      const contact_types = contact.contact_type_links
        ?.map((link: any) => link.contact_types)
        .filter(Boolean) || [];

      // Get linked user if exists
      let linked_user = null;
      if (contact.linked_user_id) {
        const { data: userData } = await userAuth.supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .eq('id', contact.linked_user_id)
          .maybeSingle();
        linked_user = userData;
      }

      const result = {
        ...contact,
        contact_types,
        linked_user,
        contact_type_links: undefined // Remove raw links
      };

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in contact by id handler:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch contact" });
    }
  });

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
      const { mode } = req.query;
      const params = {
        organizationId: organization_id as string,
        userId: userAuth.userId,
        mode: (mode === 'light' ? 'light' : 'full') as 'full' | 'light'
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
