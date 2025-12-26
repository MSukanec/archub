import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '../types';

/**
 * Obtiene los logs de actividad recientes de una organización.
 * 
 * Incluye información del usuario que realizó la actividad:
 * - Nombre completo
 * - Avatar
 * - Email
 * 
 * Los logs se ordenan por fecha de creación (más reciente primero)
 * y se limitan a los últimos 50 registros.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de logs de actividad con información del usuario, o array vacío si no hay datos
 */
export async function getOrganizationActivityLogs(
  organizationId: string
): Promise<ActivityLog[]> {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('organization_activity_logs')
    .select(`
      id,
      organization_id,
      user_id,
      action,
      target_table,
      target_id,
      metadata,
      created_at,
      users (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }
  
  return data?.map((log: any) => ({
    ...log,
    user: Array.isArray(log.users) ? log.users[0] : log.users
  })) as ActivityLog[] || [];
}
