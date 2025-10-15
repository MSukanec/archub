// api/admin/lessons.ts
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
      // GET /api/admin/lessons?module_id=xxx
      const { module_id } = req.query;

      let query = supabase.from('course_lessons').select('*').order('sort_index', { ascending: true });
      
      if (module_id) {
        query = query.eq('module_id', module_id);
      }

      const { data: lessons, error } = await query;

      if (error) {
        console.error("Error fetching lessons:", error);
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }

      return res.status(200).json(lessons);

    } else if (req.method === "POST") {
      // POST /api/admin/lessons - Create new lesson
      const lessonData = req.body;

      const { data: lesson, error } = await supabase
        .from('course_lessons')
        .insert(lessonData)
        .select()
        .single();

      if (error) {
        console.error("Error creating lesson:", error);
        return res.status(500).json({ error: "Failed to create lesson" });
      }

      return res.status(200).json(lesson);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
