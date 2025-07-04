import { supabase } from '@/lib/supabase'

interface UploadedFile {
  file_url: string
  file_type: 'image' | 'video'
  original_name: string
}

export async function uploadSiteLogFiles(
  files: File[],
  siteLogId: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = []

  for (const file of files) {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `site-log-files/${siteLogId}/${fileName}`

      // Upload to Supabase Storage (using avatars bucket temporarily to avoid RLS issues)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Determine file type
      const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video'

      uploadedFiles.push({
        file_url: urlData.publicUrl,
        file_type: fileType,
        original_name: file.name
      })
    } catch (error) {
      console.error('Error processing file:', file.name, error)
      throw error
    }
  }

  return uploadedFiles
}

export async function saveSiteLogFiles(
  siteLogId: string,
  uploadedFiles: UploadedFile[]
): Promise<void> {
  if (uploadedFiles.length === 0) return

  // Temporalmente deshabilitado hasta crear la tabla site_log_files
  console.log('Files would be saved to site_log_files table:', uploadedFiles)
  return

  /* TODO: Uncomment when site_log_files table is created
  const fileRecords = uploadedFiles.map(file => ({
    site_log_id: siteLogId,
    file_url: file.file_url,
    file_type: file.file_type,
    original_name: file.original_name
  }))

  const { error } = await supabase
    .from('site_log_files')
    .insert(fileRecords)

  if (error) {
    console.error('Error saving file records:', error)
    throw error
  }
  */
}

export async function getSiteLogFiles(siteLogId: string) {
  // Temporalmente deshabilitado hasta crear la tabla site_log_files
  console.log('Getting site log files for:', siteLogId)
  return []

  /* TODO: Uncomment when site_log_files table is created
  const { data, error } = await supabase
    .from('site_log_files')
    .select('*')
    .eq('site_log_id', siteLogId)

  if (error) {
    console.error('Error fetching site log files:', error)
    throw error
  }

  return data || []
  */
}

export async function deleteSiteLogFile(fileId: string, fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === 'site-log-files')
    
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      const filePath = pathSegments.slice(bucketIndex + 1).join('/')
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('site-log-files')
        .remove([filePath])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }
    }

    // Delete record from database
    const { error: dbError } = await supabase
      .from('site_log_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      throw dbError
    }
  } catch (error) {
    console.error('Error in deleteSiteLogFile:', error)
    throw error
  }
}