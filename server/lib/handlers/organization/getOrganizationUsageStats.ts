import type { Request, Response } from 'express';
import { createServiceSupabaseClient } from '../checkout/shared/auth.js';

interface UsageStats {
  projectsCount: number;
  membersCount: number;
}

export async function handleGetOrganizationUsageStats(req: Request, res: Response): Promise<void> {
  const { organizationId } = req.params;

  if (!organizationId) {
    res.status(400).json({ error: 'Organization ID is required' });
    return;
  }

  try {
    const supabase = createServiceSupabaseClient();

    const [projectsResult, membersResult] = await Promise.all([
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
        .eq('is_active', true)
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

    const stats: UsageStats = {
      projectsCount: projectsResult.count ?? 0,
      membersCount: membersResult.count ?? 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('[UsageStats] Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error fetching usage stats' });
  }
}
