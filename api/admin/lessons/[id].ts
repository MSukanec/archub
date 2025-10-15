// api/admin/lessons/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Lesson ID is required" });
    }

    if (req.method === "GET") {
      // GET /api/admin/lessons/[id] - Get single lesson
      const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching lesson:", error);
        return res.status(500).json({ error: "Failed to fetch lesson" });
      }

      return res.status(200).json(lesson);

    } else if (req.method === "PATCH") {
      // PATCH /api/admin/lessons/[id] - Update lesson
      const updates = req.body;

      const { data: lesson, error } = await supabase
        .from('course_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating lesson:", error);
        return res.status(500).json({ error: "Failed to update lesson" });
      }

      return res.status(200).json(lesson);

    } else if (req.method === "DELETE") {
      // DELETE /api/admin/lessons/[id] - Delete lesson
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting lesson:", error);
        return res.status(500).json({ error: "Failed to delete lesson" });
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
