import type { Request, Response } from 'express';
import { extractToken, requireUser, HttpError } from '../../lib/auth/helpers.js';
import { getOrganizationMembers } from '../../lib/handlers/organization/getOrganizationMembers.js';
import { removeMember } from '../../lib/handlers/organization/removeMember.js';

export async function handleGetOrganizationMembers(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const members = await getOrganizationMembers(supabase, organizationId, userId);

    return res.status(200).json(members);
  } catch (error: any) {
    console.error('Error in handleGetOrganizationMembers:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch organization members' });
  }
}

export async function handleRemoveMember(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      return res.status(400).json({ error: 'Organization ID and Member ID are required' });
    }

    const result = await removeMember(supabase, {
      organizationId,
      memberId,
      performedByUserId: userId,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in handleRemoveMember:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to remove member' });
  }
}
