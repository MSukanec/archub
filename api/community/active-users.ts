// api/community/active-users.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { extractToken, requireUser } from '../_lib/auth-helpers.js';
import { getActiveUsers } from '../_lib/handlers/community/getActiveUsers.js';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);

    const ctx = { sql };
    const result = await getActiveUsers(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (error: any) {
    console.error('Error in community active users endpoint:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
