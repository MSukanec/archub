// api/community/organizations.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { extractToken, requireUser, HttpError } from '../_lib/auth-helpers.js';
import { getOrganizations } from '../_lib/handlers/community/getOrganizations.js';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);

    const ctx = { sql };
    const result = await getOrganizations(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (error: any) {
    console.error('Error in community organizations endpoint:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
