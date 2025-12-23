import { supabase } from '@/lib/supabase';
import type { ProjectModality } from '../types';

/**
 * Obtiene las modalidades de proyecto disponibles para una organización.
 * 
 * Incluye modalidades globales (organization_id = null) y modalidades específicas de la organización.
 * Solo devuelve modalidades que no han sido eliminadas (is_deleted = false).
 * Las modalidades se ordenan alfabéticamente por nombre (sistema y custom mezclados).
 * 
 * @param organizationId - ID de la organización
 * @returns Array de modalidades de proyecto ordenadas alfabéticamente, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getProjectModalities(organizationId: string): Promise<ProjectModality[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_modalities')
    .select('*')
    .eq('is_deleted', false)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order('name');

  if (error) throw error;
  
  return data || [];
}
