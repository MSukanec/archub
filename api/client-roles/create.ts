import { VercelRequest, VercelResponse } from '@vercel/node';
import { extractToken, createAuthenticatedClient } from '../lib/auth-helpers';
import { createClientRole } from '../_lib/handlers/clients/createClientRole';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const { name, organization_id } = req.body;

    if (!name || !organization_id) {
      return res.status(400).json({ error: 'name and organization_id are required' });
    }

    const role = await createClientRole({ supabase }, { name, organization_id });
    return res.status(201).json(role);
  } catch (error: any) {
    console.error('Error creating client role:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
