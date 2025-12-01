import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";

export async function getSubscriptions(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const { data, error } = await supabaseAdmin
      .from("organization_subscriptions")
      .select(`
        id,
        organization_id,
        plan_id,
        status,
        billing_period,
        started_at,
        expires_at,
        cancelled_at,
        amount,
        currency,
        organizations(name),
        plans(name, slug)
      `)
      .order("started_at", { ascending: false });
    
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
