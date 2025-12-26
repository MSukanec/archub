import { apiRequest } from '@/lib/queryClient';
export async function replacePersonnel(
  oldPersonnelId: string,
  newPersonnelId: string,
  organizationId: string
): Promise<{ oldId: string; newId: string }> {
  const response = await apiRequest(
    'PATCH',
    `/api/personnel/${oldPersonnelId}/replace?organizationId=${organizationId}`,
    {
      new_personnel_id: newPersonnelId,
    }
  );
  if (response.ok) {
    const result = await response.json();
    if (!result.success) {
      throw new Error('Replace operation failed');
    }
    return { oldId: oldPersonnelId, newId: newPersonnelId };
  }
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to replace personnel');
}
