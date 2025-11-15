import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import { 
  listCoupons,
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from "../../lib/handlers/admin/coupons.js";

export async function getCoupons(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const result = await listCoupons(ctx);
    
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

export async function postCoupon(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const result = await createCoupon(ctx, req.body);
    
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

export async function patchCoupon(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await updateCoupon(ctx, { id }, req.body);
    
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

export async function removeCoupon(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const ctx = { supabase: supabaseAdmin };
    const { id } = req.params;
    
    const result = await deleteCoupon(ctx, { id });
    
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
