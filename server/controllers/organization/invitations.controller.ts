import type { Request, Response } from 'express';
import { extractToken, requireUser, HttpError } from '../../lib/auth/helpers.js';
import { getPendingInvitations } from '../../lib/handlers/organization/getPendingInvitations.js';
import { acceptInvitation } from '../../lib/handlers/organization/acceptInvitation.js';
import { rejectInvitation } from '../../lib/handlers/organization/rejectInvitation.js';
import { inviteMember } from '../../lib/handlers/organization/inviteMember.js';

export async function handleGetPendingInvitations(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { userId: requestedUserId } = req.params;

    // Ensure users can only fetch their own invitations
    if (requestedUserId !== userId) {
      return res.status(403).json({ error: 'Cannot access another user\'s invitations' });
    }

    const invitations = await getPendingInvitations(supabase, userId);

    return res.status(200).json(invitations);
  } catch (error: any) {
    console.error('Error in handleGetPendingInvitations:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch pending invitations' });
  }
}

export async function handleAcceptInvitation(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const result = await acceptInvitation(supabase, userId, invitationId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in handleAcceptInvitation:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
}

export async function handleRejectInvitation(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const result = await rejectInvitation(supabase, userId, invitationId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in handleRejectInvitation:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to reject invitation' });
  }
}

export async function handleInviteMember(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { email, roleId, organizationId } = req.body;

    console.log('[inviteMember] Request received:', { email, roleId, organizationId, userId });

    if (!email || !roleId || !organizationId) {
      console.log('[inviteMember] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: email, roleId, organizationId' });
    }

    const ctx = { supabase };
    const params = {
      email,
      roleId,
      organizationId,
      userId
    };

    const result = await inviteMember(ctx, params);

    console.log('[inviteMember] Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      console.log('[inviteMember] Returning 400 with error:', result.error);
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleInviteMember:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to invite member' });
  }
}
