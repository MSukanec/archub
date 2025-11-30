import { SupabaseClient } from '@supabase/supabase-js';

interface PlanLimits {
  max_projects: number;
  max_members: number;
}

interface ApplyLimitsResult {
  success: boolean;
  error?: string;
  projectsMarked: number;
  membersMarked: number;
  details: {
    totalProjects: number;
    totalMembers: number;
    projectLimit: number;
    memberLimit: number;
    projectsOverLimit: string[];
    membersOverLimit: string[];
  };
}

export async function getPlanLimitsFromDB(
  supabase: SupabaseClient,
  planId: string
): Promise<PlanLimits> {
  const { data: plan, error } = await supabase
    .from('plans')
    .select('max_projects, max_members')
    .eq('id', planId)
    .single();

  if (error || !plan) {
    console.error('[PlanLimits] Error fetching plan limits from DB:', error);
    return { max_projects: 2, max_members: 1 };
  }

  return {
    max_projects: plan.max_projects ?? -1,
    max_members: plan.max_members ?? -1,
  };
}

export async function getPlanLimitsByName(
  supabase: SupabaseClient,
  planName: string
): Promise<PlanLimits> {
  const normalizedName = planName?.toLowerCase() || 'free';
  
  const { data: plan, error } = await supabase
    .from('plans')
    .select('max_projects, max_members')
    .ilike('name', normalizedName)
    .single();

  if (error || !plan) {
    console.error('[PlanLimits] Error fetching plan limits by name from DB:', error, 'planName:', planName);
    return { max_projects: 2, max_members: 1 };
  }

  return {
    max_projects: plan.max_projects ?? -1,
    max_members: plan.max_members ?? -1,
  };
}

export async function applyPlanLimits(
  supabase: SupabaseClient,
  organizationId: string,
  newPlanName: string
): Promise<ApplyLimitsResult> {
  const result: ApplyLimitsResult = {
    success: false,
    projectsMarked: 0,
    membersMarked: 0,
    details: {
      totalProjects: 0,
      totalMembers: 0,
      projectLimit: 0,
      memberLimit: 0,
      projectsOverLimit: [],
      membersOverLimit: [],
    },
  };

  try {
    const limits = await getPlanLimitsByName(supabase, newPlanName);
    result.details.projectLimit = limits.max_projects === -1 ? Infinity : limits.max_projects;
    result.details.memberLimit = limits.max_members === -1 ? Infinity : limits.max_members;

    console.log(`[PlanLimits] Applying limits for org ${organizationId} to plan ${newPlanName}:`, limits);

    let projectIdsToMark: string[] = [];
    let memberIdsToMark: string[] = [];
    let allProjectIds: string[] = [];
    let allMemberIds: string[] = [];

    if (limits.max_projects !== -1) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (projectsError) {
        result.error = `Error fetching projects: ${projectsError.message}`;
        return result;
      }

      result.details.totalProjects = projects?.length || 0;
      allProjectIds = projects?.map(p => p.id) || [];

      if (projects && projects.length > limits.max_projects) {
        const projectsToMark = projects.slice(limits.max_projects);
        projectIdsToMark = projectsToMark.map(p => p.id);
        result.details.projectsOverLimit = projectsToMark.map(p => p.name);
      }
    } else {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .eq('is_active', true);
      
      result.details.totalProjects = projects?.length || 0;
      allProjectIds = projects?.map(p => p.id) || [];
    }

    if (limits.max_members !== -1) {
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          joined_at,
          role_id,
          roles!left (name)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) {
        result.error = `Error fetching members: ${membersError.message}`;
        return result;
      }

      result.details.totalMembers = members?.length || 0;
      allMemberIds = members?.map(m => m.id) || [];

      if (members && members.length > limits.max_members) {
        const adminMembers = members.filter((m: any) => 
          m.roles?.name?.toLowerCase() === 'admin' || 
          m.roles?.name?.toLowerCase() === 'owner'
        );
        const nonAdminMembers = members.filter((m: any) => 
          m.roles?.name?.toLowerCase() !== 'admin' && 
          m.roles?.name?.toLowerCase() !== 'owner'
        );

        const sortedMembers = [...adminMembers, ...nonAdminMembers];
        const membersToMark = sortedMembers.slice(limits.max_members);
        memberIdsToMark = membersToMark.map(m => m.id);
        result.details.membersOverLimit = memberIdsToMark;
      }
    } else {
      const { data: members } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      result.details.totalMembers = members?.length || 0;
      allMemberIds = members?.map(m => m.id) || [];
    }

    if (allProjectIds.length > 0) {
      const projectIdsToKeepActive = allProjectIds.filter(id => !projectIdsToMark.includes(id));
      
      if (projectIdsToKeepActive.length > 0) {
        const { error: resetActiveError } = await supabase
          .from('projects')
          .update({ is_over_limit: false })
          .in('id', projectIdsToKeepActive);

        if (resetActiveError) {
          result.error = `Error resetting active projects: ${resetActiveError.message}`;
          return result;
        }
      }

      if (projectIdsToMark.length > 0) {
        const { error: markError } = await supabase
          .from('projects')
          .update({ is_over_limit: true })
          .in('id', projectIdsToMark);

        if (markError) {
          result.error = `Error marking projects over limit: ${markError.message}`;
          return result;
        }
        
        result.projectsMarked = projectIdsToMark.length;
        console.log(`[PlanLimits] Marked ${projectIdsToMark.length} projects as over-limit`);
      }
    }

    if (allMemberIds.length > 0) {
      const memberIdsToKeepActive = allMemberIds.filter(id => !memberIdsToMark.includes(id));
      
      if (memberIdsToKeepActive.length > 0) {
        const { error: resetActiveError } = await supabase
          .from('organization_members')
          .update({ is_over_limit: false })
          .in('id', memberIdsToKeepActive);

        if (resetActiveError) {
          result.error = `Error resetting active members: ${resetActiveError.message}`;
          return result;
        }
      }

      if (memberIdsToMark.length > 0) {
        const { error: markError } = await supabase
          .from('organization_members')
          .update({ is_over_limit: true })
          .in('id', memberIdsToMark);

        if (markError) {
          result.error = `Error marking members over limit: ${markError.message}`;
          return result;
        }

        result.membersMarked = memberIdsToMark.length;
        console.log(`[PlanLimits] Marked ${memberIdsToMark.length} members as over-limit`);
      }
    }

    result.success = true;
    console.log(`[PlanLimits] Successfully applied limits for org ${organizationId}:`, {
      projectsMarked: result.projectsMarked,
      membersMarked: result.membersMarked,
    });

    return result;

  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
    console.error('[PlanLimits] Unexpected error:', error);
    return result;
  }
}

