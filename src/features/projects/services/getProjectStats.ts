import { supabase } from '@/lib/supabase';
import type { ProjectStats } from '../types';

/**
 * Obtiene las estadísticas de un proyecto.
 * 
 * Incluye:
 * - Información del proyecto con imagen
 * - Total de documentos de diseño
 * - Total de bitácoras
 * - Total de presupuestos
 * - Total de movimientos
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Estadísticas del proyecto, o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getProjectStats(
  projectId: string, 
  organizationId: string
): Promise<ProjectStats | null> {
  if (!supabase || !organizationId || !projectId) {
    return null;
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_deleted', false)
    .single();

  if (projectError) {
    console.error('Error fetching project for stats:', projectError);
    throw projectError;
  }

  if (!project) {
    return null;
  }

  // Get project data (including image) separately
  const { data: projectData, error: projectDataError } = await supabase
    .from('project_data')
    .select('image_bucket, image_path')
    .eq('project_id', projectId)
    .single();

  if (projectDataError && projectDataError.code !== 'PGRST116') {
    console.error('Error fetching project data:', projectDataError);
  }

  // Get design documents count
  const { count: documentsCount } = await supabase
    .from('design_documents')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Get site logs count
  const { count: siteLogsCount } = await supabase
    .from('site_logs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Get budgets count
  const { count: budgetsCount } = await supabase
    .from('budgets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Get movements count for this project
  const { count: movementsCount } = await supabase
    .from('movements')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('project_id', projectId);

  return {
    project: {
      ...project,
      project_data: projectData || null
    },
    totalDocuments: documentsCount || 0,
    totalSiteLogs: siteLogsCount || 0,
    totalBudgets: budgetsCount || 0,
    totalMovements: movementsCount || 0
  };
}
