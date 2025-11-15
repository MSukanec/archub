import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityHandlerContext {
  supabase: SupabaseClient;
}

export interface CommunityStats {
  totalOrganizations: number;
  totalProjects: number;
  totalMembers: number;
}

export type GetStatsResult =
  | { success: true; data: CommunityStats }
  | { success: false; error: string };

export async function getStats(
  ctx: CommunityHandlerContext
): Promise<GetStatsResult> {
  try {
    const { supabase } = ctx;

    const [orgResult, projectsResult, membersResult] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('organization_members').select('user_id', { count: 'exact', head: true })
    ]);

    if (orgResult.error) throw orgResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (membersResult.error) throw membersResult.error;

    return {
      success: true,
      data: {
        totalOrganizations: orgResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalMembers: membersResult.count || 0
      }
    };
  } catch (error: any) {
    console.error('Error in getStats handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community stats'
    };
  }
}
