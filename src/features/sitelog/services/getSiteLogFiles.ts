import { supabase } from '@/lib/supabase';

/**
 * Obtiene los archivos multimedia de una bitácora específica.
 * 
 * CRÍTICO: Filtra por site_log_id Y organization_id para prevenir data leaks.
 * 
 * @param siteLogId - ID de la bitácora
 * @param organizationId - ID de la organización
 * @returns Array de archivos multimedia, o array vacío
 * @throws {Error} Si falla la query de Supabase
 */
export async function getSiteLogFiles(siteLogId: string, organizationId: string) {
  if (!supabase || !siteLogId || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_media')
    .select('*')
    .eq('site_log_id', siteLogId)
    .eq('organization_id', organizationId);

  if (error) throw error;
  
  return data || [];
}
