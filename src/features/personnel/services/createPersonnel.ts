import { apiRequest } from '@/lib/queryClient';

export interface CreatePersonnelData {
  organization_id: string;
  project_id: string;
  contact_id: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string | null;
}

export async function createPersonnel(data: CreatePersonnelData): Promise<any> {
  const response = await apiRequest('POST', '/api/personnel', {
    organization_id: data.organization_id,
    project_id: data.project_id,
    contact_id: data.contact_id,
    notes: data.notes || '',
    start_date: data.start_date,
    end_date: data.end_date,
    created_by: data.created_by || null,
  });

  if (response.ok) {
    return await response.json();
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to create personnel');
}
