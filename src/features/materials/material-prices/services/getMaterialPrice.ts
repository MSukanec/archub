/**
 * Get Material Price Service
 * 
 * Obtiene el precio de un material específico para una organización.
 */
import { supabase } from '@/lib/supabase';
export interface MaterialPrice {
  id: string;
  material_id: string;
  organization_id: string;
  unit_price: number;
  currency_id: string;
  created_at: string;
  updated_at: string;
  currency?: {
    id: string;
    symbol: string;
    name: string;
  };
}
export async function getMaterialPrice(
  materialId: string,
  organizationId: string
): Promise<MaterialPrice | null> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  const { data, error } = await supabase
    .from('organization_material_prices')
    .select(`
      *,
      currency:currencies(*)
    `)
    .eq('material_id', materialId)
    .eq('organization_id', organizationId)
    .single();
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is ok
    console.error('Error fetching material price:', error);
    throw error;
  }
  return data;
}
