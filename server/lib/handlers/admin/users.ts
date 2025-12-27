// api/lib/handlers/admin/users.ts
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
    
    // Build query - includes user_acquisition for tracking origin
    let query = ctx.supabase
      .from('users')
      .select(`
        *,
        user_data (
          first_name,
          last_name,
          country
        ),
        user_acquisition (
          source,
          medium,
          campaign,
          content,
          landing_page,
          referrer
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
        
        // Extract first acquisition record (there should only be one per user)
        const acquisition = Array.isArray(user.user_acquisition) 
          ? user.user_acquisition[0] 
          : user.user_acquisition;
        
        return {
          ...user,
          organizations_count: count || 0,
          last_seen_at: presenceMap.get(user.id) || null,
          acquisition: acquisition || null
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
 * Get recently registered users with their organization and acquisition data
 */
export async function getRecentlyRegisteredUsers(
  ctx: AdminContext,
  params?: { limit?: number }
): Promise<AdminHandlerResult> {
  try {
    const limit = params?.limit || 10;
    
    // Fetch recently registered users with acquisition data
    const { data: users, error: usersError } = await ctx.supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        created_at,
        user_acquisition (
          source,
          medium,
          campaign
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (usersError) {
      console.error('Error fetching recent users:', usersError);
      return error("Failed to fetch recent users");
    }
    
    if (!users || users.length === 0) {
      return success([]);
    }
    
    // Get organizations for each user via organization_members
    const userIds = users.map(u => u.id);
    const { data: memberships } = await ctx.supabase
      .from('organization_members')
      .select('user_id, organization:organizations(name)')
      .in('user_id', userIds);
    
    // Create map of user -> organization name
    const userOrgMap = new Map<string, string>();
    memberships?.forEach((m: any) => {
      if (!userOrgMap.has(m.user_id) && m.organization?.name) {
        userOrgMap.set(m.user_id, m.organization.name);
      }
    });
    
    // Map users with organization and acquisition
    const result = users.map(user => {
      const acquisition = Array.isArray(user.user_acquisition) 
        ? user.user_acquisition[0] 
        : user.user_acquisition;
      
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        organization_name: userOrgMap.get(user.id) || null,
        acquisition: acquisition || null
      };
    });
    
    return success(result);
  } catch (err: any) {
    console.error('getRecentlyRegisteredUsers error:', err);
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
