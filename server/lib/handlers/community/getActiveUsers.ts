import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityHandlerContext {
  supabase: SupabaseClient;
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

function getFiveMinutesAgo(): string {
  return new Date(Date.now() - 5 * 60 * 1000).toISOString();
}

export async function getActiveUsers(
  ctx: CommunityHandlerContext
): Promise<GetActiveUsersResult> {
  try {
    const { supabase } = ctx;
    const fiveMinutesAgo = getFiveMinutesAgo();

    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id, updated_at, current_view, status, users!inner(id, full_name, avatar_url)')
      .gte('updated_at', fiveMinutesAgo)
      .eq('status', 'online')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const activeUsers: ActiveUser[] = (data || []).map((item: any) => {
      const user = item.users;
      return {
        id: user.id,
        name: user.full_name || 'Usuario',
        avatar_url: user.avatar_url,
        last_activity: item.updated_at,
        current_page: item.current_view
      };
    });

    return {
      success: true,
      data: activeUsers
    };
  } catch (error: any) {
    console.error('Error in getActiveUsers handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch active users'
    };
  }
}
