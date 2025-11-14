import { VercelRequest, VercelResponse } from '@vercel/node';
import { extractToken, getUserFromToken } from '../lib/auth-helpers.js';
import { updateClientRole } from '../lib/handlers/clients/updateClientRole.js';
import { deleteClientRole } from '../lib/handlers/clients/deleteClientRole.js';

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

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: 'User not found or invalid token' });
    }

    const { userId, supabase } = userResult;

    // Get organization_id from user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences?.last_organization_id) {
      return res.status(400).json({ error: 'User must belong to an organization' });
    }

    const organization_id = preferences.last_organization_id;

    // CRITICAL: Verify user is an active member of this organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', organization_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'User is not a member of this organization' });
    }

    if (!membership.is_active) {
      return res.status(403).json({ error: 'User membership is not active' });
    }

    if (req.method === 'PATCH') {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const role = await updateClientRole({ supabase }, id, organization_id, { name });
      return res.status(200).json(role);
    }

    if (req.method === 'DELETE') {
      await deleteClientRole({ supabase }, id, organization_id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling client role:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
