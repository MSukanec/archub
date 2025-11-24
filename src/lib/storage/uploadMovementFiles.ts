import { supabase } from '@/lib/supabase';
import { uploadFile } from './uploadFile';
import { getMediaFileUrl, getFileUrl } from './getFileUrl';
import type { UploadContext } from './types';

interface UploadedFile {
  file_url: string;
  file_type: string;
  original_name: string;
  file_path: string;
}

export async function uploadMovementFiles(
  files: File[],
  movementId: string,
  userId: string,
  organizationId: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];

  for (const file of files) {
    try {
      if (!file || file.size === 0) {
        console.error('Archivo vacío o inválido');
        continue;
      }

      console.log('Subiendo archivo de movimiento:', file.name);

      const isInvoice = file.name.toLowerCase().includes('invoice') || 
                       file.name.toLowerCase().includes('factura');

      const context: UploadContext = {
        entity: isInvoice ? 'invoice' : 'contact_document',
        organization_id: organizationId,
        user_id: userId,
        link_to: {
          movement_id: movementId
        },
        category: 'movement_attachment',
        description: `Attachment for movement ${movementId}`
      };

      const result = await uploadFile(file, context);

      console.log('Archivo subido exitosamente:', result.file_path);

      const fileUrl = await getFileUrl(result.bucket, result.file_path);

      uploadedFiles.push({
        file_url: fileUrl,
        file_type: file.type,
        original_name: file.name,
        file_path: result.file_path
      });
    } catch (error) {
      console.error('Error procesando archivo:', error);
    }
  }

  return uploadedFiles;
}

export async function getMovementFiles(movementId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('media_links')
    .select(`
      id,
      description,
      created_at,
      media_files!inner (
        id,
        file_name,
        file_url,
        file_type,
        file_size,
        file_path,
        bucket,
        is_deleted
      )
    `)
    .eq('movement_id', movementId)
    .eq('media_files.is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo archivos de movimiento:', error);
    return [];
  }

  const filesWithUrls = await Promise.all(
    (data || []).map(async (link: any) => ({
      id: link.media_files.id,
      file_name: link.media_files.file_name,
      file_url: await getMediaFileUrl(link.media_files),
      file_type: link.media_files.file_type,
      file_size: link.media_files.file_size,
      file_path: link.media_files.file_path,
      created_at: link.created_at
    }))
  );

  return filesWithUrls;
}

export async function deleteMovementFile(fileId: string, filePath: string) {
  if (!supabase) return false;

  try {
    const { data: mediaFile } = await supabase
      .from('media_files')
      .select('bucket')
      .eq('id', fileId)
      .single();

    if (mediaFile) {
      const { error: storageError } = await supabase.storage
        .from(mediaFile.bucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Error eliminando archivo de Storage:', storageError);
      }
    }

    const { error: dbError } = await supabase
      .from('media_files')
      .update({ is_deleted: true })
      .eq('id', fileId);

    if (dbError) {
      console.error('Error eliminando registro de archivo:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return false;
  }
}
