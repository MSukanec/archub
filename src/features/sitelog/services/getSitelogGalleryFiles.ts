import { supabase } from '@/lib/supabase';
import type { MediaFileWithLink } from '@/features/media/types';

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
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns Array de archivos multimedia de bitácoras ordenados por fecha
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getSitelogGalleryFiles(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<MediaFileWithLink[]> {
  if (!organizationId || !supabase) {
    return [];
  }

  try {
    // Base query: JOIN entre media_links, media_files y site_logs
    let query = supabase
      .from('media_links')
      .select(`
        id,
        media_file_id,
        organization_id,
        project_id,
        site_log_id,
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

    // Mapear a estructura MediaFileWithLink extendida con info de bitácora
    const files: MediaFileWithLink[] = data.map((item: any) => ({
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
      link_id: item.id,
      project_id: item.project_id,
      site_log_id: item.site_log_id,
      organization_id: item.organization_id,
      visibility: null,
      description: item.description,
      category: item.category,
      is_cover: false,
      position: item.position,
      created_at: item.created_at,
      created_by: item.created_by || 'Desconocido',
      
      // Datos de la bitácora asociada (para mostrar contexto)
      site_log: {
        id: item.site_logs.id,
        date: item.site_logs.date,
        description: item.site_logs.description,
        type_name: item.site_logs.site_log_types?.name || 'Sin tipo'
      }
    }));

    return files;

  } catch (error) {
    console.error('Error fetching sitelog gallery files:', error);
    throw error;
  }
}
