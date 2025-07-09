import { supabase } from '@/lib/supabase';

export interface UploadedProjectImage {
  file_url: string;
  file_path: string;
}

export async function uploadProjectImage(
  file: File,
  projectId: string,
  organizationId: string
): Promise<UploadedProjectImage> {
  try {
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-image')
      .getPublicUrl(filePath);

    return {
      file_url: urlData.publicUrl,
      file_path: filePath
    };
  } catch (error) {
    console.error('Error processing project image:', error);
    throw error;
  }
}

export async function deleteProjectImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('project-image')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting project image:', error);
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting project image:', error);
    throw error;
  }
}

export async function updateProjectImageUrl(
  projectId: string,
  imageUrl: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from('project_data')
      .upsert({
        project_id: projectId,
        project_image_url: imageUrl
      }, {
        onConflict: 'project_id'
      });

    if (error) {
      console.error('Error updating project image URL:', error);
      throw new Error(`Error al actualizar URL de imagen: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating project image URL:', error);
    throw error;
  }
}