import type { Express, Request, Response } from "express";
import type { RouteDeps } from "./_base";
import { supabaseAdmin } from "../lib/supabase/admin.js";

async function handleDeleteGeneralCost(req: Request, res: Response) {
  try {
    const { generalCostId } = req.params;

    if (!generalCostId) {
      return res.status(400).json({ error: 'General cost ID is required' });
    }

    const { error } = await supabaseAdmin
      .from('general_costs')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', generalCostId);

    if (error) {
      console.error('Error deleting general cost:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: generalCostId });
  } catch (error: any) {
    console.error('Error in handleDeleteGeneralCost:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleDeleteGeneralCostCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    const { organizationId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const { error } = await supabaseAdmin
      .from('general_cost_categories')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting general cost category:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: categoryId });
  } catch (error: any) {
    console.error('Error in handleDeleteGeneralCostCategory:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export function registerGeneralCostsRoutes(app: Express, deps: RouteDeps): void {
  app.delete("/api/general-costs/:generalCostId", handleDeleteGeneralCost);
  app.delete("/api/general-cost-categories/:categoryId", handleDeleteGeneralCostCategory);
}
