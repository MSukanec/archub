import { apiRequest } from '@/lib/queryClient';

export async function deleteSubcontract(
  subcontractId: string,
  organizationId: string
): Promise<void> {
  const response = await apiRequest(
    'DELETE', 
    `/api/subcontracts/${subcontractId}?organizationId=${organizationId}`
  );

  if (response.ok) {
    const result = await response.json();
    if (!result.success) {
      throw new Error('Delete operation failed');
    }
    return;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to delete subcontract');
}
