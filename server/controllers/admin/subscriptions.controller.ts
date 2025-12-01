import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";

export async function getSubscriptions(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    // Get subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
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
        currency
      `)
      .order("started_at", { ascending: false });
    
    if (subError) {
      console.error('[Admin Subscriptions] Error fetching subscriptions:', subError);
      return res.status(500).json({ error: subError.message });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.json([]);
    }

    // Get unique org and plan IDs
    const orgIds = [...new Set(subscriptions.map(s => s.organization_id).filter(Boolean))];
    const planIds = [...new Set(subscriptions.map(s => s.plan_id).filter(Boolean))];

    // Fetch organizations
    let orgsMap: Record<string, { name: string }> = {};
    if (orgIds.length > 0) {
      const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);
      
      if (orgs) {
        orgsMap = Object.fromEntries(orgs.map(o => [o.id, { name: o.name }]));
      }
    }

    // Fetch plans
    let plansMap: Record<string, { name: string; slug: string }> = {};
    if (planIds.length > 0) {
      const { data: plans } = await supabaseAdmin
        .from("plans")
        .select("id, name, slug")
        .in("id", planIds);
      
      if (plans) {
        plansMap = Object.fromEntries(plans.map(p => [p.id, { name: p.name, slug: p.slug }]));
      }
    }

    // Combine data
    const result = subscriptions.map(sub => ({
      ...sub,
      organizations: orgsMap[sub.organization_id] || { name: 'Sin organización' },
      plans: plansMap[sub.plan_id] || { name: 'Sin plan', slug: '-' }
    }));
    
    return res.json(result);
  } catch (error: any) {
    console.error('[Admin Subscriptions] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
