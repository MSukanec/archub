import { supabase } from '@/lib/supabase';
import type { GeneralCost } from '../types';

/**
 * Fetches all general costs for an organization.
 * 
 * This service retrieves general costs with basic information. Extended data like
 * current values and units can be added in future iterations.
 * 
 * @param organizationId - The ID of the organization
 * @returns Array of general costs or empty array if none found
 * @throws {Error} If the primary query fails or Supabase client is not initialized
 */
export async function getGeneralCosts(organizationId: string): Promise<GeneralCost[]> {
  if (!organizationId) {
    return [];
  }

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('general_costs')
    .select(`
      id,
      organization_id,
      name,
      description,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(cost => ({
    ...cost,
    is_active: true,
    category: 'General',
    current_value: undefined,
    unit: undefined
  }));
}
