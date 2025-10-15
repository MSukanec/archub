// api/admin/modules.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, AuthError } from "./auth-helper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization || "";

    try {
      await verifyAdminUser(authHeader);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Internal error" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    if (req.method === "GET") {
      // GET /api/admin/modules?course_id=xxx
      const { course_id } = req.query;

      let query = supabase.from('course_modules').select('*').order('sort_index', { ascending: true });
      
      if (course_id) {
        query = query.eq('course_id', course_id);
      }

      const { data: modules, error } = await query;

      if (error) {
        console.error("Error fetching modules:", error);
        return res.status(500).json({ error: "Failed to fetch modules" });
      }

      return res.status(200).json(modules);

    } else if (req.method === "POST") {
      // POST /api/admin/modules - Create new module
      const moduleData = req.body;

      const { data: module, error } = await supabase
        .from('course_modules')
        .insert(moduleData)
        .select()
        .single();

      if (error) {
        console.error("Error creating module:", error);
        return res.status(500).json({ error: "Failed to create module" });
      }

      return res.status(200).json(module);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
