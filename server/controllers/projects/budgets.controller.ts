import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  type ListBudgetsParams,
  type CreateBudgetParams,
  type UpdateBudgetParams,
  type DeleteBudgetParams
} from '../../lib/handlers/projects/budgets.js';
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

export async function handleListBudgets(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListBudgetsParams = {
      projectId: req.query.project_id as string,
      organizationId: req.query.organization_id as string
    };

    const result = await listBudgets(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listBudgets controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list budgets' });
  }
}

export async function handleCreateBudget(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: CreateBudgetParams = req.body;

    const result = await createBudget(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in createBudget controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to create budget' });
  }
}

export async function handleUpdateBudget(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: UpdateBudgetParams = {
      budgetId: req.params.id,
      ...req.body
    };

    const result = await updateBudget(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in updateBudget controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to update budget' });
  }
}

export async function handleDeleteBudget(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: DeleteBudgetParams = {
      budgetId: req.params.id
    };

    const result = await deleteBudget(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in deleteBudget controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete budget' });
  }
}
