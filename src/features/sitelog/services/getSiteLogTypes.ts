import { supabase } from '@/lib/supabase';

/**
 * Obtiene los tipos de bitácora disponibles para una organización.
 * 
 * Incluye tipos globales (organization_id = null) y tipos específicos de la organización.
 * Los tipos se ordenan primero por is_default (descendente) y luego por nombre.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de tipos de bitácora ordenados, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getSiteLogTypes(organizationId: string) {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('site_log_types')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  
  return data || [];
}
