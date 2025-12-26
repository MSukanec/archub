import { apiRequest } from '@/lib/queryClient';
export async function deleteMediaFileV2(linkId: string): Promise<void> {
  console.log('[deleteMediaFileV2] Calling backend endpoint with linkId:', linkId);
  
  const response = await apiRequest('POST', '/api/media/delete', { linkId });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete media file');
  }
  const result = await response.json();
  console.log('[deleteMediaFileV2] Delete successful:', result);
}
export async function deleteMultipleMediaFilesV2(linkIds: string[]): Promise<void> {
  if (!linkIds || linkIds.length === 0) {
    return;
  }
  await Promise.all(
    linkIds.map(linkId => deleteMediaFileV2(linkId))
  );
}
