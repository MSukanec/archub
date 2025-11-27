import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  type ListPurchaseOrdersParams,
  type GetPurchaseOrderByIdParams,
  type CreatePurchaseOrderParams,
  type UpdatePurchaseOrderParams,
  type DeletePurchaseOrderParams
} from '../../lib/handlers/projects/purchaseOrders.js';
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

export async function handleListPurchaseOrders(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListPurchaseOrdersParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string
    };

    const result = await listPurchaseOrders(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listPurchaseOrders controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list purchase orders' });
  }
}

export async function handleGetPurchaseOrder(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: GetPurchaseOrderByIdParams = {
      projectId: req.params.projectId,
      orderId: req.params.orderId,
      organizationId: req.query.organization_id as string
    };

    const result = await getPurchaseOrderById(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in getPurchaseOrder controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get purchase order' });
  }
}

export async function handleCreatePurchaseOrder(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { order_date, status, items, ...restBody } = req.body;
    
    if (!order_date) {
      return res.status(400).json({ error: 'order_date is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    const validStatuses = ['draft', 'sent', 'quoted', 'approved', 'rejected', 'converted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be one of: draft, sent, quoted, approved, rejected, converted' });
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description) {
        return res.status(400).json({ error: `Item ${i + 1}: description is required` });
      }
      if (items[i].quantity === undefined || items[i].quantity <= 0) {
        return res.status(400).json({ error: `Item ${i + 1}: quantity must be greater than 0` });
      }
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreatePurchaseOrderParams = {
      projectId: req.params.projectId,
      organizationId: req.query.organization_id as string,
      orderData: {
        order_date,
        status,
        ...restBody
      },
      items
    };

    const result = await createPurchaseOrder(ctx, params);

    if (result.success) {
      return res.status(201).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createPurchaseOrder controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create purchase order' });
  }
}

export async function handleUpdatePurchaseOrder(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { items, status, ...restBody } = req.body;
    
    if (status !== undefined) {
      const validStatuses = ['draft', 'sent', 'quoted', 'approved', 'rejected', 'converted'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'status must be one of: draft, sent, quoted, approved, rejected, converted' });
      }
    }

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array' });
      }
      for (let i = 0; i < items.length; i++) {
        if (!items[i].description) {
          return res.status(400).json({ error: `Item ${i + 1}: description is required` });
        }
        if (items[i].quantity === undefined || items[i].quantity <= 0) {
          return res.status(400).json({ error: `Item ${i + 1}: quantity must be greater than 0` });
        }
      }
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdatePurchaseOrderParams = {
      projectId: req.params.projectId,
      orderId: req.params.orderId,
      organizationId: req.query.organization_id as string,
      orderData: status !== undefined ? { ...restBody, status } : restBody,
      items
    };

    const result = await updatePurchaseOrder(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updatePurchaseOrder controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update purchase order' });
  }
}

export async function handleDeletePurchaseOrder(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeletePurchaseOrderParams = {
      projectId: req.params.projectId,
      orderId: req.params.orderId,
      organizationId: req.query.organization_id as string
    };

    const result = await deletePurchaseOrder(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      const statusCode = getErrorStatusCode(result.error);
      return res.status(statusCode).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deletePurchaseOrder controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
  }
}
