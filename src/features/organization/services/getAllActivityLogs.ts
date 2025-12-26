import { supabase } from '@/lib/supabase';
export interface AdminActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
    image_bucket?: string;
    image_path?: string;
  };
}
export async function getAllActivityLogs(
  organizationId?: string | null
): Promise<AdminActivityLog[]> {
  console.log('Fetching all activity logs', organizationId ? `for org: ${organizationId}` : '');
  let query = supabase
    .from('organization_activity_logs')
    .select(`
      id,
      organization_id,
      user_id,
      action,
      target_table,
      target_id,
      metadata,
      created_at,
      users (
        id,
        full_name,
        avatar_url,
        email
      ),
      organizations (
        id,
        name,
        image_bucket,
        image_path
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching all activity logs:', error);
    return [];
  }
  console.log('Activity logs fetched:', data?.length || 0);
  
  return data?.map((log: any) => ({
    ...log,
    user: Array.isArray(log.users) ? log.users[0] : log.users,
    organization: Array.isArray(log.organizations) ? log.organizations[0] : log.organizations
  })) as AdminActivityLog[] || [];
}
export async function getOrganizationsForFilter(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('is_deleted', false)
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching organizations for filter:', error);
    return [];
  }
  return data || [];
}
