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

  // Get current user for file path prefix
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  for (const file of files) {
    try {
      // Use user.id as prefix followed by original filename
      const filePath = `${user.id}/${file.name}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-log-files')
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
        .from('site-log-files')
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
}

export async function getSiteLogFiles(siteLogId: string) {
  const { data, error } = await supabase
    .from('site_log_files')
    .select('*')
    .eq('site_log_id', siteLogId)

  if (error) {
    console.error('Error fetching site log files:', error)
    throw error
  }

  return data || []
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