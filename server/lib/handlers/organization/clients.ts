// server/lib/handlers/organization/clients.ts
import type { ProjectsContext } from '../projects/shared.js';
import { ensureAuth, ensureOrganizationAccess } from '../projects/shared.js';

export interface GetOrganizationClientsSummaryParams {
  organizationId: string;
}

export type GetOrganizationClientsSummaryResult =
  | { success: true; data: any }
  | { success: false; error: string };

export async function getOrganizationClientsSummary(
  ctx: ProjectsContext,
  params: GetOrganizationClientsSummaryParams
): Promise<GetOrganizationClientsSummaryResult> {
  try {
    const { supabase } = ctx;

    if (!params.organizationId) {
      return { success: false, error: 'organizationId is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    // Get organization's subscription plan to determine multi-currency capability
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        organization_subscriptions (
          plan:plans!organization_subscriptions_plan_id_fkey (
            slug,
            name,
            features
          )
        )
      `)
      .eq('id', params.organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return { success: false, error: 'Failed to fetch organization' };
    }

    const subscription = Array.isArray(orgData?.organization_subscriptions) && orgData.organization_subscriptions.length > 0 
      ? orgData.organization_subscriptions[0] 
      : null;
    
    // Extract plan from the subscription (Supabase returns it as an array in the relation)
    const plan = subscription?.plan;
    const planData = Array.isArray(plan) && plan.length > 0 ? plan[0] : plan;
    const planSlug = planData?.slug || 'FREE';
    const features = planData?.features || [];
    const isMultiCurrency = Array.isArray(features) && features.includes('multi-currency');

    // Use unified view for all plans (same as project handler)
    const viewName = 'client_financial_overview';

    // Query the financial overview view for all clients in the organization
    const { data: financialData, error: viewError } = await supabase
      .from(viewName)
      .select('*')
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

    // Fetch additional project_client data (unit, notes, status, is_primary, avatar, project info)
    const { data: enrichedData, error: enrichError } = await supabase
      .from('project_clients')
      .select(`
        id,
        unit,
        notes,
        is_primary,
        status,
        contacts!project_clients_client_id_fkey (
          linked_user:users!linked_user_id (
            id,
            avatar_url
          )
        ),
        projects (
          id,
          name,
          color
        )
      `)
      .in('id', projectClientIds);

    if (enrichError) {
      console.error('Error enriching client data:', enrichError);
      return { success: false, error: 'Failed to enrich client data' };
    }

    // Pre-index enriched data by project_client_id for O(1) lookup
    const enrichedById = new Map(enrichedData?.map((e: any) => [e.id, e]) || []);

    // Group financial data by project_client_id
    const groupedByClient = financialData.reduce((acc: any, row: any) => {
      const clientId = row.project_client_id;
      
      if (!acc[clientId]) {
        const enriched = enrichedById.get(clientId);
        
        // Construct contacts object using data from view (email, phone, name) + enriched avatar
        const contacts = {
          id: row.client_id,
          first_name: row.client_first_name,
          last_name: row.client_last_name,
          full_name: row.client_name,
          email: row.client_email,
          phone: row.client_phone,
          company_name: row.client_company_name,
          linked_user: enriched?.contacts?.linked_user || null
        };
        
        acc[clientId] = {
          id: row.project_client_id,
          project_id: row.project_id,
          client_id: row.client_id,
          organization_id: row.organization_id,
          unit: enriched?.unit || null,
          notes: enriched?.notes || null,
          is_primary: enriched?.is_primary || false,
          status: enriched?.status || 'active',
          contacts: contacts,
          role: row.role_id ? {
            id: row.role_id,
            name: row.role_name,
            is_default: row.role_is_default
          } : null,
          projects: enriched?.projects || null,
          financialByCurrency: [],
          total_committed_amount: parseFloat(row.total_committed_amount || 0),
          total_paid_amount: parseFloat(row.total_paid_amount || 0),
          balance_due: parseFloat(row.balance_due || 0),
          next_due: row.next_due || null
        };
      }

      return acc;
    }, {});

    // Convert to array
    const clientsWithFinancials = Object.values(groupedByClient);

    // Sort A-Z by client name (ALWAYS alphabetically ordered)
    clientsWithFinancials.sort((a: any, b: any) => {
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
        clients: clientsWithFinancials
      }
    };

  } catch (error: any) {
    console.error('Error in getOrganizationClientsSummary handler:', error);
    return { success: false, error: error.message || 'Failed to get organization clients summary' };
  }
}
