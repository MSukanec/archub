import { SupabaseClient } from '@supabase/supabase-js';

interface DeleteMediaFileParams {
  linkId: string;
  organizationId: string;
}

interface DeleteMediaFileResult {
  success: boolean;
  error?: string;
  deletedFileFromStorage?: boolean;
}

export async function deleteMediaFile(
  supabase: SupabaseClient,
  params: DeleteMediaFileParams
): Promise<DeleteMediaFileResult> {
  const { linkId, organizationId } = params;

  try {
    console.log('[deleteMediaFile] Attempting to delete link:', linkId);

    const { data: linkData, error: fetchLinkError } = await supabase
      .from('media_links')
      .select('id, media_file_id, organization_id')
      .eq('id', linkId)
      .single();

    if (fetchLinkError) {
      console.error('[deleteMediaFile] Error fetching link:', fetchLinkError);
      return { success: false, error: 'Link not found' };
    }

    if (linkData.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized: Link does not belong to this organization' };
    }

    const mediaFileId = linkData.media_file_id;

    const { error: deleteLinkError } = await supabase
      .from('media_links')
      .delete()
      .eq('id', linkId);

    if (deleteLinkError) {
      console.error('[deleteMediaFile] Error deleting link:', deleteLinkError);
      return { success: false, error: 'Failed to delete link' };
    }

    console.log('[deleteMediaFile] Link deleted successfully');

    const { data: remainingLinks, error: checkLinksError } = await supabase
      .from('media_links')
      .select('id')
      .eq('media_file_id', mediaFileId)
      .limit(1);

    if (checkLinksError) {
      console.error('[deleteMediaFile] Error checking remaining links:', checkLinksError);
      return { success: true, deletedFileFromStorage: false };
    }

    if (!remainingLinks || remainingLinks.length === 0) {
      const { data: fileData, error: fileFetchError } = await supabase
        .from('media_files')
        .select('file_path, bucket, is_deleted')
        .eq('id', mediaFileId)
        .single();

      if (fileFetchError) {
        console.error('[deleteMediaFile] Error fetching file data:', fileFetchError);
        return { success: true, deletedFileFromStorage: false };
      }

      if (fileData && !fileData.is_deleted) {
        const { error: softDeleteError } = await supabase
          .from('media_files')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', mediaFileId);

        if (softDeleteError) {
          console.error('[deleteMediaFile] Error soft deleting file:', softDeleteError);
        }

        const { error: storageError } = await supabase.storage
          .from(fileData.bucket)
          .remove([fileData.file_path]);

        if (storageError) {
          console.error('[deleteMediaFile] Error removing from storage:', storageError);
          return { success: true, deletedFileFromStorage: false };
        }

        console.log('[deleteMediaFile] File removed from storage successfully');
        return { success: true, deletedFileFromStorage: true };
      }
    }

    return { success: true, deletedFileFromStorage: false };

  } catch (error) {
    console.error('[deleteMediaFile] Unexpected error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
