import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listMaterialPurchases,
  getMaterialPurchaseById,
  createMaterialPurchase,
  updateMaterialPurchase,
  deleteMaterialPurchase,
  getMaterialPurchaseAttachments,
  type ListMaterialPurchasesParams,
  type GetMaterialPurchaseByIdParams,
  type CreateMaterialPurchaseParams,
  type UpdateMaterialPurchaseParams,
  type DeleteMaterialPurchaseParams,
  type GetMaterialPurchaseAttachmentsParams
} from '../../lib/handlers/projects/materialPurchases.js';
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

export async function handleListMaterialPurchases(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListMaterialPurchasesParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listMaterialPurchases(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listMaterialPurchases controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list material purchases' });
  }
}

export async function handleGetMaterialPurchase(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetMaterialPurchaseByIdParams = {
      projectId: req.params.projectId,
      purchaseId: req.params.purchaseId,
      organizationId: req.query.organization_id as string
    };

    const result = await getMaterialPurchaseById(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getMaterialPurchase controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get material purchase' });
  }
}

export async function handleCreateMaterialPurchase(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { purchase_date, subtotal, currency_id, ...restBody } = req.body;
    
    if (!purchase_date) {
      return res.status(400).json({ error: 'purchase_date is required' });
    }
    if (subtotal === undefined || subtotal < 0) {
      return res.status(400).json({ error: 'subtotal is required and must be >= 0' });
    }
    if (!currency_id) {
      return res.status(400).json({ error: 'currency_id is required' });
    }
    
    if (restBody.status) {
      const validStatuses = ['pending', 'partially_paid', 'paid', 'cancelled'];
      if (!validStatuses.includes(restBody.status)) {
        return res.status(400).json({ error: 'status must be one of: pending, partially_paid, paid, cancelled' });
      }
    }

    if (restBody.document_type) {
      const validDocTypes = ['invoice', 'receipt', 'ticket', 'other'];
      if (!validDocTypes.includes(restBody.document_type)) {
        return res.status(400).json({ error: 'document_type must be one of: invoice, receipt, ticket, other' });
      }
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateMaterialPurchaseParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string,
      purchaseData: {
        purchase_date,
        subtotal,
        currency_id,
        ...restBody
      }
    };

    const result = await createMaterialPurchase(ctx, params);

    if (result.success) {
      return res.status(201).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createMaterialPurchase controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create material purchase' });
  }
}

export async function handleUpdateMaterialPurchase(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { status, document_type, ...restBody } = req.body;
    
    if (status !== undefined) {
      const validStatuses = ['pending', 'partially_paid', 'paid', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'status must be one of: pending, partially_paid, paid, cancelled' });
      }
    }

    if (document_type !== undefined) {
      const validDocTypes = ['invoice', 'receipt', 'ticket', 'other'];
      if (!validDocTypes.includes(document_type)) {
        return res.status(400).json({ error: 'document_type must be one of: invoice, receipt, ticket, other' });
      }
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateMaterialPurchaseParams = {
      projectId: req.params.projectId,
      purchaseId: req.params.purchaseId,
      organizationId: req.query.organization_id as string,
      purchaseData: status !== undefined || document_type !== undefined 
        ? { ...restBody, status, document_type } 
        : restBody
    };

    const result = await updateMaterialPurchase(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateMaterialPurchase controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update material purchase' });
  }
}

export async function handleDeleteMaterialPurchase(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteMaterialPurchaseParams = {
      projectId: req.params.projectId,
      purchaseId: req.params.purchaseId,
      organizationId: req.query.organization_id as string
    };

    const result = await deleteMaterialPurchase(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteMaterialPurchase controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete material purchase' });
  }
}

export async function handleGetMaterialPurchaseAttachments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetMaterialPurchaseAttachmentsParams = {
      projectId: req.params.projectId,
      purchaseId: req.params.purchaseId,
      organizationId: req.query.organization_id as string
    };

    const result = await getMaterialPurchaseAttachments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getMaterialPurchaseAttachments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get purchase attachments' });
  }
}
