import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";

export async function getPlans(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select(`
        id,
        name,
        slug,
        is_active,
        billing_type,
        features,
        plan_prices(currency_code, monthly_amount, annual_amount, provider, is_active)
      `)
      .order("name", { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.json(data);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
