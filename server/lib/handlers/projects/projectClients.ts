// api/lib/handlers/projects/projectClients.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface ListClientsParams {
  projectId: string;
  organizationId: string;
}

export interface GetClientsSummaryParams {
  projectId: string;
  organizationId: string;
}

export interface GetClientParams {
  projectId: string;
  clientId: string;
  organizationId: string;
}

export interface CreateClientParams {
  projectId: string;
  organizationId: string;
  clientData: {
    contact_id: string;
    committed_amount?: number | null;
    currency_id?: string | null;
    unit?: string | null;
    exchange_rate?: number | null;
    client_role_id?: string | null;
    status?: string;
    is_primary?: boolean;
    notes?: string | null;
  };
}

export interface UpdateClientParams {
  projectId: string;
  clientId: string;
  organizationId: string;
  clientData: {
    unit?: string | null;
    committed_amount?: number | null;
    currency_id?: string | null;
    exchange_rate?: number | null;
    client_role_id?: string | null;
    status?: string;
    is_primary?: boolean;
    notes?: string | null;
  };
}

export interface DeleteClientParams {
  projectId: string;
  clientId: string;
  organizationId: string;
}

export type ListClientsResult =
  | { success: true; data: any[] }
  | { success: false; error: string };

export type GetClientsSummaryResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type GetClientResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type CreateClientResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type UpdateClientResult =
  | { success: true; data: any }
  | { success: false; error: string };

export type DeleteClientResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function listClients(
  ctx: ProjectsContext,
  params: ListClientsParams
): Promise<ListClientsResult> {
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

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Query project_clients with contact information
    const { data: projectClients, error } = await supabase
      .from('project_clients')
      .select(`
        *,
        contacts:contacts!contact_id (
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
        currency:currencies!currency_id (
          id,
          code,
          symbol
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project clients:', error);
      return { success: false, error: 'Failed to fetch project clients' };
    }

    return { success: true, data: projectClients || [] };

  } catch (error: any) {
    console.error('Error in listClients handler:', error);
    return { success: false, error: error.message || 'Failed to list clients' };
  }
}

export async function getClientsSummary(
  ctx: ProjectsContext,
  params: GetClientsSummaryParams
): Promise<GetClientsSummaryResult> {
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

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Fetch organization to get plan_id (avoid maybeSingle - use limit(1))
    const { data: orgDataArray, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan_id')
      .eq('id', params.organizationId)
      .limit(1);

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return { success: false, error: 'Failed to fetch organization' };
    }

    const orgData = orgDataArray && orgDataArray.length > 0 ? orgDataArray[0] : null;

    // Fetch plan details separately (like all other endpoints do)
    let planSlug = 'FREE';
    let isMultiCurrency = false;

    if (orgData?.plan_id) {
      const { data: planDataArray, error: planError } = await supabase
        .from('plans')
        .select('id, slug, name')
        .eq('id', orgData.plan_id)
        .limit(1);

      const planData = planDataArray && planDataArray.length > 0 ? planDataArray[0] : null;

      if (!planError && planData) {
        planSlug = planData.slug?.toUpperCase() || 'FREE';
        isMultiCurrency = planSlug === 'PRO' || planSlug === 'TEAMS' || planSlug === 'ENTERPRISE';
      }
    }

    // 🚀 PERFORMANCE BOOST: Use simplified client_list_view (direct table JOINs only)
    // This view includes ONLY data displayed in LISTA tab (no financial data)
    const { data: viewData, error: viewError } = await supabase
      .from('client_list_view')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId);

    if (viewError) {
      console.error('Error fetching client_list_view:', viewError);
      return { success: false, error: 'Failed to fetch client data' };
    }

    if (!viewData || viewData.length === 0) {
      return {
        success: true,
        data: {
          plan: {
            slug: planSlug,
            isMultiCurrency
          },
          clients: []
        }
      };
    }

    // Map view data to client objects
    const mergedData = viewData.map((row: any) => {
      // Build contacts object from view fields
      const contacts = {
        id: row.client_id,
        first_name: row.contact_first_name,
        last_name: row.contact_last_name,
        full_name: row.contact_full_name,
        email: row.contact_email,
        phone: row.contact_phone,
        company_name: row.contact_company_name,
        linked_user: row.linked_user_id ? {
          id: row.linked_user_id,
          avatar_url: row.linked_user_avatar_url
        } : null
      };
      
      // Create client entry with data from view
      return {
        id: row.project_client_id,
        project_id: row.project_id,
        client_id: row.client_id,
        contact_id: row.client_id,
        organization_id: row.organization_id,
        unit: row.unit,
        notes: row.notes,
        is_primary: row.is_primary,
        status: row.status,
        contacts: contacts,
        role: row.role_id ? {
          id: row.role_id,
          name: row.role_name,
          is_default: row.role_is_default
        } : null,
        // Financial fields not used in LISTA tab - set to empty/zero for compatibility
        financialByCurrency: [],
        total_committed_amount: 0,
        total_paid_amount: 0,
        balance_due: 0,
        next_due: null,
      };
    });

    // Sort A-Z by client name
    mergedData.sort((a: any, b: any) => {
      const nameA = (a.contacts?.company_name || a.contacts?.full_name || 
                    `${a.contacts?.first_name || ''} ${a.contacts?.last_name || ''}`.trim()).toLowerCase();
      const nameB = (b.contacts?.company_name || b.contacts?.full_name || 
                    `${b.contacts?.first_name || ''} ${b.contacts?.last_name || ''}`.trim()).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      success: true,
      data: {
        plan: {
          slug: planSlug,
          isMultiCurrency
        },
        clients: mergedData
      }
    };

  } catch (error: any) {
    console.error('Error in getClientsSummary handler:', error);
    return { success: false, error: error.message || 'Failed to get clients summary' };
  }
}

export async function getClient(
  ctx: ProjectsContext,
  params: GetClientParams
): Promise<GetClientResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.clientId || !params.organizationId) {
      return { success: false, error: 'projectId, clientId, and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Query single project_client with contact information
    const { data: projectClient, error } = await supabase
      .from('project_clients')
      .select(`
        *,
        contacts:contacts!contact_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', params.clientId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project client:', error);
      return { success: false, error: 'Failed to fetch project client' };
    }

    if (!projectClient) {
      return { success: false, error: 'Project client not found' };
    }

    return { success: true, data: projectClient };

  } catch (error: any) {
    console.error('Error in getClient handler:', error);
    return { success: false, error: error.message || 'Failed to get client' };
  }
}

