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

    // 🚀 PERFORMANCE BOOST: Use optimized client_list_view (eliminates ~8 JOINs)
    // This view pre-computes ALL data: project_clients, contacts, users, projects, currencies
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

    // Group by project_client_id and aggregate financials by currency (prevent duplicates)
    const groupedByClient = viewData.reduce((acc: any, row: any) => {
      const clientId = row.project_client_id;
      
      if (!acc[clientId]) {
        // Build contacts object from pre-computed view fields
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
        
        // Build projects object from pre-computed view fields
        const projects = row.project_name ? {
          id: row.project_id,
          name: row.project_name,
          color: row.project_color
        } : null;
        
        // Create client entry with ALL data from view (no additional queries needed!)
        acc[clientId] = {
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
          projects: projects,
          currencyMap: new Map() // Use Map to prevent currency duplicates
        };
      }

      // Use Map keyed by currency_id to aggregate per currency (sum if duplicates exist)
      const currencyKey = row.currency_id || 'no-currency';
      
      if (!acc[clientId].currencyMap.has(currencyKey)) {
        // First occurrence - create new entry (parse ALL numeric fields from Supabase strings)
        const currency = row.currency_id ? {
          id: row.currency_id,
          code: row.currency_code,
          symbol: row.currency_symbol
        } : null;

        acc[clientId].currencyMap.set(currencyKey, {
          currency: currency,
          total_committed_amount: parseFloat(row.total_committed_amount || 0),
          total_paid_amount: parseFloat(row.total_paid_amount || 0),
          balance_due: parseFloat(row.balance_due || 0),
          next_due_date: row.next_due_date || null,
          next_due_amount: row.next_due_amount ? parseFloat(row.next_due_amount) : null,
          last_payment_date: row.last_payment_date || null,
          total_schedule_items: Number(row.total_schedule_items || 0),
          schedule_paid: Number(row.schedule_paid || 0),
          schedule_overdue: Number(row.schedule_overdue || 0),
          payments_missing_rate: Number(row.payments_missing_rate || 0),
        });
      } else {
        // Duplicate currency - accumulate totals (parse ALL incoming values to prevent string concatenation)
        const existing = acc[clientId].currencyMap.get(currencyKey);
        
        existing.total_committed_amount += parseFloat(row.total_committed_amount || 0);
        existing.total_paid_amount += parseFloat(row.total_paid_amount || 0);
        existing.balance_due += parseFloat(row.balance_due || 0);
        existing.total_schedule_items += Number(row.total_schedule_items || 0);
        existing.schedule_paid += Number(row.schedule_paid || 0);
        existing.schedule_overdue += Number(row.schedule_overdue || 0);
        existing.payments_missing_rate += Number(row.payments_missing_rate || 0);
        
        // Keep earliest next_due_date
        if (row.next_due_date) {
          if (!existing.next_due_date || new Date(row.next_due_date) < new Date(existing.next_due_date)) {
            existing.next_due_date = row.next_due_date;
            existing.next_due_amount = row.next_due_amount ? parseFloat(row.next_due_amount) : null;
          }
        }
        
        // Keep most recent last_payment_date
        if (row.last_payment_date) {
          if (!existing.last_payment_date || new Date(row.last_payment_date) > new Date(existing.last_payment_date)) {
            existing.last_payment_date = row.last_payment_date;
          }
        }
      }

      return acc;
    }, {});

    // Convert Maps to arrays and calculate cross-currency totals
    const clientsWithFinancials = Object.values(groupedByClient).map((client: any) => {
      // Convert currency Map to array
      const financialByCurrency = Array.from(client.currencyMap.values());
      delete client.currencyMap; // Remove temp Map
      
      // Calculate totals across all unique currencies
      const total_committed_amount = financialByCurrency.reduce(
        (sum: number, f: any) => sum + (f.total_committed_amount || 0), 0
      );
      const total_paid_amount = financialByCurrency.reduce(
        (sum: number, f: any) => sum + (f.total_paid_amount || 0), 0
      );
      const balance_due = financialByCurrency.reduce(
        (sum: number, f: any) => sum + (f.balance_due || 0), 0
      );
      
      // Find earliest next due date (guard against empty array)
      const nextDueDates = financialByCurrency
        .filter((f: any) => f.next_due_date)
        .map((f: any) => new Date(f.next_due_date).getTime())
        .filter((ts: number) => !isNaN(ts)); // Filter out NaN
      
      const next_due = nextDueDates.length > 0 ? Math.min(...nextDueDates) : null;
      
      return {
        ...client,
        financialByCurrency,
        total_committed_amount,
        total_paid_amount,
        balance_due,
        next_due
      };
    });

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
