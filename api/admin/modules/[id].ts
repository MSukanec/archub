// api/admin/modules/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, AuthError } from "../auth-helper";

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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Module ID is required" });
    }

    if (req.method === "GET") {
      // GET /api/admin/modules/[id] - Get single module
      const { data: module, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching module:", error);
        return res.status(500).json({ error: "Failed to fetch module" });
      }

      return res.status(200).json(module);

    } else if (req.method === "PATCH") {
      // PATCH /api/admin/modules/[id] - Update module
      const updates = req.body;

      const { data: module, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating module:", error);
        return res.status(500).json({ error: "Failed to update module" });
      }

      return res.status(200).json(module);

    } else if (req.method === "DELETE") {
      // DELETE /api/admin/modules/[id] - Delete module
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting module:", error);
        return res.status(500).json({ error: "Failed to delete module" });
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
