/**
 * Update Material Service
 * 
 * Actualiza un material existente en la tabla materials.
 */
import { supabase } from '@/lib/supabase';
import type { UpdateMaterialData, Material } from '../types';
export async function updateMaterial(
  id: string, 
  data: UpdateMaterialData
): Promise<Material> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!id) {
    throw new Error('Material ID is required');
  }
  const { data: result, error } = await supabase
    .from('materials')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      unit:units(name),
      category:material_categories!materials_category_id_fkey(name)
    `)
    .single();
  if (error) {
    console.error('Error updating material:', error);
    throw error;
  }
  return result;
}
