import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

export async function listOrganizations(
  ctx: AdminContext
): Promise<AdminHandlerResult> {
  try {
    // Get all organizations
    const { data: organizations, error: orgsError } = await ctx.supabase
      .from('organizations')
      .select('id, name, created_at, is_active, is_system, plan_id, created_by, settings')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (orgsError) throw orgsError;

    if (!organizations || organizations.length === 0) {
      return success([]);
    }

    // Get all plans and creators in batch
    const planIds = Array.from(new Set(organizations.map(o => o.plan_id).filter(Boolean)));
    const creatorIds = Array.from(new Set(organizations.map(o => o.created_by).filter(Boolean)));

    const [plansResult, usersResult, membersResult, projectsResult, activityResult] = await Promise.all([
      planIds.length > 0 ? ctx.supabase.from('plans').select('id, name').in('id', planIds) : { data: [], error: null },
      creatorIds.length > 0 ? ctx.supabase.from('users').select('id, full_name, email, avatar_url').in('id', creatorIds) : { data: [], error: null },
      ctx.supabase.from('organization_members').select('organization_id').in('organization_id', organizations.map(o => o.id)),
      ctx.supabase.from('projects').select('organization_id').in('organization_id', organizations.map(o => o.id)),
      ctx.supabase.from('user_presence').select('org_id, last_seen_at').in('org_id', organizations.map(o => o.id)).order('last_seen_at', { ascending: false })
    ]);

    // Build count maps
    const membersCounts: Record<string, number> = {};
    const projectsCounts: Record<string, number> = {};
    const lastActivity: Record<string, string> = {};

    membersResult.data?.forEach(m => {
      membersCounts[m.organization_id] = (membersCounts[m.organization_id] || 0) + 1;
    });

    projectsResult.data?.forEach(p => {
      projectsCounts[p.organization_id] = (projectsCounts[p.organization_id] || 0) + 1;
    });

    activityResult.data?.forEach(a => {
      if (!lastActivity[a.org_id]) {
        lastActivity[a.org_id] = a.last_seen_at;
      }
    });

    // Enrich organizations with all data
    const enriched = organizations.map(org => ({
      ...org,
      plan: plansResult.data?.find(p => p.id === org.plan_id) || null,
      creator: usersResult.data?.find(u => u.id === org.created_by) || null,
      members_count: membersCounts[org.id] || 0,
      projects_count: projectsCounts[org.id] || 0,
      last_seen_at: lastActivity[org.id] || null
    }));

    // Sort by last activity
    enriched.sort((a, b) => {
      if (!a.last_seen_at && !b.last_seen_at) return 0;
      if (!a.last_seen_at) return 1;
      if (!b.last_seen_at) return -1;
      return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
    });

    return success(enriched);
  } catch (err: any) {
    console.error('listOrganizations error:', err);
    return error(err.message || "Internal error");
  }
}
