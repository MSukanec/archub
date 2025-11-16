import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listClients,
  getClientsSummary,
  getClient,
  createClient as createClientHandler,
  updateClient,
  deleteClient,
  type ListClientsParams,
  type GetClientsSummaryParams,
  type GetClientParams,
  type CreateClientParams,
  type UpdateClientParams,
  type DeleteClientParams
} from '../../lib/handlers/projects/projectClients.js';
import type { ProjectsContext } from '../../lib/handlers/projects/shared.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
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

export async function handleListClients(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListClientsParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listClients(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listClients controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list clients' });
  }
}

export async function handleGetClientsSummary(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetClientsSummaryParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await getClientsSummary(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getClientsSummary controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get clients summary' });
  }
}

export async function handleGetClient(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetClientParams = {
      projectId: req.params.projectId,
      clientId: req.params.clientId,
      organizationId: req.query.organization_id as string
    };

    const result = await getClient(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      const status = result.error.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getClient controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get client' });
  }
}

export async function handleCreateClient(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateClientParams = {
      projectId: req.params.projectId,
      organizationId: req.body.organization_id,
      clientData: {
        contact_id: req.body.contact_id,
        committed_amount: req.body.committed_amount,
        currency_id: req.body.currency_id,
        unit: req.body.unit,
        exchange_rate: req.body.exchange_rate,
        client_role_id: req.body.client_role_id,
        status: req.body.status,
        is_primary: req.body.is_primary,
        notes: req.body.notes
      }
    };

    const result = await createClientHandler(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createClient controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create client' });
  }
}

export async function handleUpdateClient(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateClientParams = {
      projectId: req.params.projectId,
      clientId: req.params.clientId,
      organizationId: req.body.organization_id,
      clientData: {
        unit: req.body.unit,
        committed_amount: req.body.committed_amount,
        currency_id: req.body.currency_id,
        exchange_rate: req.body.exchange_rate,
        client_role_id: req.body.client_role_id,
        status: req.body.status,
        is_primary: req.body.is_primary,
        notes: req.body.notes
      }
    };

    const result = await updateClient(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateClient controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update client' });
  }
}

export async function handleDeleteClient(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteClientParams = {
      projectId: req.params.projectId,
      clientId: req.params.clientId,
      organizationId: req.query.organization_id as string
    };

    const result = await deleteClient(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteClient controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete client' });
  }
}
