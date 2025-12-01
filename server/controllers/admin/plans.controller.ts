import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";

export async function getPlans(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    // Get plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from("plans")
      .select(`
        id,
        name,
        slug,
        is_active,
        billing_type,
        features
      `)
      .order("name", { ascending: true });
    
    if (plansError) {
      console.error('[Admin Plans] Error fetching plans:', plansError);
      return res.status(500).json({ error: plansError.message });
    }

    if (!plans || plans.length === 0) {
      return res.json([]);
    }

    // Get plan IDs
    const planIds = plans.map(p => p.id);

    // Fetch plan_prices separately
    const { data: prices } = await supabaseAdmin
      .from("plan_prices")
      .select("plan_id, currency_code, monthly_amount, annual_amount, provider, is_active")
      .in("plan_id", planIds);

    // Group prices by plan_id
    const pricesMap: Record<string, any[]> = {};
    if (prices) {
      for (const price of prices) {
        if (!pricesMap[price.plan_id]) {
          pricesMap[price.plan_id] = [];
        }
        pricesMap[price.plan_id].push({
          currency_code: price.currency_code,
          monthly_amount: price.monthly_amount,
          annual_amount: price.annual_amount,
          provider: price.provider,
          is_active: price.is_active
        });
      }
    }

    // Combine data
    const result = plans.map(plan => ({
      ...plan,
      plan_prices: pricesMap[plan.id] || []
    }));
    
    return res.json(result);
  } catch (error: any) {
    console.error('[Admin Plans] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
