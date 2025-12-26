import { supabase } from '@/lib/supabase';
export interface GeneralCostsByCategory {
  organization_id: string;
  payment_month: string;
  category_id: string;
  category_name: string;
  total_amount: number;
}
export async function getGeneralCostsByCategory(organizationId: string): Promise<GeneralCostsByCategory[]> {
  if (!organizationId) {
    return [];
  }
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase
    .from('general_costs_by_category_view')
    .select('*')
    .eq('organization_id', organizationId);
  if (error) {
    throw error;
  }
  return data || [];
}
