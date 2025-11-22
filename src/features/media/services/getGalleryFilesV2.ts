import { supabase } from '@/lib/supabase';
import type { MediaFileWithLink } from '../types';

/**
 * Obtiene archivos de galería usando la nueva arquitectura (media_files + media_links).
 * 
 * Combina archivos con dos niveles de visibilidad:
 * - Archivos de nivel organización (visibility = 'organization')
 * - Archivos de nivel proyecto (visibility = 'project') si hay proyecto actual
 * 
 * Realiza JOIN entre media_links y media_files para obtener datos completos.
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto actual (opcional)
 * @returns Array de archivos ordenados por fecha (más recientes primero)
 * @throws {Error} Si falla la query de Supabase
 */
export async function getGalleryFilesV2(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<MediaFileWithLink[]> {
  if (!organizationId || !supabase) {
    return [];
  }

  try {
    // Base query: JOIN entre media_links, media_files y projects
    let query = supabase
      .from('media_links')
      .select(`
        id,
        media_file_id,
        organization_id,
        project_id,
        site_log_id,
        movement_id,
        contact_id,
        course_lesson_id,
        general_cost_id,
        client_payment_id,
        visibility,
        description,
        category,
        is_cover,
        position,
        created_by,
        created_at,
        media_files!inner (
          id,
          file_url,
          file_name,
          file_type,
          file_size,
          file_path,
          bucket,
          is_deleted
        ),
        projects (
          name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('media_files.is_deleted', false);

    // Filtrar por visibilidad
    if (projectId) {
      // Si hay proyecto: organización + proyecto
      query = query.or(`visibility.eq.organization,and(visibility.eq.project,project_id.eq.${projectId})`);
    } else {
      // Si no hay proyecto: solo organización
      query = query.eq('visibility', 'organization');
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data) return [];

    // DEBUG: Ver datos antes del mapeo
    console.log('[getGalleryFilesV2] Primeros 2 items raw:', data.slice(0, 2));
    
    // Mapear a estructura MediaFileWithLink
    const files: MediaFileWithLink[] = data.map((item: any) => {
      const mapped = {
        // Datos del archivo (media_files)
        id: item.media_files.id,
        file_url: item.media_files.file_url,
        file_name: item.media_files.file_name,
        file_type: item.media_files.file_type,
        file_size: item.media_files.file_size,
        file_path: item.media_files.file_path,
        bucket: item.media_files.bucket,
        is_deleted: item.media_files.is_deleted,
        
        // Datos del link (media_links)
        link_id: item.id, // Este debería ser el ID de media_links
        project_id: item.project_id,
        project_name: item.projects?.name || 'Sin proyecto',
        site_log_id: item.site_log_id,
        movement_id: item.movement_id,
        contact_id: item.contact_id,
        course_lesson_id: item.course_lesson_id,
        general_cost_id: item.general_cost_id,
        client_payment_id: item.client_payment_id,
        organization_id: item.organization_id,
        visibility: item.visibility,
        description: item.description,
        category: item.category,
        is_cover: item.is_cover,
        position: item.position,
        created_at: item.created_at,
        created_by: item.created_by || 'Desconocido'
      };
      
      // DEBUG: Ver un ejemplo de mapeo
      if (data.indexOf(item) === 0) {
        console.log('[getGalleryFilesV2] Primer archivo mapeado:', {
          file_id: mapped.id,
          link_id: mapped.link_id,
          file_name: mapped.file_name
        });
      }
      
      return mapped;
    });

    // Ordenar por fecha (más recientes primero)
    return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  } catch (error) {
    console.error('Error fetching gallery files V2:', error);
    throw error;
  }
}
