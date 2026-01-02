/**
 * Update Material Service
 * 
 * Actualiza un material existente en la tabla materials.
 */

import { supabase } from '@/lib/supabase';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';
import type { UpdateMaterialData, Material } from '../types';

interface UpdateMaterialOptions {
  organization_id?: string;
  user_id?: string;
}

export async function updateMaterial(
  id: string, 
  data: UpdateMaterialData,
  options?: UpdateMaterialOptions
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

  const organizationId = options?.organization_id || data.organization_id;
  if (organizationId && options?.user_id) {
    logActivity({
      organization_id: organizationId,
      user_id: options.user_id,
      action: ACTIVITY_ACTIONS.UPDATE_MATERIAL,
      target_table: TARGET_TABLES.MATERIALS,
      target_id: result.id,
      metadata: { name: result.name }
    });
  }

  return result;
}
