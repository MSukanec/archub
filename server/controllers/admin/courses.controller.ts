import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} from "../../lib/handlers/admin/courses.js";

export async function getCourses(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const result = await listCourses(ctx);
    
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

export async function getSingleCourse(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    const result = await getCourse(ctx, { id });
    
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

export async function postCourse(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const result = await createCourse(ctx, req.body);
    
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

export async function patchCourse(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await updateCourse(ctx, { id }, req.body);
    
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

export async function removeCourse(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await deleteCourse(ctx, { id });
    
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
