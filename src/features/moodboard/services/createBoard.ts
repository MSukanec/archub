import { supabase } from '@/lib/supabase';
import type { PinBoard } from '../types';
export interface CreateBoardInput {
  name: string;
  description?: string | null;
  project_id: string;
}
export async function createBoard(input: CreateBoardInput): Promise<PinBoard> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch('/api/pin-boards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create board');
  }
  
  return response.json();
}
