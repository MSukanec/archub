import type { Request, Response } from 'express';
import { extractToken, requireUser, HttpError, createAuthenticatedClient } from '../../lib/auth/helpers.js';
import { getActiveUsers } from '../../lib/handlers/community/getActiveUsers.js';
import { getOrganizations } from '../../lib/handlers/community/getOrganizations.js';
import { getProjects } from '../../lib/handlers/community/getProjects.js';
import { getStats } from '../../lib/handlers/community/getStats.js';

export async function handleGetActiveUsers(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx = { supabase };
    const result = await getActiveUsers(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetActiveUsers:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch active users' });
  }
}

export async function handleGetOrganizations(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx = { supabase };
    const result = await getOrganizations(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetOrganizations:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch organizations' });
  }
}

export async function handleGetProjects(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx = { supabase };
    const result = await getProjects(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetProjects:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
}

export async function handleGetStats(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx = { supabase };
    const result = await getStats(ctx);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in handleGetStats:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch community stats' });
  }
}
