// api/budgets.ts
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
      // GET /api/budgets?project_id=xxx&organization_id=yyy
      const { project_id, organization_id } = req.query;

      if (!project_id || !organization_id) {
        return res.status(400).json({ 
          error: "project_id and organization_id are required" 
        });
      }

      const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
          *,
          currency:currencies!currency_id(id, code, name, symbol)
        `)
        .eq('project_id', project_id)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching budgets:", error);
        return res.status(500).json({ error: "Failed to fetch budgets" });
      }

      // Calcular el total para cada presupuesto
      const budgetsWithTotals = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: items, error: itemsError } = await supabase
            .from('budget_items')
            .select(`
              unit_price, 
              quantity, 
              markup_pct, 
              tax_pct
            `)
            .eq('budget_id', budget.id);

          if (itemsError) {
            console.error(`Error fetching items for budget ${budget.id}:`, itemsError);
            return { ...budget, total: 0 };
          }

          let total = 0;

          // Calcular totales para cada item
          for (const item of items || []) {
            const quantity = item.quantity || 1;
            
            // Calcular el total del item (con markup y tax)
            const subtotal = (item.unit_price || 0) * quantity;
            const markupAmount = subtotal * ((item.markup_pct || 0) / 100);
            const taxableAmount = subtotal + markupAmount;
            const taxAmount = taxableAmount * ((item.tax_pct || 0) / 100);
            const itemTotal = taxableAmount + taxAmount;
            total += itemTotal;
          }

          return { 
            ...budget, 
            total
          };
        })
      );

      return res.status(200).json(budgetsWithTotals);

    } else if (req.method === "POST") {
      // POST /api/budgets - Crear nuevo presupuesto
      const budgetData = req.body;

      const { data: budget, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget:", error);
        return res.status(500).json({ error: "Failed to create budget" });
      }

      return res.status(200).json(budget);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
