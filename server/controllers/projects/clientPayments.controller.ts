import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listClientPayments,
  createClientPayment,
  updateClientPayment,
  deleteClientPayment,
  getClientPaymentAttachments,
  type ListClientPaymentsParams,
  type CreateClientPaymentParams,
  type UpdateClientPaymentParams,
  type DeleteClientPaymentParams,
  type GetClientPaymentAttachmentsParams
} from '../../lib/handlers/projects/clientPayments.js';
import { getProjectPaymentMetrics } from '../../lib/services/paymentsMetrics.js';
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

export async function handleListClientPayments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListClientPaymentsParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listClientPayments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listClientPayments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list client payments' });
  }
}

export async function handleCreateClientPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateClientPaymentParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string,
      paymentData: req.body
    };

    const result = await createClientPayment(ctx, params);

    if (result.success) {
      return res.status(201).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createClientPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create client payment' });
  }
}

export async function handleUpdateClientPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateClientPaymentParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string,
      paymentData: req.body
    };

    const result = await updateClientPayment(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateClientPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update client payment' });
  }
}

export async function handleDeleteClientPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteClientPaymentParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string
    };

    const result = await deleteClientPayment(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteClientPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete client payment' });
  }
}

export async function handleGetClientPaymentsMetrics(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);

    const projectId = req.params.projectId;
    const organizationId = req.query.organization_id as string;

    if (!projectId || !organizationId) {
      return res.status(400).json({ error: 'projectId and organization_id are required' });
    }

    const metrics = await getProjectPaymentMetrics(supabase, projectId, organizationId);

    return res.status(200).json({ data: metrics });
  } catch (error: any) {
    console.error('Error in getClientPaymentsMetrics controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get payment metrics' });
  }
}

export async function handleGetClientPaymentAttachments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetClientPaymentAttachmentsParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string
    };

    const result = await getClientPaymentAttachments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getClientPaymentAttachments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get payment attachments' });
  }
}
