import { SupabaseClient } from '@supabase/supabase-js';

interface GetGalleryFilesParams {
  organizationId: string;
  projectId?: string | null;
  category?: 'photo' | 'video' | 'document' | null;
}

interface GalleryFile {
  id: string;
  media_file_id: string;
  organization_id: string;
  project_id: string | null;
  site_log_id: string | null;
  movement_id: string | null;
  contact_id: string | null;
  course_lesson_id: string | null;
  general_cost_payment_id: string | null;
  client_payment_id: string | null;
  visibility: string;
  description: string | null;
  category: string;
  is_cover: boolean;
  position: number | null;
  created_by: string;
  created_at: string;
  media_files: {
    id: string;
    bucket: string;
    file_url: string | null;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    is_deleted: boolean;
  } | null;
  projects: {
    name: string;
  } | null;
  signedUrl?: string;
}

interface GetGalleryFilesResult {
  success: boolean;
  data?: GalleryFile[];
  error?: string;
}

async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600);
  
  if (error) {
    console.error('[getSignedUrl] Error:', error);
    return null;
  }
  
  return data?.signedUrl || null;
}

export async function getGalleryFiles(
  supabase: SupabaseClient,
  params: GetGalleryFilesParams
): Promise<GetGalleryFilesResult> {
  const { organizationId, projectId, category } = params;

  try {
    let query = supabase
      .from('media_links')
      .select(`
        id,
        media_file_id,
        organization_id,
        project_id,
        site_log_id,
        movement_id,
        contact_id,
        course_lesson_id,
        general_cost_payment_id,
        client_payment_id,
        visibility,
        description,
        category,
        is_cover,
        position,
        created_by,
        created_at,
        media_files!inner(
          id,
          bucket,
          file_url,
          file_name,
          file_path,
          file_size,
          file_type,
          is_deleted
        ),
        projects(name)
      `)
      .eq('organization_id', organizationId)
      .eq('media_files.is_deleted', false)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.or(`visibility.eq.organization,and(visibility.eq.project,project_id.eq.${projectId})`);
    } else {
      query = query.eq('visibility', 'organization');
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getGalleryFiles] Error fetching files:', error);
      return { success: false, error: error.message };
    }

    const filesWithUrls = await Promise.all(
      (data || []).map(async (item: any) => {
        const mediaFile = item.media_files;
        
        if (!mediaFile) {
          return item;
        }

        let signedUrl: string | null = null;

        if (mediaFile.bucket === 'public-assets') {
          const { data: publicUrlData } = supabase.storage
            .from(mediaFile.bucket)
            .getPublicUrl(mediaFile.file_path);
          signedUrl = publicUrlData?.publicUrl || null;
        } else {
          signedUrl = await getSignedUrl(supabase, mediaFile.bucket, mediaFile.file_path);
        }

        return {
          ...item,
          signedUrl
        };
      })
    );

    return { success: true, data: filesWithUrls };

  } catch (error) {
    console.error('[getGalleryFiles] Unexpected error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
