// api/budgets/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Esta función corre en Vercel como Serverless Function (Node.js)
// Maneja /api/budgets/:id
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

    // Obtener el ID del presupuesto de los query params
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Budget ID is required" });
    }

    // Manejo de diferentes métodos HTTP
    if (req.method === "PATCH") {
      // PATCH /api/budgets/:id - Actualizar presupuesto
      const updateData = req.body;

      const { data: budget, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating budget:", error);
        return res.status(500).json({ error: "Failed to update budget" });
      }

      return res.status(200).json(budget);

    } else if (req.method === "DELETE") {
      // DELETE /api/budgets/:id - Eliminar presupuesto
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting budget:", error);
        return res.status(500).json({ error: "Failed to delete budget" });
      }

      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
