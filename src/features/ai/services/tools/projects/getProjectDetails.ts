import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDateRange } from '../../utils/responseFormatter';

/**
 * Obtiene información detallada de un proyecto específico.
 * 
 * @param projectName - Nombre del proyecto a buscar (fuzzy match)
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @returns Información detallada del proyecto o error descriptivo
 */
export async function getProjectDetails(
  projectName: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        created_at,
        updated_at,
        version,
        discount_pct,
        tax_pct,
        tax_label,
        currencies!currency_id (
          code,
          symbol,
          name
        ),
        project_data (
          start_date,
          end_date,
          project_status,
          project_priority,
          assigned_to
        ),
        organization_members!created_by (
          users (
            full_name,
            email
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .ilike('name', `%${projectName}%`);

    if (error) {
      console.error('Error fetching project:', error);
      return `Error al buscar el proyecto: ${error.message}`;
    }

    if (!projects || projects.length === 0) {
      const { data: allProjects } = await supabase
        .from('projects')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .limit(5);
      
      if (allProjects && allProjects.length > 0) {
        const suggestions = allProjects.map(p => `"${p.name}"`).join(', ');
        return `No encontré el proyecto "${projectName}". Proyectos disponibles: ${suggestions}`;
      }
      
      return `No encontré el proyecto "${projectName}" en tu organización`;
    }

    if (projects.length > 1) {
      const matches = projects.map(p => `"${p.name}"`).join(', ');
      return `Encontré múltiples proyectos que coinciden con "${projectName}": ${matches}. Por favor sé más específico`;
    }

    const project = projects[0];
    const projectData = Array.isArray(project.project_data) 
      ? project.project_data[0] 
      : project.project_data;
    
    const currency = Array.isArray(project.currencies)
      ? project.currencies[0]
      : project.currencies;

    const organizationMember = Array.isArray(project.organization_members)
      ? project.organization_members[0]
      : project.organization_members;
      
    const creator = organizationMember?.users 
      ? (Array.isArray(organizationMember.users) 
          ? organizationMember.users[0] 
          : organizationMember.users)
      : null;

    let response = `Información del proyecto "${project.name}":\n\n`;
    
    response += `📋 Información general:\n`;
    response += `   • Estado: ${project.status || 'Sin estado'}\n`;
    
    if (projectData?.project_status) {
      response += `   • Estado del proyecto: ${projectData.project_status}\n`;
    }
    
    if (projectData?.project_priority) {
      response += `   • Prioridad: ${projectData.project_priority}\n`;
    }
    
    if (project.description) {
      response += `   • Descripción: ${project.description}\n`;
    }
    
    if (project.version) {
      response += `   • Versión: ${project.version}\n`;
    }
    
    response += '\n';
    
    if (projectData?.start_date || projectData?.end_date) {
      response += `📅 Fechas:\n`;
      
      if (projectData.start_date && projectData.end_date) {
        response += `   • Período: ${formatDateRange(projectData.start_date, projectData.end_date)}\n`;
      } else if (projectData.start_date) {
        const startFormatted = new Date(projectData.start_date).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        response += `   • Fecha de inicio: ${startFormatted}\n`;
      } else if (projectData.end_date) {
        const endFormatted = new Date(projectData.end_date).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        response += `   • Fecha de fin: ${endFormatted}\n`;
      }
      
      response += '\n';
    }
    
    if (currency || project.discount_pct || project.tax_pct) {
      response += `💰 Información financiera:\n`;
      
      if (currency) {
        response += `   • Moneda: ${currency.name || currency.code} (${currency.symbol})\n`;
      }
      
      if (project.discount_pct) {
        response += `   • Descuento: ${project.discount_pct}%\n`;
      }
      
      if (project.tax_pct) {
        const taxLabel = project.tax_label || 'Impuesto';
        response += `   • ${taxLabel}: ${project.tax_pct}%\n`;
      }
      
      response += '\n';
    }
    
    response += `ℹ️ Metadata:\n`;
    
    if (creator?.full_name || creator?.email) {
      response += `   • Creado por: ${creator.full_name || creator.email}\n`;
    }
    
    const createdDate = new Date(project.created_at).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    response += `   • Fecha de creación: ${createdDate}\n`;
    
    if (project.updated_at && project.updated_at !== project.created_at) {
      const updatedDate = new Date(project.updated_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      response += `   • Última actualización: ${updatedDate}\n`;
    }

    return response;

  } catch (err) {
    console.error('Unexpected error in getProjectDetails:', err);
    return 'Error inesperado al buscar el proyecto. Por favor intenta nuevamente.';
  }
}
