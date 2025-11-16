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

    // Fetch all project clients for the organization with financial summaries
    const { data: projectClients, error } = await supabase
      .from('project_clients')
      .select(`
        id,
        project_id,
        contact_id,
        unit,
        role_id,
        notes,
        total_committed,
        total_paid,
        balance,
        next_due,
        created_at,
        updated_at,
        contacts (
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
        role:client_roles (
          id,
          name,
          is_default
        ),
        projects (
          id,
          name,
          color
        )
      `)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project clients:', error);
      return { success: false, error: 'Failed to fetch clients' };
    }

    // Get financial details by currency for each client if multi-currency is enabled
    let clientsWithFinancials = projectClients || [];

    if (isMultiCurrency && clientsWithFinancials.length > 0) {
      const clientIds = clientsWithFinancials.map(c => c.id);

      const { data: financialsByCurrency, error: financialsError } = await supabase
        .from('project_client_financials_by_currency')
        .select('*')
        .in('client_id', clientIds);

      if (financialsError) {
        console.error('Error fetching client financials by currency:', financialsError);
      } else {
        // Group financials by client_id
        const financialsByClientId = new Map<string, any[]>();
        (financialsByCurrency || []).forEach(f => {
          if (!financialsByClientId.has(f.client_id)) {
            financialsByClientId.set(f.client_id, []);
          }
          financialsByClientId.get(f.client_id)!.push(f);
        });

        // Add financials to each client
        clientsWithFinancials = clientsWithFinancials.map(client => ({
          ...client,
          financialByCurrency: financialsByClientId.get(client.id) || [],
          // For sorting purposes, use aggregated totals
          total_committed_amount: client.total_committed || 0,
          total_paid_amount: client.total_paid || 0,
          balance_due: client.balance || 0,
          next_due: client.next_due || null
        }));
      }
    } else {
      // Single currency mode - use aggregated values
      clientsWithFinancials = clientsWithFinancials.map(client => ({
        ...client,
        financialByCurrency: [],
        total_committed_amount: client.total_committed || 0,
        total_paid_amount: client.total_paid || 0,
        balance_due: client.balance || 0,
        next_due: client.next_due || null
      }));
    }

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
