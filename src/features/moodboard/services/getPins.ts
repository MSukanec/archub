import { apiRequest } from '@/lib/queryClient';
import type { Pin } from '../types';

export async function getPins(): Promise<Pin[]> {
  const url = `/api/pins`;
  
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
