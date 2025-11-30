import type { Request, Response } from 'express';
import { createServiceSupabaseClient } from '../checkout/shared/auth.js';

interface PlanLimits {
  maxProjects: number;
  maxMembers: number;
}

interface UsageStats {
  projectsCount: number;
  membersCount: number;
  currentPlanLimits: PlanLimits;
  currentPlanName: string;
  targetPlanLimits?: PlanLimits;
  targetPlanName?: string;
}

export async function handleGetOrganizationUsageStats(req: Request, res: Response): Promise<void> {
  const { organizationId } = req.params;
  const targetPlanSlug = req.query.targetPlan as string | undefined;

  if (!organizationId) {
    res.status(400).json({ error: 'Organization ID is required' });
    return;
  }

  try {
    const supabase = createServiceSupabaseClient();

    const [projectsResult, membersResult, orgResult] = await Promise.all([
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_deleted', false),
      supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true),
      supabase
        .from('organizations')
        .select('plan_id, plans!left (name, features)')
        .eq('id', organizationId)
        .single()
    ]);

    if (projectsResult.error) {
      console.error('[UsageStats] Error counting projects:', projectsResult.error);
      res.status(500).json({ error: 'Failed to count projects' });
      return;
    }

    if (membersResult.error) {
      console.error('[UsageStats] Error counting members:', membersResult.error);
      res.status(500).json({ error: 'Failed to count members' });
      return;
    }

    const planData = (orgResult.data as any)?.plans;
    const currentPlanName = planData?.name || 'Free';
    const features = planData?.features || {};
    const currentMaxProjects = features.max_projects ?? 2;
    const currentMaxMembers = features.max_members ?? 1;

    const stats: UsageStats = {
      projectsCount: projectsResult.count ?? 0,
      membersCount: membersResult.count ?? 0,
      currentPlanName,
      currentPlanLimits: {
        maxProjects: currentMaxProjects === -1 ? Infinity : currentMaxProjects,
        maxMembers: currentMaxMembers === -1 ? Infinity : currentMaxMembers,
      },
    };

    if (targetPlanSlug) {
      const targetPlanResult = await supabase
        .from('plans')
        .select('name, features')
        .eq('slug', targetPlanSlug)
        .eq('is_active', true)
        .single();

      if (targetPlanResult.data) {
        const targetPlan = targetPlanResult.data;
        const targetFeatures = (targetPlan as any).features || {};
        stats.targetPlanName = targetPlan.name;
        stats.targetPlanLimits = {
          maxProjects: targetFeatures.max_projects === -1 ? Infinity : (targetFeatures.max_projects ?? 2),
          maxMembers: targetFeatures.max_members === -1 ? Infinity : (targetFeatures.max_members ?? 1),
        };
      }
    }

    res.json(stats);
  } catch (error) {
    console.error('[UsageStats] Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error fetching usage stats' });
  }
}
