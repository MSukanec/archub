// api/budget-items/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { updateBudgetItem, deleteBudgetItem } from "../lib/handlers/projects/budgetItems.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Budget item ID is required" });
    }

    const ctx = { supabase };

    if (req.method === "PATCH") {
      const params = {
        itemId: id,
        ...req.body
      };
      const result = await updateBudgetItem(ctx, params);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }

    } else if (req.method === "DELETE") {
      const params = { itemId: id };
      const result = await deleteBudgetItem(ctx, params);

      if (result.success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: result.error });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error in /api/budget-items/[id]:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
