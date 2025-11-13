// api/_lib/handlers/community/getStats.ts
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface CommunityHandlerContext {
  sql: NeonQueryFunction<false, false>;
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
    const { sql } = ctx;

    const [stats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as "totalOrganizations",
        (SELECT COUNT(*) FROM projects) as "totalProjects",
        (SELECT COUNT(DISTINCT user_id) FROM organization_members) as "totalMembers"
    `;

    return {
      success: true,
      data: {
        totalOrganizations: Number(stats.totalOrganizations) || 0,
        totalProjects: Number(stats.totalProjects) || 0,
        totalMembers: Number(stats.totalMembers) || 0
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
