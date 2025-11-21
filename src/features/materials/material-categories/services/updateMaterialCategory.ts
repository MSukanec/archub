/**
 * Update Material Category Service
 * 
 * Actualiza una categoría de material existente.
 */

import { supabase } from '@/lib/supabase';
import type { MaterialCategory, NewMaterialCategoryData } from '../../types';

export async function updateMaterialCategory(
  id: string,
  data: Partial<NewMaterialCategoryData>
): Promise<MaterialCategory> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!id) {
    throw new Error('Category ID is required');
  }

  const { data: result, error } = await supabase
    .from('material_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating material category:', error);
    throw error;
  }

  return result;
}
