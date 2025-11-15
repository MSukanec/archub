import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureAuth, ensureOrganizationAccess, getProjectById, type ProjectsContext } from "./shared";

export interface GetClientPaymentsParams {
  projectId: string;
  organizationId: string;
}

export interface GetClientPaymentsResult {
  success: boolean;
  data?: {
    payments: any[];
    total: number;
  };
  error?: string;
}

export async function getClientPayments(
  ctx: ProjectsContext,
  params: GetClientPaymentsParams
): Promise<GetClientPaymentsResult> {
  try {
    const { supabase } = ctx;
    console.log('🔍 [getClientPayments] START - params:', { projectId: params.projectId, organizationId: params.organizationId });

    if (!params.projectId || !params.organizationId) {
      console.log('❌ [getClientPayments] Missing required params');
      return { success: false, error: 'projectId and organizationId are required' };
    }

    console.log('🔐 [getClientPayments] Calling ensureAuth...');
    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      console.log('❌ [getClientPayments] Auth failed:', authResult.error);
      return authResult;
    }
    console.log('✅ [getClientPayments] Auth successful, user:', authResult.user.id);

    console.log('🔐 [getClientPayments] Calling ensureOrganizationAccess...');
    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      console.log('❌ [getClientPayments] Org access failed:', orgAccessResult.error);
      return orgAccessResult;
    }
    console.log('✅ [getClientPayments] Org access successful');

    console.log('🔍 [getClientPayments] Calling getProjectById...');
    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      console.log('❌ [getClientPayments] Project fetch failed:', projectResult.error);
      return projectResult;
    }
    console.log('✅ [getClientPayments] Project fetched successfully');

    if (projectResult.data.organization_id !== params.organizationId) {
      console.log('❌ [getClientPayments] Project org_id mismatch');
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    console.log('🔍 [getClientPayments] Fetching client payments...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('client_payments')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('❌ [getClientPayments] Error fetching payments:', paymentsError);
      return { success: false, error: 'Failed to fetch payments' };
    }

    console.log('✅ [getClientPayments] Payments fetched successfully, count:', paymentsData?.length || 0);

    return {
      success: true,
      data: {
        payments: paymentsData || [],
        total: paymentsData?.length || 0
      }
    };
  } catch (error: any) {
    console.error('❌ [getClientPayments] Unexpected error:', error);
    return { success: false, error: error.message || 'Failed to get client payments' };
  }
}
