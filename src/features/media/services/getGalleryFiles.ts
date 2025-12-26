import { supabase } from '@/lib/supabase';
import type { GalleryFile } from '../types';

/**
 * Obtiene todos los archivos de galería para una organización y proyecto.
 * 
 * Combina archivos con dos niveles de visibilidad:
 * - Archivos de nivel organización (visibility = 'organization')
 * - Archivos de nivel proyecto (visibility = 'project') si hay proyecto actual
 * 
 * Incluye:
 * - Información del archivo (url, nombre, tipo, tamaño)
 * - Nombre del proyecto relacionado
 * - ID de bitácora si está asociado
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto actual (opcional)
 * @returns Array de archivos de galería ordenados por fecha de creación (más recientes primero)
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getGalleryFiles(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<GalleryFile[]> {
  if (!organizationId || !supabase) {
    return [];
  }

  // Get organization files (visibility = 'organization')
  const orgQuery = supabase
    .from('project_media')
    .select(`
      id,
      file_url,
      file_type,
      file_name,
      file_size,
      created_at,
      description,
      project_id,
      visibility,
      created_by,
      site_log_id,
      file_path,
      organization_id,
      projects!inner(name)
    `)
    .eq('organization_id', organizationId)
    .eq('visibility', 'organization');

  // Get project files if there's a current project (visibility = 'project')
  let projectQuery = null;
  if (projectId) {
    projectQuery = supabase
      .from('project_media')
      .select(`
        id,
        file_url,
        file_type,
        file_name,
        file_size,
        created_at,
        description,
        project_id,
        visibility,
        created_by,
        site_log_id,
        file_path,
        organization_id,
        projects!inner(name)
      `)
      .eq('project_id', projectId)
      .eq('visibility', 'project');
  }

  try {
    const [orgResult, projectResult] = await Promise.all([
      orgQuery,
      projectQuery
    ]);

    if (orgResult.error) throw orgResult.error;
    if (projectResult?.error) throw projectResult.error;

    const orgFiles = orgResult.data || [];
    const projectFiles = projectResult?.data || [];

    // Combine and format files
    const allFiles: GalleryFile[] = [...orgFiles, ...projectFiles].map((file: any) => ({
      id: file.id,
      file_url: file.file_url,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size,
      created_at: file.created_at,
      project_id: file.project_id,
      organization_id: file.organization_id,
      visibility: file.visibility as 'organization' | 'project' | 'private',
      created_by: file.created_by || 'Desconocido',
      description: file.description,
      file_path: file.file_path,
      project_name: file.projects?.name || 'Sin proyecto',
      site_log_id: file.site_log_id || null
    }));

    // Sort by creation date (newest first)
    return allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching gallery files:', error);
    throw error;
  }
}
