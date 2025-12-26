import { apiRequest } from '@/lib/queryClient';
import type { PinBoard } from '../types';
export async function getBoards(projectId?: string): Promise<PinBoard[]> {
  const params = new URLSearchParams();
  
  if (projectId) {
    params.append('project_id', projectId);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/api/pin-boards?${queryString}` : '/api/pin-boards';
  
  const response = await apiRequest('GET', url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch boards');
  }
  
  const data = await response.json();
  
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data;
}
