import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  createProject,
  updateProject,
  deleteProject,
  updateProjectLastActive,
  type CreateProjectParams,
  type UpdateProjectParams,
  type DeleteProjectParams,
  type UpdateProjectLastActiveParams
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

    const organization_id = req.body.organization_id;

    // Validate plan limits before creating project
    if (organization_id) {
      const { count: projectCount, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization_id)
        .eq('is_deleted', false);

      if (countError) {
        console.error('Error counting projects:', countError);
      } else {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('plan_id, plans(name, features)')
          .eq('id', organization_id)
          .single();

        if (!orgError && orgData) {
          const planName = (orgData as any).plans?.name;
          const planFeatures = (orgData as any).plans?.features || {};
          
          let maxProjects = 2;
          
          if (planFeatures.max_projects !== undefined) {
            maxProjects = planFeatures.max_projects === -1 ? Infinity : planFeatures.max_projects;
          } else if (planName === 'Teams' || planName === 'TEAMS') {
            maxProjects = Infinity;
          } else if (planName === 'Pro' || planName === 'PRO') {
            maxProjects = 25;
          } else if (planName === 'Free' || planName === 'FREE') {
            maxProjects = 2;
          }

          if (maxProjects !== Infinity && (projectCount || 0) >= maxProjects) {
            return res.status(403).json({ 
              error: 'Project limit reached',
              message: `You have reached the maximum number of projects (${maxProjects}) for your current plan. Please upgrade your plan to create more projects.`,
              current: projectCount,
              limit: maxProjects
            });
          }
        }
      }
    }

    const params: CreateProjectParams = {
      organization_id,
      name: req.body.name,
      status: req.body.status,
      color: req.body.color,
      use_custom_color: req.body.use_custom_color,
      custom_color_h: req.body.custom_color_h,
      custom_color_hex: req.body.custom_color_hex,
      project_type_id: req.body.project_type_id,
      project_modality_id: req.body.project_modality_id
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
      project_modality_id: req.body.project_modality_id,
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

export async function handleUpdateProjectLastActive(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateProjectLastActiveParams = {
      projectId: req.params.id,
      organizationId: req.body.organization_id
    };

    const result = await updateProjectLastActive(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateProjectLastActive controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update project last_active_at' });
  }
}
