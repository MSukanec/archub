// api/current-user.ts
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

    // ---- Opción 1 (recomendada): usar tu RPC que ya tenías en Replit
    //    Cambia 'get_user' si tu RPC se llama distinto.
    let { data: userData, error } = await supabase.rpc("get_user");

    // ---- Opción 2 (alternativa): si no tienes RPC, lee directo de la tabla
    // const { data: userData, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!userData) return res.status(404).json({ error: "User not found" });

    return res.status(200).json(userData);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
