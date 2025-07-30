import { supabase } from '@/lib/supabase'

interface UploadedFile {
  file_url: string
  file_type: string
  original_name: string
  file_path: string
}

export async function uploadMovementFiles(
  files: File[],
  movementId: string,
  userId: string,
  organizationId: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = []

  for (const file of files) {
    try {
      // Validate file first
      if (!file || file.size === 0) {
        continue
      }

      // Generate unique filename
      const extension = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${extension}`


      // First, create the database record to satisfy RLS
      const { data: urlData } = supabase.storage
        .from('movement-files')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('movement_files')
        .insert({
          movement_id: movementId,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_url: urlData.publicUrl,
          user_id: userId,
          organization_id: organizationId,
          visibility: 'organization'
        })

      if (dbError) {
        continue
      }

      // Then upload the actual file to Storage
      const { data, error } = await supabase.storage
        .from('movement-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        
        // Clean up database record if Storage upload fails
        await supabase
          .from('movement_files')
          .delete()
          .eq('file_path', filePath)
        
        continue
      }


      uploadedFiles.push({
        file_url: urlData.publicUrl,
        file_type: file.type,
        original_name: file.name,
        file_path: filePath
      })
    } catch (error) {
    }
  }

  return uploadedFiles
}

export async function getMovementFiles(movementId: string) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('movement_files')
    .select('*')
    .eq('movement_id', movementId)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data || []
}

export async function deleteMovementFile(fileId: string, filePath: string) {
  if (!supabase) return false

  try {
    // Delete from Storage first
    const { error: storageError } = await supabase.storage
      .from('movement-files')
      .remove([filePath])

    if (storageError) {
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('movement_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}