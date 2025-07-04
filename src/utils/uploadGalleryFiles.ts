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
  userId: string,
  organizationId: string,
  projectId: string
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir');
  }

  for (const { file, title, description } of files) {
    // Create database record first (for RLS compliance)
    const fileRecord = {
      file_name: title,
      file_type: file.type.startsWith('image/') ? 'image' : 'video',
      file_size: file.size,
      description: description || null,
      user_id: userId,
      // No site_log_id for independent gallery uploads
    };

    const { data: dbFile, error: dbError } = await supabase
      .from('site_log_files')
      .insert(fileRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Error al crear registro en base de datos: ${dbError.message}`);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('site-log-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Cleanup database record if upload fails
        await supabase
          .from('site_log_files')
          .delete()
          .eq('id', dbFile.id);
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-log-files')
        .getPublicUrl(filePath);

      // Update database record with file URL and path
      const { error: updateError } = await supabase
        .from('site_log_files')
        .update({
          file_path: filePath,
          file_url: publicUrl,
        })
        .eq('id', dbFile.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        // Try to cleanup both storage and database
        await supabase.storage
          .from('site-log-files')
          .remove([filePath]);
        await supabase
          .from('site_log_files')
          .delete()
          .eq('id', dbFile.id);
        throw new Error(`Error al actualizar registro: ${updateError.message}`);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      throw error;
    }
  }
}