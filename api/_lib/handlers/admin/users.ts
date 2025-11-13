// api/_lib/handlers/admin/users.ts
// Admin user management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all users with stats and filtering
 */
export async function listUsers(
  ctx: AdminContext,
  params?: { 
    search?: string;
    sortBy?: string;
    statusFilter?: string;
  }
): Promise<AdminHandlerResult> {
  try {
    const searchValue = params?.search || '';
    const sortBy = params?.sortBy || 'created_at';
    const statusFilter = params?.statusFilter || 'all';
    
    // Build query
    let query = ctx.supabase
      .from('users')
      .select(`
        *,
        user_data (
          first_name,
          last_name,
          country
        )
      `);
    
    // Apply filters
    if (searchValue) {
      query = query.or(`full_name.ilike.%${searchValue}%,email.ilike.%${searchValue}%`);
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('is_active', statusFilter === 'active');
    }
    
    // Apply sorting
    if (sortBy === 'name') {
      query = query.order('full_name', { ascending: true });
    } else if (sortBy === 'email') {
      query = query.order('email', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error: usersError } = await query;
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return error("Failed to fetch users");
    }
    
    // Get user presence data
    const userIds = data.map(u => u.id);
    
    const { data: presenceData } = await ctx.supabase
      .from('user_presence')
      .select('user_id, last_seen_at')
      .in('user_id', userIds);
    
    // Create presence map using user.id as key
    const presenceMap = new Map(presenceData?.map(p => [p.user_id, p.last_seen_at]) ?? []);
    
    // Get organization counts for each user
    const usersWithCounts = await Promise.all(
      data.map(async (user) => {
        const { count } = await ctx.supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        return {
          ...user,
          organizations_count: count || 0,
          last_seen_at: presenceMap.get(user.id) || null
        };
      })
    );
    
    // Sort by last activity (most recent first)
    const sortedUsers = usersWithCounts.sort((a, b) => {
      if (!a.last_seen_at && !b.last_seen_at) return 0;
      if (!a.last_seen_at) return 1;
      if (!b.last_seen_at) return -1;
      return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
    });
    
    return success(sortedUsers);
  } catch (err: any) {
    console.error('listUsers error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update user (primarily for deactivation)
 */
export async function updateUser(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    const { is_active } = updates;
    
    const { data: user, error: dbError } = await ctx.supabase
      .from('users')
      .update({ is_active })
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating user:', dbError);
      return error("Failed to update user");
    }

    return success(user);
  } catch (err: any) {
    console.error('updateUser error:', err);
    return error(err.message || "Internal error");
  }
}
