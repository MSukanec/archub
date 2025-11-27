import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listMaterialPayments,
  getMaterialPaymentById,
  createMaterialPayment,
  updateMaterialPayment,
  deleteMaterialPayment,
  getMaterialPaymentAttachments,
  type ListMaterialPaymentsParams,
  type GetMaterialPaymentByIdParams,
  type CreateMaterialPaymentParams,
  type UpdateMaterialPaymentParams,
  type DeleteMaterialPaymentParams,
  type GetMaterialPaymentAttachmentsParams
} from '../../lib/handlers/projects/materialPayments.js';
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

function getErrorStatusCode(error: string): number {
  const lowerError = error.toLowerCase();
  if (lowerError.includes('not found')) {
    return 404;
  }
  if (lowerError.includes('forbidden') || lowerError.includes('unauthorized')) {
    return 403;
  }
  return 400;
}

export async function handleListMaterialPayments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListMaterialPaymentsParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listMaterialPayments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listMaterialPayments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list material payments' });
  }
}

export async function handleGetMaterialPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetMaterialPaymentByIdParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string
    };

    const result = await getMaterialPaymentById(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getMaterialPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get material payment' });
  }
}

export async function handleCreateMaterialPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { amount, currency_id, payment_date, status, created_by: _stripCreatedBy, ...restBody } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount is required' });
    }
    if (!currency_id) {
      return res.status(400).json({ error: 'currency_id is required' });
    }
    if (!payment_date) {
      return res.status(400).json({ error: 'payment_date is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const validStatuses = ['confirmed', 'pending', 'rejected', 'void'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be one of: confirmed, pending, rejected, void' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };
    
    const sanitizedPaymentData = {
      amount,
      currency_id,
      payment_date,
      status,
      ...restBody
    };

    const params: CreateMaterialPaymentParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string,
      paymentData: sanitizedPaymentData
    };

    const result = await createMaterialPayment(ctx, params);

    if (result.success) {
      return res.status(201).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createMaterialPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create material payment' });
  }
}

export async function handleUpdateMaterialPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const updateFields = ['purchase_id', 'amount', 'currency_id', 'exchange_rate', 'payment_date', 'wallet_id', 'notes', 'reference', 'status'];
    const { created_by: _stripCreatedBy, status, ...restBody } = req.body;
    
    const hasAtLeastOneField = updateFields.some(field => req.body[field] !== undefined);
    if (!hasAtLeastOneField) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }
    
    if (status !== undefined) {
      const validStatuses = ['confirmed', 'pending', 'rejected', 'void'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'status must be one of: confirmed, pending, rejected, void' });
      }
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };
    
    const sanitizedPaymentData = status !== undefined 
      ? { ...restBody, status }
      : restBody;

    const params: UpdateMaterialPaymentParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string,
      paymentData: sanitizedPaymentData
    };

    const result = await updateMaterialPayment(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateMaterialPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update material payment' });
  }
}

export async function handleDeleteMaterialPayment(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteMaterialPaymentParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string
    };

    const result = await deleteMaterialPayment(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteMaterialPayment controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete material payment' });
  }
}

export async function handleGetMaterialPaymentAttachments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetMaterialPaymentAttachmentsParams = {
      projectId: req.params.projectId,
      paymentId: req.params.paymentId,
      organizationId: req.query.organization_id as string
    };

    const result = await getMaterialPaymentAttachments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getMaterialPaymentAttachments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get payment attachments' });
  }
}
