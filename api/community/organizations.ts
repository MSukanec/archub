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

    const organizations = await sql`
      SELECT 
        id,
        name,
        logo_url,
        created_at
      FROM organizations
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return res.status(200).json(organizations);

  } catch (error: any) {
    console.error('Error fetching community organizations:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
