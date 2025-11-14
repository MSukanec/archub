import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetClientRoles } from './lib/handlers/clients/getClientRoles.js';
import { createClientRole } from './lib/handlers/clients/createClientRole.js';
import { extractToken, getUserFromToken } from './lib/auth-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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

    // Get organization_id from user preferences (server-side, not from request)
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences?.last_organization_id) {
      return res.status(400).json({ error: 'User must belong to an organization' });
    }

    const organizationId = preferences.last_organization_id;

    // CRITICAL: Verify user is an active member of this organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'User is not a member of this organization' });
    }

    if (!membership.is_active) {
      return res.status(403).json({ error: 'User membership is not active' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      const result = await handleGetClientRoles(
        { organizationId },
        supabase
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    }

    // Handle POST request
    if (req.method === 'POST') {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const role = await createClientRole({ supabase }, { name, organization_id: organizationId });
      return res.status(201).json(role);
    }
  } catch (error: any) {
    console.error('Error in /api/client-roles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
