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
    // Generate unique filename first
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    // Upload file to storage first
    const { error: uploadError } = await supabase.storage
      .from('site-log-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('site-log-files')
      .getPublicUrl(filePath);

    // Create database record with all required fields
    const fileRecord = {
      file_name: title,
      file_type: file.type.startsWith('image/') ? 'image' : 'video',
      file_size: file.size,
      description: description || null,
      created_by: createdBy,
      organization_id: organizationId,
      file_url: publicUrl,
      file_path: filePath,
      // No site_log_id for independent gallery uploads
    };

    const { data: dbFile, error: dbError } = await supabase
      .from('site_log_files')
      .insert(fileRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Cleanup uploaded file if database insertion fails
      await supabase.storage
        .from('site-log-files')
        .remove([filePath]);
      throw new Error(`Error al crear registro en base de datos: ${dbError.message}`);
    }
  }
}