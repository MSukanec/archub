// api/lib/handlers/community/getActiveUsers.ts
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface CommunityHandlerContext {
  sql: NeonQueryFunction<false, false>;
}

export interface ActiveUser {
  id: string;
  name: string;
  avatar_url: string | null;
  last_activity: string;
  current_page: string | null;
}

export type GetActiveUsersResult =
  | { success: true; data: ActiveUser[] }
  | { success: false; error: string };

/**
 * Calculate the timestamp for "5 minutes ago"
 */
function getFiveMinutesAgo(): string {
  return new Date(Date.now() - 5 * 60 * 1000).toISOString();
}

export async function getActiveUsers(
  ctx: CommunityHandlerContext
): Promise<GetActiveUsersResult> {
  try {
    const { sql } = ctx;
    const fiveMinutesAgo = getFiveMinutesAgo();

    const activeUsers = await sql`
      SELECT 
        u.id,
        COALESCE(u.full_name, u.first_name, 'Usuario') as name,
        u.avatar_url,
        up.last_activity,
        up.current_page
      FROM user_presence up
      JOIN users u ON u.id = up.user_id
      WHERE up.last_activity >= ${fiveMinutesAgo}
        AND up.is_online = true
      ORDER BY up.last_activity DESC
      LIMIT 50
    `;

    return {
      success: true,
      data: activeUsers as ActiveUser[]
    };
  } catch (error: any) {
    console.error('Error in getActiveUsers handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch active users'
    };
  }
}
