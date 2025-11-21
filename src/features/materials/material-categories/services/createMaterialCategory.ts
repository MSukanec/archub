/**
 * Create Material Category Service
 * 
 * Crea una nueva categoría de material.
 */

import { supabase } from '@/lib/supabase';
import type { MaterialCategory, NewMaterialCategoryData } from '../../types';

export async function createMaterialCategory(
  data: NewMaterialCategoryData
): Promise<MaterialCategory> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: result, error } = await supabase
    .from('material_categories')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating material category:', error);
    throw error;
  }

  return result;
}
