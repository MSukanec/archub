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
      // Validate file first
      if (!file || file.size === 0) {
        console.error('Archivo vacío o inválido')
        continue
      }

      // Generate unique filename with user prefix as required by RLS
      const extension = file.name.split('.').pop()
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`

      console.log('Subiendo archivo:', filePath, file)

      // Upload to Supabase Storage with upsert: true
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-log-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
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
  uploadedFiles: UploadedFile[],
  userId: string,
  organizationId: string
): Promise<void> {
  if (uploadedFiles.length === 0) return

  const fileRecords = uploadedFiles.map(file => {
    // Extract file path from URL
    const url = new URL(file.file_url)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === 'site-log-files')
    const filePath = bucketIndex !== -1 ? pathSegments.slice(bucketIndex + 1).join('/') : file.original_name

    return {
      site_log_id: siteLogId,
      file_path: filePath,
      file_name: file.original_name,
      file_type: file.file_type,
      file_url: file.file_url,
      user_id: userId,
      organization_id: organizationId,
      visibility: 'organization' as const
    }
  })

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