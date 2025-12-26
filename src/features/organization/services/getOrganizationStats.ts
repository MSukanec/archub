import { supabase } from '@/lib/supabase';
import { subDays } from 'date-fns';
import type { OrganizationStats } from '../types';
/**
 * Obtiene estadísticas generales de una organización.
 * 
 * Estadísticas incluidas:
 * - Número de proyectos activos
 * - Documentos subidos en los últimos 30 días
 * - Tareas generadas
 * - Movimientos financieros totales de los últimos 30 días (valor absoluto)
 * 
 * @param organizationId - ID de la organización
 * @returns Objeto con estadísticas de la organización, o valores por defecto en 0 si falla
 */
export async function getOrganizationStats(
  organizationId: string
): Promise<OrganizationStats> {
  if (!supabase || !organizationId) {
    return {
      activeProjects: 0,
      documentsLast30Days: 0,
      generatedTasks: 0,
      financialMovementsLast30Days: 0
    };
  }
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { count: activeProjectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_deleted', false);
    const { count: documentsCount } = await supabase
      .from('design_documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    const { data: movements } = await supabase
      .from('movements')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('movement_date', thirtyDaysAgo.toISOString());
    const totalMovements = movements?.reduce((sum, movement) => sum + (movement.amount || 0), 0) || 0;
    return {
      activeProjects: activeProjectsCount || 0,
      documentsLast30Days: documentsCount || 0,
      generatedTasks: tasksCount || 0,
      financialMovementsLast30Days: Math.abs(totalMovements)
    };
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return {
      activeProjects: 0,
      documentsLast30Days: 0,
      generatedTasks: 0,
      financialMovementsLast30Days: 0
    };
  }
}
