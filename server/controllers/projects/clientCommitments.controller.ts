import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listClientCommitments,
  createClientCommitment,
  updateClientCommitment,
  deleteClientCommitment,
  type ListClientCommitmentsParams,
  type CreateClientCommitmentParams,
  type UpdateClientCommitmentParams,
  type DeleteClientCommitmentParams
} from '../../lib/handlers/projects/clientCommitments.js';
import type { ProjectsContext } from '../../lib/handlers/projects/shared.js';
import { supabaseUrl, supabaseAnonKey } from '../../routes/_base.js';

function createAuthenticatedClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleListClientCommitments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListClientCommitmentsParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listClientCommitments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listClientCommitments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list client commitments' });
  }
}

export async function handleCreateClientCommitment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateClientCommitmentParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string,
      commitmentData: req.body
    };

    const result = await createClientCommitment(ctx, params);

    if (result.success) {
      return res.status(201).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createClientCommitment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create client commitment' });
  }
}

export async function handleUpdateClientCommitment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateClientCommitmentParams = {
      projectId: req.params.projectId,
      commitmentId: req.params.commitmentId,
      organizationId: req.query.organization_id as string,
      commitmentData: req.body
    };

    const result = await updateClientCommitment(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateClientCommitment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update client commitment' });
  }
}

export async function handleDeleteClientCommitment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteClientCommitmentParams = {
      projectId: req.params.projectId,
      commitmentId: req.params.commitmentId,
      organizationId: req.query.organization_id as string
    };

    const result = await deleteClientCommitment(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteClientCommitment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete client commitment' });
  }
}
