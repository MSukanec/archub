import { supabase } from '@/lib/supabase';
/**
 * Elimina una bitácora del sistema.
 * 
 * ADVERTENCIA: Esta operación es irreversible.
 * 
 * @param siteLogId - ID de la bitácora a eliminar
 * @throws {Error} Si falla la eliminación en Supabase
 */
export async function deleteSiteLog(siteLogId: string) {
  if (!supabase) {
    throw new Error('Error de conexión con la base de datos');
  }
  const { error } = await supabase
    .from('site_logs')
    .delete()
    .eq('id', siteLogId);
  if (error) throw new Error(error.message);
}
