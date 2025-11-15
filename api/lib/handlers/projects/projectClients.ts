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
    client_id: string;
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
        contacts:contacts!client_id (
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
    console.log('🔍 [getClientsSummary] START - params:', { projectId: params.projectId, organizationId: params.organizationId });

    if (!params.projectId || !params.organizationId) {
      console.log('❌ [getClientsSummary] Missing required params');
      return { success: false, error: 'projectId and organizationId are required' };
    }

    console.log('🔐 [getClientsSummary] Calling ensureAuth...');
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      console.log('❌ [getClientsSummary] Auth failed:', authResult.error);
      return authResult;
    }
    console.log('✅ [getClientsSummary] Auth successful, user:', authResult.user.id);

    console.log('🔐 [getClientsSummary] Calling ensureOrganizationAccess...');
    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      console.log('❌ [getClientsSummary] Org access failed:', orgAccessResult.error);
      return orgAccessResult;
    }
    console.log('✅ [getClientsSummary] Org access successful, memberId:', orgAccessResult.memberId);

    console.log('🔍 [getClientsSummary] Calling getProjectById...');
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      console.log('❌ [getClientsSummary] Project fetch failed:', projectResult.error);
      return projectResult;
    }
    console.log('✅ [getClientsSummary] Project fetched successfully, org_id:', projectResult.data.organization_id);

    if (projectResult.data.organization_id !== params.organizationId) {
      console.log('❌ [getClientsSummary] Project org_id mismatch');
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    console.log('🔍 [getClientsSummary] Fetching organization data...');
    const { data: orgDataArray, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan_id')
      .eq('id', params.organizationId)
      .limit(1);

    if (orgError) {
      console.error('❌ [getClientsSummary] Error fetching organization:', orgError);
      return { success: false, error: 'Failed to fetch organization' };
    }
    console.log('✅ [getClientsSummary] Organization data fetched, count:', orgDataArray?.length || 0);

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

    // Use unified view for all plans
    const viewName = 'client_financial_overview';

    // Query the financial overview view
    const { data: financialData, error: viewError } = await supabase
      .from(viewName)
      .select('*')
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId);

    if (viewError) {
      console.error('Error fetching client financial overview:', viewError);
      return { success: false, error: 'Failed to fetch client financial data' };
    }

    if (!financialData || financialData.length === 0) {
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

    // Get unique project_client_ids
    const projectClientIds = Array.from(new Set(financialData.map((item: any) => item.project_client_id)));

    // Get unique currency_ids to fetch currency data
    const currencyIds = Array.from(new Set(financialData.map((item: any) => item.currency_id).filter(Boolean)));

    // Fetch contact data for avatars and client roles
    const { data: enrichedData, error: enrichError } = await supabase
      .from('project_clients')
      .select(`
        id,
        unit,
        client_role_id,
        contacts:contacts!client_id (
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
        client_role:client_roles!client_role_id (
          id,
          name,
          is_default
        )
      `)
      .in('id', projectClientIds);

    if (enrichError) {
      console.error('Error enriching client data:', enrichError);
      return { success: false, error: 'Failed to enrich client data' };
    }

    // Fetch currency data only if there are currency_ids
    let currencyData: any[] = [];
    if (currencyIds.length > 0) {
      const { data, error: currencyError } = await supabase
        .from('currencies')
        .select('id, code, symbol')
        .in('id', currencyIds);

      if (currencyError) {
        console.error('Error fetching currency data:', currencyError);
        return { success: false, error: 'Failed to fetch currency data' };
      }
      currencyData = data || [];
    }

    // Pre-index currencies by ID for O(1) lookup
    const currencyById = new Map(currencyData?.map((c: any) => [c.id, c]) || []);

    // Pre-index enriched data by project_client_id for O(1) lookup
    const enrichedById = new Map(enrichedData?.map((e: any) => [e.id, e]) || []);

    // Group financial data by project_client_id
    const groupedByClient = financialData.reduce((acc: any, row: any) => {
      const clientId = row.project_client_id;
      
      if (!acc[clientId]) {
        const enriched = enrichedById.get(clientId);
        
        acc[clientId] = {
          id: row.project_client_id,
          project_id: row.project_id,
          client_id: row.client_id,
          organization_id: row.organization_id,
          unit: enriched?.unit || null,
          contacts: enriched?.contacts || null,
          role: row.role_id ? {
            id: row.role_id,
            name: row.role_name,
            is_default: row.role_is_default
          } : null,
          financialByCurrency: []
        };
      }

      // Get currency info using pre-indexed Map
      const currency = row.currency_id ? currencyById.get(row.currency_id) : null;

      // Add this currency's financial data
      acc[clientId].financialByCurrency.push({
        currency: currency || null,
        total_committed_amount: parseFloat(row.total_committed_amount || 0),
        total_paid_amount: parseFloat(row.total_paid_amount || 0),
        balance_due: parseFloat(row.balance_due || 0),
        next_due_date: row.next_due_date || null,
        next_due_amount: row.next_due_amount ? parseFloat(row.next_due_amount) : null,
        last_payment_date: row.last_payment_date || null,
        total_schedule_items: row.total_schedule_items || 0,
        schedule_paid: row.schedule_paid || 0,
        schedule_overdue: row.schedule_overdue || 0,
        payments_missing_rate: row.payments_missing_rate || 0,
      });

      return acc;
    }, {});

    // Convert to array and add derived sorting fields
    const mergedData = Object.values(groupedByClient).map((client: any) => {
      // Calculate totals across all currencies for sorting
      const total_committed_amount = client.financialByCurrency.reduce(
        (sum: number, f: any) => sum + f.total_committed_amount, 0
      );
      const total_paid_amount = client.financialByCurrency.reduce(
        (sum: number, f: any) => sum + f.total_paid_amount, 0
      );
      const balance_due = client.financialByCurrency.reduce(
        (sum: number, f: any) => sum + f.balance_due, 0
      );
      
      // Find earliest next due date for sorting
      const nextDueDates = client.financialByCurrency
        .filter((f: any) => f.next_due_date)
        .map((f: any) => new Date(f.next_due_date).getTime());
      const next_due = nextDueDates.length > 0 ? Math.min(...nextDueDates) : null;
      
      return {
        ...client,
        total_committed_amount,
        total_paid_amount,
        balance_due,
        next_due,
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
        contacts:contacts!client_id (
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

    if (!params.clientData.client_id) {
      return { success: false, error: 'client_id is required in clientData' };
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
        client_id: params.clientData.client_id,
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
        contacts:contacts!client_id (
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
        contacts:contacts!client_id (
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
