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
      status,
      labor_type_id,
      created_at,
      contact:contacts(
        id,
        first_name,
        last_name,
        full_name,
        organization_id
      ),
      labor_type:labor_types(
        id,
        name
      )
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project personnel:', error);
    throw error;
  }

  return (data as unknown as ProjectPersonnel[]) || [];
}
