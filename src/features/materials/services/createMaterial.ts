/**
 * Create Material Service
 * 
 * Crea un nuevo material en la tabla materials.
 * Los materiales creados por organizaciones tienen is_system = false.
 */

import { supabase } from '@/lib/supabase';
import type { NewMaterialData, Material } from '../types';

export async function createMaterial(data: NewMaterialData): Promise<Material> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const materialData = {
    ...data,
    is_system: false, // Always false for organization-created materials
  };

  const { data: result, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select(`
      *,
      unit:units(name),
      category:material_categories!materials_category_id_fkey(name)
    `)
    .single();

  if (error) {
    console.error('Error creating material:', error);
    throw error;
  }

  return result;
}
