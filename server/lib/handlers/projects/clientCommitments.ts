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
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  project_client: {
    id: string;
    unit: string | null;
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
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        is_deleted,
        deleted_at,
        project_client:project_clients!client_id (
          id,
          unit,
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
          )
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client commitments:', error);
      return { success: false, error: error.message };
    }

    // Transform the data to match the interface (Supabase returns arrays for joins)
    const transformedCommitments = commitments.map((commitment: any) => ({
      ...commitment,
      project_client: Array.isArray(commitment.project_client) && commitment.project_client.length > 0
        ? {
            ...commitment.project_client[0],
            contact: Array.isArray(commitment.project_client[0].contact) && commitment.project_client[0].contact.length > 0
              ? {
                  ...commitment.project_client[0].contact[0],
                  linked_user: Array.isArray(commitment.project_client[0].contact[0].linked_user) && commitment.project_client[0].contact[0].linked_user.length > 0
                    ? commitment.project_client[0].contact[0].linked_user[0]
                    : null,
                }
              : null,
          }
        : null,
      currency: Array.isArray(commitment.currency) && commitment.currency.length > 0
        ? commitment.currency[0]
        : null,
    }));

    return { success: true, data: transformedCommitments as ClientCommitment[] };
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
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        is_deleted,
        deleted_at,
        project_client:project_clients!client_id (
          id,
          unit,
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
          )
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

    // Transform the data to match the interface (Supabase returns arrays for joins)
    const transformed = {
      ...newCommitment,
      project_client: Array.isArray(newCommitment.project_client) && newCommitment.project_client.length > 0
        ? {
            ...newCommitment.project_client[0],
            contact: Array.isArray(newCommitment.project_client[0].contact) && newCommitment.project_client[0].contact.length > 0
              ? {
                  ...newCommitment.project_client[0].contact[0],
                  linked_user: Array.isArray(newCommitment.project_client[0].contact[0].linked_user) && newCommitment.project_client[0].contact[0].linked_user.length > 0
                    ? newCommitment.project_client[0].contact[0].linked_user[0]
                    : null,
                }
              : null,
          }
        : null,
      currency: Array.isArray(newCommitment.currency) && newCommitment.currency.length > 0
        ? newCommitment.currency[0]
        : null,
    };

    return { success: true, data: transformed as ClientCommitment };
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

    // 4. Verify the commitment exists and belongs to this project (and is not already deleted)
    const { data: existingCommitment, error: fetchError } = await supabase
      .from('client_commitments')
      .select('id, project_id, organization_id')
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
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
      .eq('is_deleted', false)
      .select(`
        id,
        project_id,
        client_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_at,
        updated_at,
        created_by,
        is_deleted,
        deleted_at,
        project_client:project_clients!client_id (
          id,
          unit,
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
          )
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

    // Transform the data to match the interface (Supabase returns arrays for joins)
    const transformed = {
      ...updatedCommitment,
      project_client: Array.isArray(updatedCommitment.project_client) && updatedCommitment.project_client.length > 0
        ? {
            ...updatedCommitment.project_client[0],
            contact: Array.isArray(updatedCommitment.project_client[0].contact) && updatedCommitment.project_client[0].contact.length > 0
              ? {
                  ...updatedCommitment.project_client[0].contact[0],
                  linked_user: Array.isArray(updatedCommitment.project_client[0].contact[0].linked_user) && updatedCommitment.project_client[0].contact[0].linked_user.length > 0
                    ? updatedCommitment.project_client[0].contact[0].linked_user[0]
                    : null,
                }
              : null,
          }
        : null,
      currency: Array.isArray(updatedCommitment.currency) && updatedCommitment.currency.length > 0
        ? updatedCommitment.currency[0]
        : null,
    };

    return { success: true, data: transformed as ClientCommitment };
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

    // 4. Verify the commitment exists and belongs to this project (and is not already deleted)
    const { data: existingCommitment, error: fetchError } = await supabase
      .from('client_commitments')
      .select('id, project_id, organization_id')
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingCommitment) {
      return { success: false, error: 'Commitment not found' };
    }

    // 5. Soft delete commitment
    const { error: deleteError } = await supabase
      .from('client_commitments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', commitmentId)
      .eq('project_id', projectId)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);

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
