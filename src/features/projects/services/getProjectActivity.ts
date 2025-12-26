import { supabase } from '@/lib/supabase';
import type { ProjectActivityData } from '../types';
/**
 * Obtiene datos de actividad del proyecto para los últimos 7 días.
 * 
 * Cuenta documentos, bitácoras y movimientos por día.
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array con datos de actividad por día
 * @throws {Error} Si falla alguna query
 */
export async function getProjectActivity(
  projectId: string,
  organizationId: string
): Promise<ProjectActivityData[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }
  // Get activity data for the last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  const activityData = await Promise.all(
    dates.map(async (date) => {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      // Count activities for this date
      const [documentsResult, siteLogsResult, movementsResult] = await Promise.all([
        supabase
          .from('design_documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .gte('created_at', dateStr)
          .lt('created_at', nextDateStr),
        
        supabase
          .from('site_logs')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .gte('created_at', dateStr)
          .lt('created_at', nextDateStr),
        
        supabase
          .from('movements')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .gte('movement_date', dateStr)
          .lt('movement_date', nextDateStr)
      ]);
      return {
        date: date.toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric'
        }),
        documents: documentsResult.count || 0,
        siteLogs: siteLogsResult.count || 0,
        movements: movementsResult.count || 0
      };
    })
  );
  return activityData;
}
