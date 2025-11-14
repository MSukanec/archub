import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetClientRoles } from './_lib/handlers/clients/getClientRoles.js';
import { extractToken, createAuthenticatedClient } from './lib/auth-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const organizationId = req.query.organization_id as string;

    const result = await handleGetClientRoles(
      { organizationId },
      supabase
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result.data);
  } catch (error: any) {
    console.error('Error in /api/client-roles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
