/**
 * Create Material Price Service
 * 
 * Crea un nuevo precio de material para una organización.
 */
import { supabase } from '@/lib/supabase';
import type { InsertOrganizationMaterialPrice } from '../../../../../shared/schema';
import type { MaterialPrice } from './getMaterialPrice';
export async function createMaterialPrice(
  data: InsertOrganizationMaterialPrice
): Promise<MaterialPrice> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  const { data: result, error } = await supabase
    .from('organization_material_prices')
    .insert([data])
    .select()
    .single();
  if (error) {
    console.error('Error creating material price:', error);
    throw error;
  }
  return result;
}
