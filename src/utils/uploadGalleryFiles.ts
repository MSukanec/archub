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



      // First upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      // Get the public URL after successful upload
      const { data: urlData } = supabase.storage
        .from('media')
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

      console.log('Insertando en DB después de subir archivo:', insertData);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        customTitle: title
      });

      // Test current user auth first
      const { data: authUser } = await supabase.auth.getUser();
      console.log('Current auth user:', authUser?.user?.id);
      
      // Test if we can select from table first
      const { data: testSelect, error: selectError } = await supabase
        .from('project_media')
        .select('id')
        .limit(1);
      console.log('Test select result:', { testSelect, selectError });

      // Now create the database record
      const { error: dbError } = await supabase
        .from('project_media')
        .insert(insertData);

      if (dbError) {
        console.error('Error creating file record:', dbError);
        console.error('Detailed error:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        });
        // Clean up uploaded file if DB insertion failed
        await supabase.storage
          .from('media')
          .remove([filePath]);
        throw dbError;
      }

      console.log('Archivo subido exitosamente:', filePath);
    } catch (error) {
      console.error('Error processing file:', file.name, error);
      throw error;
    }
  }
}