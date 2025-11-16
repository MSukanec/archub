// server/lib/handlers/projects/clientCommitments.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface ListClientCommitmentsParams {
  projectId: string;
  organizationId: string;
}

export interface ClientCommitment {
  id: string;
  project_id: string;
  client_id: string;
  contact_id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  project_client: {
    id: string;
    unit: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
}

export type ListClientCommitmentsResult =
  | { success: true; data: ClientCommitment[] }
  | { success: false; error: string };

export interface DeleteClientCommitmentParams {
  projectId: string;
  commitmentId: string;
  organizationId: string;
}

export type DeleteClientCommitmentResult =
  | { success: true }
  | { success: false; error: string };

export interface CreateClientCommitmentParams {
  projectId: string;
  organizationId: string;
  commitmentData: {
    contact_id: string;
    client_id: string;
    amount: number;
    currency_id: string;
    exchange_rate: number;
    created_by: string;
  };
}

export type CreateClientCommitmentResult =
  | { success: true; data: ClientCommitment }
  | { success: false; error: string };

export interface UpdateClientCommitmentParams {
  projectId: string;
  commitmentId: string;
  organizationId: string;
  commitmentData: {
    contact_id?: string;
    client_id?: string;
    amount?: number;
    currency_id?: string;
    exchange_rate?: number;
  };
}

export type UpdateClientCommitmentResult =
  | { success: true; data: ClientCommitment }
  | { success: false; error: string };

/**
 * List all client commitments for a project
 */
export async function listClientCommitments(
  ctx: ProjectsContext,
  params: ListClientCommitmentsParams
): Promise<ListClientCommitmentsResult> {
  try {
    const { supabase } = ctx;
    const { projectId, organizationId } = params;

    if (!projectId || !organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    // 1. Ensure user is authenticated
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    // 2. Ensure user has access to this organization
    const orgAccessResult = await ensureOrganizationAccess(ctx, organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // 3. Validate project belongs to organization
    const projectResult = await getProjectById(ctx, projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // 4. Fetch commitments
    const { data: commitments, error } = await supabase
      .from('client_commitments')
      .select(`
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        contact:contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        ),
        project_client:project_clients!contact_id (
          id,
          unit
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol,
          name
        )
      `)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client commitments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: commitments as ClientCommitment[] };
  } catch (err: any) {
    console.error('Unexpected error in listClientCommitments:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}

/**
 * Create a new client commitment
 */
export async function createClientCommitment(
  ctx: ProjectsContext,
  params: CreateClientCommitmentParams
): Promise<CreateClientCommitmentResult> {
  try {
    const { supabase } = ctx;
    const { projectId, organizationId, commitmentData } = params;

    if (!projectId || !organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    // 1. Ensure user is authenticated
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    // 2. Ensure user has access to this organization
    const orgAccessResult = await ensureOrganizationAccess(ctx, organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // 3. Validate project belongs to organization
    const projectResult = await getProjectById(ctx, projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // 4. Validate that client_id belongs to this project (if provided)
    if (commitmentData.client_id) {
      const { data: projectClient, error: clientError } = await supabase
        .from('project_clients')
        .select('id, project_id')
        .eq('id', commitmentData.client_id)
        .eq('project_id', projectId)
        .single();

      if (clientError || !projectClient) {
        return { success: false, error: 'Client does not belong to this project' };
      }
    }

    // 5. Create commitment
    const { data: newCommitment, error: insertError } = await supabase
      .from('client_commitments')
      .insert({
        project_id: projectId,
        organization_id: organizationId,
        ...commitmentData,
      })
      .select(`
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        contact:contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        ),
        project_client:project_clients!contact_id (
          id,
          unit
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol,
          name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating client commitment:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, data: newCommitment as ClientCommitment };
  } catch (err: any) {
    console.error('Unexpected error in createClientCommitment:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}

/**
 * Update a client commitment
 */
export async function updateClientCommitment(
  ctx: ProjectsContext,
  params: UpdateClientCommitmentParams
): Promise<UpdateClientCommitmentResult> {
  try {
    const { supabase } = ctx;
    const { projectId, commitmentId, organizationId, commitmentData } = params;

    if (!projectId || !organizationId || !commitmentId) {
      return { success: false, error: 'projectId, commitmentId, and organizationId are required' };
    }

    // 1. Ensure user is authenticated
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    // 2. Ensure user has access to this organization
    const orgAccessResult = await ensureOrganizationAccess(ctx, organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // 3. Validate project belongs to organization
    const projectResult = await getProjectById(ctx, projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // 4. Verify the commitment exists and belongs to this project
    const { data: existingCommitment, error: fetchError } = await supabase
      .from('client_commitments')
      .select('id, project_id, organization_id')
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingCommitment) {
      return { success: false, error: 'Commitment not found' };
    }

    // 5. Validate that client_id belongs to this project (if being updated)
    if (commitmentData.client_id) {
      const { data: projectClient, error: clientError } = await supabase
        .from('project_clients')
        .select('id, project_id')
        .eq('id', commitmentData.client_id)
        .eq('project_id', projectId)
        .single();

      if (clientError || !projectClient) {
        return { success: false, error: 'Client does not belong to this project' };
      }
    }

    // 6. Update commitment
    const { data: updatedCommitment, error: updateError } = await supabase
      .from('client_commitments')
      .update({
        ...commitmentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .select(`
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        contact:contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        ),
        project_client:project_clients!contact_id (
          id,
          unit
        ),
        currency:currencies!currency_id (
          id,
          code,
          symbol,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating client commitment:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, data: updatedCommitment as ClientCommitment };
  } catch (err: any) {
    console.error('Unexpected error in updateClientCommitment:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}

/**
 * Delete a client commitment
 */
export async function deleteClientCommitment(
  ctx: ProjectsContext,
  params: DeleteClientCommitmentParams
): Promise<DeleteClientCommitmentResult> {
  try {
    const { supabase } = ctx;
    const { projectId, commitmentId, organizationId } = params;

    if (!projectId || !organizationId || !commitmentId) {
      return { success: false, error: 'projectId, commitmentId, and organizationId are required' };
    }

    // 1. Ensure user is authenticated
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    // 2. Ensure user has access to this organization
    const orgAccessResult = await ensureOrganizationAccess(ctx, organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // 3. Validate project belongs to organization
    const projectResult = await getProjectById(ctx, projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // 4. Verify the commitment exists and belongs to this project
    const { data: existingCommitment, error: fetchError } = await supabase
      .from('client_commitments')
      .select('id, project_id, organization_id')
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingCommitment) {
      return { success: false, error: 'Commitment not found' };
    }

    // 5. Delete commitment
    const { error: deleteError } = await supabase
      .from('client_commitments')
      .delete()
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting client commitment:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in deleteClientCommitment:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}
