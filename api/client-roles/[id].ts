import { VercelRequest, VercelResponse } from '@vercel/node';
import { extractToken, createAuthenticatedClient } from '../_lib/auth-helpers';
import { updateClientRole } from '../_lib/handlers/clients/updateClientRole';
import { deleteClientRole } from '../_lib/handlers/clients/deleteClientRole';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid role ID' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);

    if (req.method === 'PATCH') {
      const { name, organization_id } = req.body;

      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' });
      }

      const role = await updateClientRole({ supabase }, id, organization_id, { name });
      return res.status(200).json(role);
    }

    if (req.method === 'DELETE') {
      const { organization_id } = req.query;

      if (!organization_id || typeof organization_id !== 'string') {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      await deleteClientRole({ supabase }, id, organization_id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling client role:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
