import { apiRequest } from '@/lib/queryClient';
import type { Pin } from '../types';
export async function getPins(organizationId?: string, projectId?: string): Promise<Pin[]> {
  const params = new URLSearchParams();
  
  if (organizationId) {
    params.append('organization_id', organizationId);
  }
  if (projectId) {
    params.append('project_id', projectId);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/api/pins?${queryString}` : '/api/pins';
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch pins');
  }
  
  const data = await response.json();
  
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data;
}
