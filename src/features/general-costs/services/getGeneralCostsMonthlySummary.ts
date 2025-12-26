import { supabase } from '@/lib/supabase';
export interface GeneralCostsMonthlySummary {
  organization_id: string;
  payment_month: string;
  total_amount: number;
  payments_count: number;
}
export async function getGeneralCostsMonthlySummary(organizationId: string): Promise<GeneralCostsMonthlySummary[]> {
  if (!organizationId) {
    return [];
  }
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase
    .from('general_costs_monthly_summary_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('payment_month', { ascending: false });
  if (error) {
    throw error;
  }
  return data || [];
}
