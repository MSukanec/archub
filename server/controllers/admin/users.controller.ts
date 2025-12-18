import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import { listUsers, updateUser, getRecentlyRegisteredUsers } from "../../lib/handlers/admin/users.js";

export async function getUsers(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { search, sortBy, statusFilter } = req.query;
    
    const result = await listUsers(ctx, {
      search: search as string,
      sortBy: sortBy as string,
      statusFilter: statusFilter as string,
    });
    
    return result.success 
      ? res.json(result.data)
      : res.status(500).json({ error: result.error });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function patchUser(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await updateUser(ctx, { id }, req.body);
    
    return result.success 
      ? res.json(result.data)
      : res.status(500).json({ error: result.error });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getRecentUsers(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await getRecentlyRegisteredUsers(ctx, { limit });
    
    return result.success 
      ? res.json(result.data)
      : res.status(500).json({ error: result.error });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
