import { apiRequest } from '@/lib/queryClient';

export async function deletePersonnel(
  personnelId: string,
  organizationId: string
): Promise<void> {
  const response = await apiRequest(
    'DELETE',
    `/api/personnel/${personnelId}?organizationId=${organizationId}`
  );

  if (response.ok) {
    const result = await response.json();
    if (!result.success) {
      throw new Error('Delete operation failed');
    }
    return;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to delete personnel');
}
