import { supabase } from '@/lib/supabase';

export interface SiteLogType {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  organization_id: string | null;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  created_by: string | null;
}

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
export async function getSiteLogTypes(organizationId: string): Promise<SiteLogType[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('site_log_types')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_deleted', false)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  
  return data || [];
}
