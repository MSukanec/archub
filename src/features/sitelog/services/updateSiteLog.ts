import { supabase } from '@/lib/supabase';
import type { CreateSiteLogData } from './createSiteLog';
/**
 * Actualiza una bitácora existente.
 * 
 * CRÍTICO: No valida organization_id aquí porque se asume que el ID ya fue
 * validado antes de llamar esta función (típicamente por RLS en Supabase).
 * 
 * @param siteLogId - ID de la bitácora a actualizar
 * @param data - Datos actualizados de la bitácora
 * @returns La bitácora actualizada
 * @throws {Error} Si falla la actualización en Supabase
 */
export async function updateSiteLog(siteLogId: string, data: CreateSiteLogData) {
  if (!supabase) {
    throw new Error('Error de conexión con la base de datos');
  }
  const { data: result, error } = await supabase
    .from('site_logs')
    .update(data)
    .eq('id', siteLogId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  
  return result;
}