export async function createClient(
  ctx: ProjectsContext,
  params: CreateClientParams
): Promise<CreateClientResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    if (!params.clientData.contact_id) {
      return { success: false, error: 'contact_id is required in clientData' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // CRITICAL: Manually construct insert payload with only safe fields
    // FORCE project_id, organization_id, and created_by - never trust client input for these
    const { data: projectClient, error } = await supabase
      .from('project_clients')
      .insert({
        project_id: params.projectId,
        organization_id: params.organizationId,
        created_by: orgAccessResult.memberId,
        contact_id: params.clientData.contact_id,
        committed_amount: params.clientData.committed_amount || null,
        currency_id: params.clientData.currency_id || null,
        unit: params.clientData.unit || null,
        exchange_rate: params.clientData.exchange_rate || null,
        client_role_id: params.clientData.client_role_id || null,
        status: params.clientData.status || 'active',
        is_primary: params.clientData.is_primary || false,
        notes: params.clientData.notes || null
      })
      .select(`
        *,
        contacts:contacts!contact_id (
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
        currency:currencies!currency_id (
          id,
          code,
          symbol
        )
      `)
      .maybeSingle();

    if (error) {
      console.error('Error creating project client:', error);
      return { success: false, error: 'Failed to create project client' };
    }

    if (!projectClient) {
      return { success: false, error: 'Failed to create project client - no data returned' };
    }

    return { success: true, data: projectClient };

  } catch (error: any) {
    console.error('Error in createClient handler:', error);
    return { success: false, error: error.message || 'Failed to create client' };
  }
}

export async function updateClient(
  ctx: ProjectsContext,
  params: UpdateClientParams
): Promise<UpdateClientResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.clientId || !params.organizationId) {
      return { success: false, error: 'projectId, clientId, and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (params.clientData.hasOwnProperty('unit')) {
      updates.unit = params.clientData.unit || null;
    }
    if (params.clientData.hasOwnProperty('committed_amount')) {
      updates.committed_amount = params.clientData.committed_amount || null;
    }
    if (params.clientData.hasOwnProperty('currency_id')) {
      updates.currency_id = params.clientData.currency_id || null;
    }
    if (params.clientData.hasOwnProperty('exchange_rate')) {
      updates.exchange_rate = params.clientData.exchange_rate || null;
    }
    if (params.clientData.hasOwnProperty('client_role_id')) {
      updates.client_role_id = params.clientData.client_role_id || null;
    }
    if (params.clientData.hasOwnProperty('status')) {
      updates.status = params.clientData.status || 'active';
    }
    if (params.clientData.hasOwnProperty('is_primary')) {
      updates.is_primary = params.clientData.is_primary || false;
    }
    if (params.clientData.hasOwnProperty('notes')) {
      updates.notes = params.clientData.notes || null;
    }

    // Update project_client
    const { data: projectClient, error } = await supabase
      .from('project_clients')
      .update(updates)
      .eq('id', params.clientId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .select(`
        *,
        contacts:contacts!contact_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .maybeSingle();

    if (error) {
      console.error('Error updating project client:', error);
      return { success: false, error: 'Failed to update project client' };
    }

    if (!projectClient) {
      return { success: false, error: 'Project client not found' };
    }

    return { success: true, data: projectClient };

  } catch (error: any) {
    console.error('Error in updateClient handler:', error);
    return { success: false, error: error.message || 'Failed to update client' };
  }
}

export async function deleteClient(
  ctx: ProjectsContext,
  params: DeleteClientParams
): Promise<DeleteClientResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.clientId || !params.organizationId) {
      return { success: false, error: 'projectId, clientId, and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Verify project belongs to organization
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    // Delete the project_client relationship
    const { error } = await supabase
      .from('project_clients')
      .delete()
      .eq('id', params.clientId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId);

    if (error) {
      console.error('Error deleting project client:', error);
      return { success: false, error: 'Failed to delete project client' };
    }

    return { success: true, message: 'Client removed from project successfully' };

  } catch (error: any) {
    console.error('Error in deleteClient handler:', error);
    return { success: false, error: error.message || 'Failed to delete client' };
  }
}
