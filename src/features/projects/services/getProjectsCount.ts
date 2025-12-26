import { supabase } from '@/lib/supabase';

export async function getProjectsCount(organizationId: string): Promise<number> {
  if (!supabase || !organizationId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);
  
  if (error) {
    console.error('Error counting projects:', error);
    throw error;
  }
  
  return count || 0;
}
