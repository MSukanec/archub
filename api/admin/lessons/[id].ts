// api/admin/lessons/[id].ts
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

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
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
