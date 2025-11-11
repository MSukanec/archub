import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { extractToken, requireUser } from '../_lib/auth-helpers';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);

    const [stats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as "totalOrganizations",
        (SELECT COUNT(*) FROM projects) as "totalProjects",
        (SELECT COUNT(DISTINCT user_id) FROM organization_members) as "totalMembers"
    `;

    return res.status(200).json({
      totalOrganizations: Number(stats.totalOrganizations) || 0,
      totalProjects: Number(stats.totalProjects) || 0,
      totalMembers: Number(stats.totalMembers) || 0
    });

  } catch (error: any) {
    console.error('Error fetching community stats:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
