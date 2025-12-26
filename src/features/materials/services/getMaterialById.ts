/**
 * Get Material By ID Service
 * 
 * Obtiene un material específico por su ID desde materials_view filtrado por organización.
 */
import { supabase } from '@/lib/supabase';
import type { Material } from '../types';
export async function getMaterialById(materialId: string, organizationId: string): Promise<Material> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!materialId) {
    throw new Error('Material ID is required');
  }
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }
  const { data, error } = await supabase
    .from('materials_view')
    .select('*')
    .eq('id', materialId)
    .eq('organization_id', organizationId)
    .single();
  if (error) {
    console.error('Error fetching material:', error);
    throw error;
  }
  return data;
}