interface LimitStatusResult {
  success: boolean;
  error?: string;
  planName: string;
  limits: PlanLimits;
  usage: {
    projects: { total: number; active: number; overLimit: number };
    members: { total: number; active: number; overLimit: number };
  };
  overLimitResources: {
    projects: Array<{ id: string; name: string; created_at: string }>;
    members: Array<{ id: string; user_id: string; email?: string; joined_at: string }>;
  };
}

const emptyLimitStatusResult: LimitStatusResult = {
  success: false,
  planName: 'unknown',
  limits: { max_projects: 0, max_members: 0 },
  usage: {
    projects: { total: 0, active: 0, overLimit: 0 },
    members: { total: 0, active: 0, overLimit: 0 },
  },
  overLimitResources: { projects: [], members: [] },
};

export async function getOrganizationLimitStatus(
  supabase: SupabaseClient,
  organizationId: string
): Promise<LimitStatusResult> {
  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan_id, plans!left (id, name, max_projects, max_members)')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return {
        ...emptyLimitStatusResult,
        error: `Organization not found: ${orgError?.message}`,
      };
    }

    const planData = (org as any).plans;
    const planName = planData?.name || 'Free';
    
    const limits: PlanLimits = {
      max_projects: planData?.max_projects ?? 2,
      max_members: planData?.max_members ?? 1,
    };

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, created_at, is_over_limit, is_active')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);

    if (projectsError) {
      return {
        ...emptyLimitStatusResult,
        planName,
        limits,
        error: `Error fetching projects: ${projectsError.message}`,
      };
    }

    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        id, 
        user_id, 
        joined_at, 
        is_over_limit, 
        is_active,
        users!left (email)
      `)
      .eq('organization_id', organizationId);

    if (membersError) {
      return {
        ...emptyLimitStatusResult,
        planName,
        limits,
        error: `Error fetching members: ${membersError.message}`,
      };
    }

    const activeProjects = projects?.filter(p => p.is_active) || [];
    const overLimitProjects = projects?.filter(p => p.is_over_limit) || [];
    
    const activeMembers = members?.filter(m => m.is_active) || [];
    const overLimitMembers = members?.filter(m => m.is_over_limit) || [];

    return {
      success: true,
      planName,
      limits: {
        max_projects: limits.max_projects === -1 ? Infinity : limits.max_projects,
        max_members: limits.max_members === -1 ? Infinity : limits.max_members,
      },
      usage: {
        projects: {
          total: projects?.length || 0,
          active: activeProjects.length,
          overLimit: overLimitProjects.length,
        },
        members: {
          total: members?.length || 0,
          active: activeMembers.length,
          overLimit: overLimitMembers.length,
        },
      },
      overLimitResources: {
        projects: overLimitProjects.map(p => ({
          id: p.id,
          name: p.name,
          created_at: p.created_at,
        })),
        members: overLimitMembers.map(m => ({
          id: m.id,
          user_id: m.user_id,
          email: (m as any).users?.email,
          joined_at: m.joined_at,
        })),
      },
    };

  } catch (error: any) {
    return {
      ...emptyLimitStatusResult,
      error: `Unexpected error: ${error.message}`,
    };
  }
}

export async function updateResourceOverLimitStatus(
  supabase: SupabaseClient,
  resourceType: 'project' | 'member',
  resourceId: string,
  isOverLimit: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = resourceType === 'project' ? 'projects' : 'organization_members';
    
    const { error } = await supabase
      .from(table)
      .update({ is_over_limit: isOverLimit })
      .eq('id', resourceId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
