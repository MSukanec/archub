// api/budget-items/move.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { moveBudgetItem } from "../_lib/handlers/projects/budgetItems.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    const { budget_id, item_id, prev_item_id, next_item_id } = req.body;

    if (!budget_id || !item_id) {
      return res.status(400).json({ error: "budget_id and item_id are required" });
    }

    const ctx = { supabase };
    const params = {
      budgetId: budget_id,
      itemId: item_id,
      prevItemId: prev_item_id || null,
      nextItemId: next_item_id || null
    };
    const result = await moveBudgetItem(ctx, params);

    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (err: any) {
    console.error("Error in /api/budget-items/move:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
