import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  createSubcontract,
  updateSubcontract,
  deleteSubcontract,
  type CreateSubcontractParams,
  type UpdateSubcontractParams,
  type DeleteSubcontractParams,
} from '../../lib/handlers/subcontracts/subcontracts.js';
import type { SubcontractsContext } from '../../lib/handlers/subcontracts/shared.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleCreateSubcontract(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: SubcontractsContext = { supabase };

    const params: CreateSubcontractParams = {
      organization_id: req.body.organization_id,
      project_id: req.body.project_id,
      title: req.body.title,
      date: req.body.date,
      code: req.body.code,
      contact_id: req.body.contact_id,
      currency_id: req.body.currency_id,
      amount_total: req.body.amount_total,
      exchange_rate: req.body.exchange_rate,
      status: req.body.status,
      notes: req.body.notes,
    };

    const result = await createSubcontract(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createSubcontract controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create subcontract' });
  }
}

export async function handleUpdateSubcontract(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: SubcontractsContext = { supabase };

    const params: UpdateSubcontractParams = {
      subcontractId: req.params.id,
      title: req.body.title,
      date: req.body.date,
      code: req.body.code,
      contact_id: req.body.contact_id,
      currency_id: req.body.currency_id,
      amount_total: req.body.amount_total,
      exchange_rate: req.body.exchange_rate,
      status: req.body.status,
      notes: req.body.notes,
      organization_id: req.body.organization_id,
    };

    const result = await updateSubcontract(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateSubcontract controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update subcontract' });
  }
}

export async function handleDeleteSubcontract(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: SubcontractsContext = { supabase };

    const params: DeleteSubcontractParams = {
      subcontractId: req.params.id,
      organizationId: req.query.organizationId as string,
    };

    const result = await deleteSubcontract(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteSubcontract controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete subcontract' });
  }
}
