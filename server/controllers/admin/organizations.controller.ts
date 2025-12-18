import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import { listOrganizations } from "../../lib/handlers/admin/organizations.js";

export async function getOrganizations(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const result = await listOrganizations(ctx);
    
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
