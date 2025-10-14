// api/budget-items.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Esta función corre en Vercel como Serverless Function (Node.js)
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

    // Manejo de diferentes métodos HTTP
    if (req.method === "GET") {
      // GET /api/budget-items?budget_id=xxx&organization_id=yyy
      const { budget_id, organization_id } = req.query;

      if (!budget_id || !organization_id) {
        return res.status(400).json({ 
          error: "budget_id and organization_id are required" 
        });
      }

      const { data: budgetItems, error } = await supabase
        .from('budget_items_view')
        .select('*, position')
        .eq('budget_id', budget_id)
        .eq('organization_id', organization_id)
        .order('position', { ascending: true })
        .order('division_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching budget items:", error);
        return res.status(500).json({ error: "Failed to fetch budget items" });
      }

      return res.status(200).json(budgetItems || []);

    } else if (req.method === "POST") {
      // POST /api/budget-items - Crear nuevo item
      const budgetItemData = req.body;

      const { data: budgetItem, error } = await supabase
        .from('budget_items')
        .insert(budgetItemData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget item:", error);
        return res.status(500).json({ error: "Failed to create budget item" });
      }

      return res.status(200).json(budgetItem);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
