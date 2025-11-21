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
    unit?: string | null;
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
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .eq('is_deleted', false)
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
      .eq('is_deleted', false)
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

    // 🚀 DIRECT TABLE QUERIES: Bypassing problematic view with explicit LEFT JOINs
    // Query project_clients with all related data
    const { data: clients, error: clientsError } = await supabase
      .from('project_clients')
      .select(`
        *,
        contacts!contact_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          users!linked_user_id (
            id,
            avatar_url
          )
        ),
        client_roles!client_role_id (
          id,
          name,
          is_default
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .eq('is_deleted', false);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return { success: false, error: 'Failed to fetch clients' };
    }

    if (!clients || clients.length === 0) {
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

    // Fetch commitments for these clients
    const clientIds = clients.map((c: any) => c.id);
    const { data: commitments } = await supabase
      .from('client_commitments')
      .select(`
        *,
        currencies!currency_id (
          id,
          code,
          symbol
        )
      `)
      .in('client_id', clientIds)
      .eq('project_id', params.projectId);

    // Fetch payments for these clients
    const { data: payments } = await supabase
      .from('client_payments')
      .select(`
        *,
        currencies!currency_id (
          id,
          code,
          symbol
        )
      `)
      .in('client_id', clientIds)
      .eq('project_id', params.projectId)
      .eq('status', 'confirmed');

    // Build financialByCurrency for each client
    const mergedData = clients.map((client: any) => {
      const clientCommitments = commitments?.filter((cc: any) => cc.client_id === client.id) || [];
      const clientPayments = payments?.filter((cp: any) => cp.client_id === client.id) || [];

      // Group by currency
      const currencyMap = new Map<string, any>();

      // Process commitments
      clientCommitments.forEach((cc: any) => {
        if (!cc.currency_id) return;
        
        const key = cc.currency_id;
        if (!currencyMap.has(key)) {
          currencyMap.set(key, {
            currency: cc.currencies,
            total_committed_amount: 0,
            total_paid_amount: 0,
            balance_due: 0,
            next_due_date: null,
            next_due_amount: null,
            last_payment_date: null,
            total_schedule_items: 0,
            schedule_paid: 0,
            schedule_overdue: 0,
            payments_missing_rate: 0,
          });
        }
        
        const entry = currencyMap.get(key);
        entry.total_committed_amount += parseFloat(cc.amount || 0);
      });

      // Process payments - CRITICAL: Always create currency entry even if no commitments exist
      // Do NOT skip payments with null currency joins - default the metadata instead
      clientPayments.forEach((cp: any) => {
        if (!cp.currency_id) return;
        
        const key = cp.currency_id;
        
        // Default currency metadata if join failed (RLS/null scenario)
        const currencyData = cp.currencies || {
          id: cp.currency_id,
          code: 'UNKNOWN',
          symbol: '?'
        };
        
        if (!currencyMap.has(key)) {
          // Create entry for payment-only currencies (no commitments in this currency)
          currencyMap.set(key, {
            currency: currencyData,
            total_committed_amount: 0,
            total_paid_amount: 0,
            balance_due: 0,
            next_due_date: null,
            next_due_amount: null,
            last_payment_date: null,
            total_schedule_items: 0,
            schedule_paid: 0,
            schedule_overdue: 0,
            payments_missing_rate: 0,
          });
        }
        
        const entry = currencyMap.get(key)!;
        entry.total_paid_amount += parseFloat(cp.amount || 0);
        
        if (!entry.last_payment_date || new Date(cp.payment_date) > new Date(entry.last_payment_date)) {
          entry.last_payment_date = cp.payment_date;
        }
        
        if (!cp.exchange_rate || cp.exchange_rate === 0) {
          entry.payments_missing_rate += 1;
        }
      });

      // Calculate balance_due for each currency
      currencyMap.forEach((entry) => {
        entry.balance_due = entry.total_committed_amount - entry.total_paid_amount;
      });

      const financialByCurrency = Array.from(currencyMap.values());

      // Calculate totals across all currencies
      const total_committed_amount = financialByCurrency.reduce(
        (sum, f) => sum + f.total_committed_amount, 0
      );
      const total_paid_amount = financialByCurrency.reduce(
        (sum, f) => sum + f.total_paid_amount, 0
      );
      const balance_due = financialByCurrency.reduce(
        (sum, f) => sum + f.balance_due, 0
      );

      return {
        id: client.id,
        project_id: client.project_id,
        client_id: client.contact_id,
        contact_id: client.contact_id,
        organization_id: client.organization_id,
        unit: client.unit,
        notes: client.notes,
        is_primary: client.is_primary,
        status: client.status,
        contacts: client.contacts,
        role: client.client_roles,
        financialByCurrency,
        total_committed_amount,
        total_paid_amount,
        balance_due,
        next_due: null,
      };
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
          full_name,
          email,
          phone,
          company_name,
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        )
      `)
      .eq('id', params.clientId)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .eq('is_deleted', false)
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
        unit: params.clientData.unit || null,
        client_role_id: params.clientData.client_role_id || null,
        status: params.clientData.status || 'active',
        is_primary: params.clientData.is_primary || false,
        notes: params.clientData.notes || null,
        is_deleted: false
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
        client_roles!client_role_id (
          id,
          name,
          is_default
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

    // Verify the client exists and is not deleted
    const { data: existingClient, error: fetchError } = await supabase
      .from('project_clients')
      .select('id, organization_id, is_deleted')
      .eq('id', params.clientId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching project client:', fetchError);
      return { success: false, error: 'Failed to fetch project client' };
    }

    if (!existingClient) {
      return { success: false, error: 'Project client not found or has been deleted' };
    }

    if (existingClient.organization_id !== params.organizationId) {
      return { success: false, error: 'Cannot update clients from other organizations' };
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (params.clientData.hasOwnProperty('unit')) {
      updates.unit = params.clientData.unit || null;
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

    // Verify the client exists and is not already deleted
    const { data: existingClient, error: fetchError } = await supabase
      .from('project_clients')
      .select('id, organization_id, is_deleted')
      .eq('id', params.clientId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching project client:', fetchError);
      return { success: false, error: 'Failed to fetch project client' };
    }

    if (!existingClient) {
      return { success: false, error: 'Project client not found or already deleted' };
    }

    if (existingClient.organization_id !== params.organizationId) {
      return { success: false, error: 'Cannot delete clients from other organizations' };
    }

    // Soft delete the project_client relationship
    const { error } = await supabase
      .from('project_clients')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
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
