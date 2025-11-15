import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import {
  listEnrollments,
  updateEnrollment,
  deleteEnrollment
} from "../../lib/handlers/admin/enrollments.js";

export async function getEnrollments(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { course_id } = req.query;
    
    const result = await listEnrollments(
      ctx,
      course_id ? { course_id: course_id as string } : undefined
    );
    
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

export async function patchEnrollment(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await updateEnrollment(ctx, { id }, req.body);
    
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

export async function removeEnrollment(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await deleteEnrollment(ctx, { id });
    
    return result.success 
      ? res.json({ success: true })
      : res.status(500).json({ error: result.error });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
