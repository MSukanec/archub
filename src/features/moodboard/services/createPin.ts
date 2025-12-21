import { supabase } from '@/lib/supabase';
import type { Pin } from '../types';

export interface CreatePinInput {
  title: string;
  source_url?: string;
  project_id: string;
  board_id?: string;
  file?: File;
}

export async function createPin(input: CreatePinInput): Promise<Pin & { board_id?: string }> {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('project_id', input.project_id);
  
  if (input.source_url) {
    formData.append('source_url', input.source_url);
  }
  if (input.board_id) {
    formData.append('board_id', input.board_id);
  }
  if (input.file) {
    formData.append('file', input.file);
  }
  
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch('/api/pins/create', {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create pin');
  }
  
  return response.json();
}
