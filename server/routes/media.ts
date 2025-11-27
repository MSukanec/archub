import type { Express } from "express";
import type { RouteDeps } from './_base';
import { deleteMediaFile } from '../lib/handlers/media/deleteMediaFile.js';
import { getGalleryFiles } from '../lib/handlers/media/getGalleryFiles.js';

export function registerMediaRoutes(app: Express, deps: RouteDeps) {
  
  app.get("/api/media/gallery", async (req, res) => {
    try {
      const token = deps.extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const supabase = deps.createAuthenticatedClient(token);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id, last_project_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organizationId = preferences.last_organization_id;
      const projectId = (req.query.projectId as string) || preferences.last_project_id || null;
      const category = req.query.category as 'photo' | 'video' | 'document' | undefined;

      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership || !membership.is_active) {
        return res.status(403).json({ error: 'User is not an active member of this organization' });
      }

      const result = await getGalleryFiles(supabase, {
        organizationId,
        projectId,
        category: category || null
      });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(400).json({ error: result.error });
      }

    } catch (error: any) {
      console.error('Error in media gallery handler:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch gallery files" });
    }
  });

  app.post("/api/media/delete", async (req, res) => {
    try {
      const token = deps.extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = deps.createAuthenticatedClient(token);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .single();

      if (prefError || !preferences?.last_organization_id) {
        return res.status(400).json({ error: 'User must belong to an organization' });
      }

      const organizationId = preferences.last_organization_id;

      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .single();

      if (memberError || !membership || !membership.is_active) {
        return res.status(403).json({ error: 'User is not an active member of this organization' });
      }

      const { linkId } = req.body;

      if (!linkId) {
        return res.status(400).json({ error: 'linkId is required' });
      }

      const result = await deleteMediaFile(supabase, {
        linkId,
        organizationId
      });

      if (result.success) {
        return res.status(200).json({ 
          success: true,
          deletedFileFromStorage: result.deletedFileFromStorage 
        });
      } else {
        return res.status(400).json({ error: result.error });
      }

    } catch (error: any) {
      console.error('Error in media delete handler:', error);
      return res.status(500).json({ error: error.message || "Failed to delete media file" });
    }
  });
}
