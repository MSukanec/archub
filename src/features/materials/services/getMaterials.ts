/**
 * Get Materials Service
 * 
 * Obtiene todos los materiales de la vista materials_view filtrados por organización.
 * Esta vista incluye información pre-computada de categorías, unidades y precios.
 */
import { supabase } from '@/lib/supabase';
import type { Material } from '../types';
export async function getMaterials(organizationId: string): Promise<Material[]> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }
  const { data, error } = await supabase
    .from('materials_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
  return data || [];
}
