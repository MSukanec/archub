import { apiRequest } from '@/lib/queryClient';
export interface UpdatePersonnelData {
  organization_id: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'active'| 'inactive'| null;
  labor_type_id?: string | null;
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
    status: data.status,
    labor_type_id: data.labor_type_id,
  });
  if (response.ok) {
    return await response.json();
  }
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to update personnel');
}
