import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityHandlerContext {
  supabase: SupabaseClient;
}

export interface CommunityOrganization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export type GetOrganizationsResult =
  | { success: true; data: CommunityOrganization[] }
  | { success: false; error: string };

export async function getOrganizations(
  ctx: CommunityHandlerContext
): Promise<GetOrganizationsResult> {
  try {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, logo_url, created_at')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return {
      success: true,
      data: data as CommunityOrganization[]
    };
  } catch (error: any) {
    console.error('Error in getOrganizations handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community organizations'
    };
  }
}
