// api/lib/handlers/projects/projects.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess } from './shared.js';

export interface CreateProjectParams {
  organization_id: string;
  name: string;
  status?: string;
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  project_type_id?: string | null;
  modality_id?: string | null;
}

export interface UpdateProjectParams {
  projectId: string;
  name?: string;
  status?: string;
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  project_type_id?: string | null;
  modality_id?: string | null;
  organization_id?: string;
}

export interface DeleteProjectParams {
  projectId: string;
  organizationId: string;
}

export type CreateProjectResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type UpdateProjectResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type DeleteProjectResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function createProject(
  ctx: ProjectsContext,
  params: CreateProjectParams
): Promise<CreateProjectResult> {
  try {
    const { supabase } = ctx;

    if (!params.organization_id || !params.name) {
      return { success: false, error: 'organization_id and name are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Create new project
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .upsert({
        organization_id: params.organization_id,
        name: params.name,
        status: params.status || 'active',
        created_by: orgAccessResult.memberId,
        created_at: new Date().toISOString(),
        is_active: true,
        color: params.color || '#84cc16',
        use_custom_color: params.use_custom_color || false,
        custom_color_h: params.custom_color_h || null,
        custom_color_hex: params.custom_color_hex || null,
      }, {
        onConflict: 'id'
      })
      .select()
      .maybeSingle();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return { success: false, error: 'Failed to create project' };
    }

    if (!newProject) {
      return { success: false, error: 'Failed to create project - no data returned' };
    }

    // Create project_data (required for RLS)
    const { error: dataError } = await supabase
      .from('project_data')
      .insert({
        project_id: newProject.id,
        organization_id: params.organization_id,
        project_type_id: params.project_type_id || null,
        modality_id: params.modality_id || null,
      });

    if (dataError) {
      console.error('Error creating project_data:', dataError);
      
      // Rollback: delete the project we just created
      await supabase.from('projects').delete().eq('id', newProject.id);
      
      return { success: false, error: 'Failed to create project data' };
    }

    return { success: true, data: newProject };

  } catch (error: any) {
    console.error('Error in createProject handler:', error);
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

export async function updateProject(
  ctx: ProjectsContext,
  params: UpdateProjectParams
): Promise<UpdateProjectResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId) {
      return { success: false, error: 'projectId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const { data: project, error: projectFetchError } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', params.projectId)
      .maybeSingle();

    if (projectFetchError) {
      console.error('Error fetching project:', projectFetchError);
      return { success: false, error: 'Failed to fetch project' };
    }

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, project.organization_id);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Update main project
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: params.name,
        status: params.status,
        color: params.color || '#84cc16',
        use_custom_color: params.use_custom_color || false,
        custom_color_h: params.custom_color_h || null,
        custom_color_hex: params.custom_color_hex || null,
      })
      .eq('id', params.projectId);

    if (projectError) {
      console.error('Error updating project:', projectError);
      return { success: false, error: 'Failed to update project' };
    }

    // Check if project_data exists
    const { data: existingProjectData, error: checkError } = await supabase
      .from('project_data')
      .select('id')
      .eq('project_id', params.projectId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking project_data:', checkError);
      return { success: false, error: 'Failed to check project data' };
    }

    if (existingProjectData) {
      // Update existing project_data
      const { error: dataError } = await supabase
        .from('project_data')
        .update({
          project_type_id: params.project_type_id || null,
          modality_id: params.modality_id || null,
        })
        .eq('project_id', params.projectId);

      if (dataError) {
        console.error('Error updating project_data:', dataError);
        return { success: false, error: 'Failed to update project data' };
      }
    } else if (params.project_type_id || params.modality_id) {
      // Create project_data if doesn't exist and we have data to insert
      const { error: dataError } = await supabase
        .from('project_data')
        .upsert({
          project_id: params.projectId,
          organization_id: params.organization_id!,
          project_type_id: params.project_type_id || null,
          modality_id: params.modality_id || null,
        }, {
          onConflict: 'project_id'
        });

      if (dataError) {
        console.error('Error creating project_data:', dataError);
        return { success: false, error: 'Failed to create project data' };
      }
    }

    // Get updated project
    const { data: updatedProject, error: updatedFetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.projectId)
      .maybeSingle();

    if (updatedFetchError) {
      console.error('Error fetching updated project:', updatedFetchError);
      return { success: false, error: 'Project updated but failed to fetch result' };
    }

    if (!updatedProject) {
      return { success: false, error: 'Project not found after update' };
    }

    return { success: true, data: updatedProject };

  } catch (error: any) {
    console.error('Error in updateProject handler:', error);
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

export async function deleteProject(
  ctx: ProjectsContext,
  params: DeleteProjectParams
): Promise<DeleteProjectResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // First delete project_data (if exists)
    await supabase
      .from('project_data')
      .delete()
      .eq('project_id', params.projectId);

    // Delete the main project with organization verification
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.projectId)
      .eq('organization_id', params.organizationId);

    if (projectError) {
      console.error('Error deleting project:', projectError);
      return { success: false, error: 'Failed to delete project' };
    }

    return { success: true, message: 'Project deleted successfully' };

  } catch (error: any) {
    console.error('Error in deleteProject handler:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}
