import { supabase } from '@/lib/supabase';

export interface GalleryFileInput {
  file: File;
  title: string;
  description?: string;
}

export async function uploadGalleryFiles(
  files: GalleryFileInput[],
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir');
  }

  for (const { file, title, description } of files) {
    try {
      // Validate file first
      if (!file || file.size === 0) {
        console.error('Archivo vacío o inválido');
        continue;
      }

      // Generate unique filename
      const extension = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${extension}`;



      // First, create the database record to satisfy RLS
      const { data: urlData } = supabase.storage
        .from('project-media')
        .getPublicUrl(filePath);

      const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';

      const insertData = {
        file_name: title,
        file_type: fileType,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_size: file.size,
        description: description || null,
        created_by: createdBy,
        organization_id: organizationId,
        project_id: projectId,
        visibility: 'organization'
      };

      console.log('Insertando en DB:', insertData);

      const { error: dbError } = await supabase
        .from('project_media')
        .insert(insertData);

      if (dbError) {
        console.error('Error creating file record:', dbError);
        throw dbError;
      }

      // Now upload to Supabase Storage - RLS should allow it
      const { error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Clean up database record if upload fails
        await supabase
          .from('project_media')
          .delete()
          .eq('file_path', filePath);
        throw uploadError;
      }

      console.log('Archivo subido exitosamente:', filePath);
    } catch (error) {
      console.error('Error processing file:', file.name, error);
      throw error;
    }
  }
}