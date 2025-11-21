/**
 * Update Material Price Service
 * 
 * Actualiza el precio de un material existente.
 */

import { supabase } from '@/lib/supabase';
import type { InsertOrganizationMaterialPrice } from '../../../../../shared/schema';
import type { MaterialPrice } from './getMaterialPrice';

export async function updateMaterialPrice(
  id: string,
  data: Partial<InsertOrganizationMaterialPrice>
): Promise<MaterialPrice> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!id) {
    throw new Error('Material price ID is required');
  }

  const { data: result, error } = await supabase
    .from('organization_material_prices')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating material price:', error);
    throw error;
  }

  return result;
}
