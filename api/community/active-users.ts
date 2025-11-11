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

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

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

    return res.status(200).json(activeUsers);

  } catch (error: any) {
    console.error('Error fetching active users:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
