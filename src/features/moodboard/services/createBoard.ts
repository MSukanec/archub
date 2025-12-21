import { apiRequest } from '@/lib/queryClient';
import type { PinBoard } from '../types';

export interface CreateBoardInput {
  name: string;
  description?: string | null;
  project_id: string;
}

export async function createBoard(input: CreateBoardInput): Promise<PinBoard> {
  const response = await apiRequest('POST', '/api/pin-boards', input);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create board');
  }
  
  return response.json();
}
