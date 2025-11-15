import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  moveBudgetItem,
  type ListBudgetItemsParams,
  type CreateBudgetItemParams,
  type UpdateBudgetItemParams,
  type DeleteBudgetItemParams,
  type MoveBudgetItemParams
} from '../../lib/handlers/projects/budgetItems.js';
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

export async function handleListBudgetItems(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListBudgetItemsParams = {
      budgetId: req.query.budget_id as string,
      organizationId: req.query.organization_id as string
    };

    const result = await listBudgetItems(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listBudgetItems controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list budget items' });
  }
}

export async function handleCreateBudgetItem(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateBudgetItemParams = req.body;

    const result = await createBudgetItem(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createBudgetItem controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create budget item' });
  }
}

export async function handleUpdateBudgetItem(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateBudgetItemParams = {
      itemId: req.params.id,
      ...req.body
    };

    const result = await updateBudgetItem(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateBudgetItem controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update budget item' });
  }
}

export async function handleDeleteBudgetItem(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteBudgetItemParams = {
      itemId: req.params.id
    };

    const result = await deleteBudgetItem(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteBudgetItem controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete budget item' });
  }
}

export async function handleMoveBudgetItem(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: MoveBudgetItemParams = {
      budgetId: req.body.budgetId,
      itemId: req.body.itemId,
      prevItemId: req.body.prevItemId,
      nextItemId: req.body.nextItemId
    };

    const result = await moveBudgetItem(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in moveBudgetItem controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to move budget item' });
  }
}
