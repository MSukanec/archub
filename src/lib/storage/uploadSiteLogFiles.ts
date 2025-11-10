import { supabase } from '@/lib/supabase'

interface UploadedFile {
  file_url: string
  file_type: 'image' | 'video'
  original_name: string
}

export async function uploadSiteLogFiles(
  files: File[],
  siteLogId: string,
  userId: string,
  organizationId: string,
  projectId?: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = []

  for (const file of files) {
    try {
      // Validate file first
      if (!file || file.size === 0) {
        continue
      }

      // Generate unique filename without user prefix
      const extension = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${extension}`

      // First, create the database record to satisfy RLS
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video'

      const { error: dbError } = await supabase
        .from('project_media')
        .insert({
          site_log_id: siteLogId,
          file_path: filePath,
          file_name: file.name,
          file_type: fileType,
          file_url: urlData.publicUrl,
          created_by: userId, // Use real user.id from context, not auth.uid()
          organization_id: organizationId,
          project_id: projectId,
          file_size: file.size,
          visibility: 'organization'
        })

      if (dbError) {
        throw dbError
      }

      // Now upload to Supabase Storage - RLS should allow it
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        // Clean up database record if upload fails
        await supabase
          .from('project_media')
          .delete()
          .eq('file_path', filePath)
        throw uploadError
      }

      uploadedFiles.push({
        file_url: urlData.publicUrl,
        file_type: fileType,
        original_name: file.name
      })
    } catch (error) {
      throw error
    }
  }

  return uploadedFiles
}



export async function getSiteLogFiles(siteLogId: string) {
  const { data, error } = await supabase
    .from('project_media')
    .select('*')
    .eq('site_log_id', siteLogId)

  if (error) {
    throw error
  }

  return data || []
}

export async function deleteSiteLogFile(fileId: string, fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === 'media')
    
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      const filePath = pathSegments.slice(bucketIndex + 1).join('/')
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath])

      if (storageError) {
      }
    }

    // Delete record from database
    const { error: dbError } = await supabase
      .from('project_media')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      throw dbError
    }
  } catch (error) {
    throw error
  }
}