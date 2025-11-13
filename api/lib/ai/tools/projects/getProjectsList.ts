import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDateRange } from '../../utils/responseFormatter.js';

/**
 * Obtiene la lista de proyectos de una organización con información básica.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param filters - Filtros opcionales (status)
 * @returns Lista formateada de proyectos o error descriptivo
 */
export async function getProjectsList(
  organizationId: string,
  supabase: SupabaseClient,
  filters?: { status?: string }
): Promise<string> {
  
  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        description,
        created_at,
        project_data!left (
          start_date,
          estimated_end
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return `Error al buscar proyectos: ${error.message}`;
    }

    if (!projects || projects.length === 0) {
      if (filters?.status) {
        return `No encontré proyectos con estado "${filters.status}" en tu organización`;
      }
      return 'No hay proyectos registrados en tu organización';
    }

    let response = `Tienes ${projects.length} proyecto${projects.length > 1 ? 's' : ''}`;
    if (filters?.status) {
      response += ` con estado "${filters.status}"`;
    }
    response += ':\n\n';

    projects.forEach((project, index) => {
      const projectData = Array.isArray(project.project_data) 
        ? project.project_data[0] 
        : project.project_data;

      response += `${index + 1}. ${project.name}\n`;
      response += `   • Estado: ${project.status || 'Sin estado'}\n`;
      
      if (projectData?.start_date || projectData?.estimated_end) {
        if (projectData.start_date && projectData.estimated_end) {
          response += `   • Período: ${formatDateRange(projectData.start_date, projectData.estimated_end)}\n`;
        } else if (projectData.start_date) {
          const startFormatted = new Date(projectData.start_date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          response += `   • Fecha de inicio: ${startFormatted}\n`;
        } else if (projectData.estimated_end) {
          const endFormatted = new Date(projectData.estimated_end).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          response += `   • Fecha estimada de fin: ${endFormatted}\n`;
        }
      }
      
      if (project.description) {
        const shortDesc = project.description.length > 80 
          ? project.description.substring(0, 80) + '...' 
          : project.description;
        response += `   • Descripción: ${shortDesc}\n`;
      }
      
      response += '\n';
    });

    return response.trim();

  } catch (err) {
    console.error('Unexpected error in getProjectsList:', err);
    return 'Error inesperado al buscar proyectos. Por favor intenta nuevamente.';
  }
}
