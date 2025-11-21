import { supabase } from '@/lib/supabase';
import type { SitelogGalleryFile } from '../types';

/**
 * Obtiene archivos multimedia (fotos y videos) de bitácoras.
 * 
 * Usa nueva arquitectura (media_links + media_files) para obtener
 * SOLO archivos asociados a bitácoras (site_log_id IS NOT NULL).
 * 
 * Incluye:
 * - Datos del archivo (file_url, file_name, file_type, file_size)
 * - Datos del link (link_id para eliminación)
 * - Datos de la bitácora asociada (fecha, tipo, descripción)
 * - Datos del proyecto (nombre)
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns Array de archivos multimedia de bitácoras ordenados por fecha
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getSitelogGalleryFiles(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<SitelogGalleryFile[]> {
  if (!organizationId || !supabase) {
    return [];
  }

  try {
    // Base query: JOIN entre media_links, media_files, site_logs y projects
    let query = supabase
      .from('media_links')
      .select(`
        id,
        media_file_id,
        organization_id,
        project_id,
        site_log_id,
        visibility,
        description,
        category,
        position,
        created_by,
        created_at,
        metadata,
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
        site_logs!inner (
          id,
          date,
          description,
          site_log_type_id,
          site_log_types (
            id,
            name
          )
        ),
        projects (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .not('site_log_id', 'is', null) // CRÍTICO: Solo archivos de bitácoras
      .eq('media_files.is_deleted', false)
      .in('media_files.file_type', ['image', 'video']); // Solo fotos y videos

    // Filtrar por proyecto si está definido
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Mapear a estructura SitelogGalleryFile con null checks robustos
    const files: SitelogGalleryFile[] = data
      .filter((item: any) => {
        // Validar que existan los datos críticos
        const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
        const siteLog = Array.isArray(item.site_logs) ? item.site_logs[0] : item.site_logs;
        return mediaFile && siteLog;
      })
      .map((item: any) => {
        const mediaFile = Array.isArray(item.media_files) ? item.media_files[0] : item.media_files;
        const siteLog = Array.isArray(item.site_logs) ? item.site_logs[0] : item.site_logs;
        const project = Array.isArray(item.projects) ? item.projects[0] : item.projects;
        
        return {
          // Datos del archivo (media_files)
          id: mediaFile.id,
          file_url: mediaFile.file_url,
          file_name: mediaFile.file_name,
          file_type: mediaFile.file_type,
          file_size: mediaFile.file_size,
          file_path: mediaFile.file_path,
          bucket: mediaFile.bucket,
          is_deleted: mediaFile.is_deleted,
          
          // Datos del link (media_links)
          link_id: item.id,
          project_id: item.project_id || '',
          project_name: project?.name || 'Sin proyecto',
          site_log_id: item.site_log_id || '',
          organization_id: item.organization_id,
          visibility: item.visibility || 'organization',
          description: item.description || null,
          category: item.category || null,
          is_cover: false,
          position: item.position || null,
          created_at: item.created_at,
          created_by: item.created_by || 'Desconocido',
          
          // Datos de la bitácora asociada (para mostrar contexto)
          site_log: {
            id: siteLog.id,
            date: siteLog.date,
            description: siteLog.description || null,
            type_name: siteLog.site_log_types?.name || 'Sin tipo'
          }
        };
      });

    return files;

  } catch (error) {
    console.error('Error fetching sitelog gallery files:', error);
    throw error;
  }
}
