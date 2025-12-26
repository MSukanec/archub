import { supabase } from '@/lib/supabase';
import type { ProjectPersonnel } from '../types';

export async function getPersonnelDetail(personnelId: string): Promise<ProjectPersonnel | null> {
  if (!supabase || !personnelId) {
    return null;
  }

  const { data, error } = await supabase
    .from('project_personnel')
    .select(`
      id,
      notes,
      start_date,
      end_date,
      status,
      labor_type_id,
      project_id,
      contact:contacts(
        id,
        first_name,
        last_name,
        full_name
      )
    `)
    .eq('id', personnelId)
    .single();

  if (error) {
    console.error('Error fetching personnel detail:', error);
    throw error;
  }

  return data as unknown as ProjectPersonnel;
}
