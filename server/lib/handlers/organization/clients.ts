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
    const planData = Array.isArray(plan) && plan.length > 0 ? plan[0] : (plan || null);
    const planSlug = (planData && typeof planData === 'object' && 'slug' in planData) ? planData.slug : 'FREE';
    const features = (planData && typeof planData === 'object' && 'features' in planData) ? planData.features : [];
    const isMultiCurrency = Array.isArray(features) && features.includes('multi-currency');

    // 🚀 PERFORMANCE BOOST: Use simplified client_list_view (direct table JOINs only)
    // This view includes ONLY data displayed in LISTA tab (no financial data)
    const { data: viewData, error: viewError } = await supabase
      .from('client_list_view')
      .select('*')
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
    const clientsData = viewData.map((row: any) => {
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

    // Sort A-Z by client name (ALWAYS alphabetically ordered)
    clientsData.sort((a: any, b: any) => {
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
        clients: clientsData
      }
    };

  } catch (error: any) {
    console.error('Error in getOrganizationClientsSummary handler:', error);
    return { success: false, error: error.message || 'Failed to get organization clients summary' };
  }
}
