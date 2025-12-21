import { apiRequest } from '@/lib/queryClient';
import type { Pin } from '../types';

export async function getPins(
  organizationId: string | undefined,
  projectId: string | undefined
): Promise<Pin[]> {
  if (!organizationId || !projectId) {
    return [];
  }

  const url = `/api/projects/${projectId}/pins`;
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch pins');
  }
  
  const data = await response.json();
  
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.sort((a: Pin, b: Pin) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
