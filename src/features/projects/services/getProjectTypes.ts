import { supabase } from '@/lib/supabase';
import type { ProjectType } from '../types';

/**
 * Obtiene los tipos de proyecto disponibles para una organización.
 * 
 * Incluye tipos globales (organization_id = null) y tipos específicos de la organización.
 * Solo devuelve tipos que no han sido eliminados (is_deleted = false).
 * Los tipos se ordenan alfabéticamente por nombre (sistema y custom mezclados).
 * 
 * @param organizationId - ID de la organización
 * @returns Array de tipos de proyecto ordenados alfabéticamente, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getProjectTypes(organizationId: string): Promise<ProjectType[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_types')
    .select('*')
    .eq('is_deleted', false)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order('name');

  if (error) throw error;
  
  return data || [];
}
