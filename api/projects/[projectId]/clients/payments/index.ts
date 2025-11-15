import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractToken, getUserFromToken } from '../../../../lib/auth-helpers.js';
import { getClientPayments } from '../../../../lib/handlers/projects/clientPayments.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    const organizationId = Array.isArray(req.query.organization_id) 
      ? req.query.organization_id[0] 
      : req.query.organization_id;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'Invalid projectId' });
    }

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'Invalid organizationId' });
    }

    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { supabase } = userResult;

    const result = await getClientPayments(
      { supabase },
      { projectId, organizationId }
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result.data);
  } catch (error: any) {
    console.error('Error in payments endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
