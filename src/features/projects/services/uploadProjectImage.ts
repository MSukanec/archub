import { supabase } from '@/lib/supabase';
import type { UploadedProjectImage } from '../types';

/**
 * Sube una imagen de proyecto al storage de Supabase.
 * 
 * La imagen se guarda en el bucket 'project-image' con la estructura:
 * [organization_id]/[project_id]/hero.[extension]
 * 
 * @param file - Archivo de imagen a subir
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Objeto con la URL pública y path del archivo
 * @throws {Error} Si el archivo es inválido o falla la subida
 */
export async function uploadProjectImage(
  file: File,
  projectId: string,
  organizationId: string
): Promise<UploadedProjectImage> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Validate file
  if (!file || file.size === 0) {
    throw new Error('Archivo vacío o inválido');
  }

  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen');
  }

  // Generate file path following the structure: [organization_id]/[project_id]/hero.jpg
  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `${organizationId}/${projectId}/hero.${extension}`;

  console.log('Uploading project image:', filePath);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('project-image')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Replace existing file if it exists
    });

  if (uploadError) {
    console.error('Error uploading project image:', uploadError);
    throw new Error(`Error al subir imagen: ${uploadError.message}`);
  }

  // Get public URL with cache busting timestamp
  const { data: urlData } = supabase.storage
    .from('project-image')
    .getPublicUrl(filePath);

  // Add timestamp to prevent browser caching of old images
  const urlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;

  return {
    file_url: urlWithCacheBust,
    file_path: filePath
  };
}

/**
 * Elimina una imagen de proyecto del storage.
 * 
 * @param filePath - Path del archivo a eliminar
 * @throws {Error} Si falla la eliminación
 */
export async function deleteProjectImage(filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage
    .from('project-image')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting project image:', error);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
}

/**
 * Actualiza la URL de la imagen en project_data.
 * 
 * @param projectId - ID del proyecto
 * @param imageUrl - Nueva URL de la imagen (o null para eliminar)
 * @throws {Error} Si falla la actualización
 */
export async function updateProjectImageUrl(
  projectId: string,
  imageUrl: string | null
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Get organization_id from the project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .eq('is_deleted', false)
    .single();

  if (projectError || !projectData) {
    console.error('Error getting project organization:', projectError);
    throw new Error(`Error al obtener organización del proyecto: ${projectError?.message || 'Proyecto no encontrado'}`);
  }

  const { error } = await supabase
    .from('project_data')
    .upsert({
      project_id: projectId,
      organization_id: projectData.organization_id,
      project_image_url: imageUrl
    }, {
      onConflict: 'project_id'
    });

  if (error) {
    console.error('Error updating project image URL:', error);
    throw new Error(`Error al actualizar URL de imagen: ${error.message}`);
  }
}
