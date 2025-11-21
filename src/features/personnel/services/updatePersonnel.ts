import { apiRequest } from '@/lib/queryClient';

export interface UpdatePersonnelData {
  organization_id: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export async function updatePersonnel(
  personnelId: string,
  data: UpdatePersonnelData
): Promise<any> {
  const response = await apiRequest('PATCH', `/api/personnel/${personnelId}`, {
    organization_id: data.organization_id,
    notes: data.notes,
    start_date: data.start_date,
    end_date: data.end_date,
  });

  if (response.ok) {
    return await response.json();
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to update personnel');
}
