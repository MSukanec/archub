import { supabase } from '@/lib/supabase';
import type { ProjectPersonnel } from '../types';

export async function getProjectPersonnel(
  projectId: string,
  organizationId: string
): Promise<ProjectPersonnel[]> {
  if (!supabase || !projectId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_personnel')
    .select(`
      id,
      project_id,
      contact_id,
      notes,
      start_date,
      end_date,
      contact:contacts(
        id,
        first_name,
        last_name,
        organization_id
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project personnel:', error);
    throw error;
  }

  return (data as unknown as ProjectPersonnel[]) || [];
}
