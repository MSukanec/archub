import { supabase } from '@/lib/supabase';
import type { ProjectLite } from '../types';
/**
 * Obtiene una lista ligera de proyectos (solo campos esenciales).
 * 
 * Esta versión optimizada solo trae los campos necesarios para
 * selectores y listas simples, mejorando el rendimiento.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de proyectos en formato lite, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getProjectsLite(organizationId: string): Promise<ProjectLite[]> {
  if (!supabase || !organizationId) {
    return [];
  }
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, color, status, updated_at')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching lite projects:', error);
    throw error;
  }
  
  return data || [];
}
