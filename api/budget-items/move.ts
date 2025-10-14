// api/budget-items/move.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Esta función corre en Vercel como Serverless Function (Node.js)
// Maneja /api/budget-items/move
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    // Esperamos Authorization: Bearer <access_token_del_usuario>
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Cliente admin pero aplicando el token del usuario para que las RLS se respeten
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // POST /api/budget-items/move - Mover item con RPC
    const { budget_id, item_id, prev_item_id, next_item_id } = req.body;

    if (!budget_id || !item_id) {
      return res.status(400).json({ error: "budget_id and item_id are required" });
    }

    const { data, error } = await supabase.rpc('budget_item_move', {
      p_budget_id: budget_id,
      p_item_id: item_id,
      p_prev_item_id: prev_item_id || null,
      p_next_item_id: next_item_id || null
    });

    if (error) {
      console.error("Error moving budget item:", error);
      return res.status(500).json({ error: "Failed to move budget item" });
    }

    return res.status(200).json({ success: true, data });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
