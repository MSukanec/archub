import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  createProject,
  updateProject,
  deleteProject,
  type CreateProjectParams,
  type UpdateProjectParams,
  type DeleteProjectParams
} from '../../lib/handlers/projects/projects.js';
import type { ProjectsContext } from '../../lib/handlers/projects/shared.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleCreateProject(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateProjectParams = {
      organization_id: req.body.organization_id,
      name: req.body.name,
      status: req.body.status,
      color: req.body.color,
      use_custom_color: req.body.use_custom_color,
      custom_color_h: req.body.custom_color_h,
      custom_color_hex: req.body.custom_color_hex,
      project_type_id: req.body.project_type_id,
      modality_id: req.body.modality_id
    };

    const result = await createProject(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createProject controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create project' });
  }
}

export async function handleUpdateProject(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateProjectParams = {
      projectId: req.params.id,
      name: req.body.name,
      status: req.body.status,
      color: req.body.color,
      use_custom_color: req.body.use_custom_color,
      custom_color_h: req.body.custom_color_h,
      custom_color_hex: req.body.custom_color_hex,
      project_type_id: req.body.project_type_id,
      modality_id: req.body.modality_id,
      organization_id: req.body.organization_id
    };

    const result = await updateProject(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateProject controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update project' });
  }
}

export async function handleDeleteProject(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteProjectParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organizationId as string
    };

    const result = await deleteProject(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteProject controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
}
