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
      .eq('is_deleted', false)
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
      .eq('organization_id', params.organizationId);

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
      .eq('organization_id', params.organizationId)
      .eq('status', 'confirmed');

    // Build financialByCurrency for each client
    const clientsData = clients.map((client: any) => {
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
