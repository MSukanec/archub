import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

      console.log('Subiendo archivo:', filePath, file);

      // First, create the database record to satisfy RLS
      const { data: urlData } = supabase.storage
        .from('site-log-files')
        .getPublicUrl(filePath);

      const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';

      const { error: dbError } = await supabase
        .from('site_log_files')
        .insert({
          file_name: title,
          file_type: fileType,
          file_url: urlData.publicUrl,
          file_path: filePath,
          file_size: file.size,
          description: description || null,
          created_by: createdBy, // Use created_by como en la tabla real
          organization_id: organizationId,
          project_id: projectId, // Agregado project_id
          visibility: 'organization',
          // No site_log_id for independent gallery uploads
        });

      if (dbError) {
        console.error('Error creating file record:', dbError);
        throw dbError;
      }

      // Now upload to Supabase Storage - RLS should allow it
      const { error: uploadError } = await supabase.storage
        .from('site-log-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Clean up database record if upload fails
        await supabase
          .from('site_log_files')
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