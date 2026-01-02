/**
 * Create Material Service
 * 
 * Crea un nuevo material en la tabla materials.
 * Los materiales creados por organizaciones tienen is_system = false.
 */

import { supabase } from '@/lib/supabase';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';
import type { NewMaterialData, Material } from '../types';

interface CreateMaterialOptions {
  data: NewMaterialData;
  user_id?: string;
}

export async function createMaterial(options: NewMaterialData | CreateMaterialOptions): Promise<Material> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const isOptionsObject = 'data' in options;
  const data = isOptionsObject ? options.data : options;
  const user_id = isOptionsObject ? options.user_id : undefined;

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

  if (data.organization_id && user_id) {
    logActivity({
      organization_id: data.organization_id,
      user_id,
      action: ACTIVITY_ACTIONS.ADD_MATERIAL,
      target_table: TARGET_TABLES.MATERIALS,
      target_id: result.id,
      metadata: { name: result.name }
    });
  }

  return result;
}
