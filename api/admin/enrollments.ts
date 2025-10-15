// api/admin/enrollments.ts
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

    if (req.method === "GET") {
      // GET /api/admin/enrollments?course_id=xxx
      const { course_id } = req.query;

      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          users!inner(id, full_name, email),
          courses!inner(id, title)
        `)
        .order('started_at', { ascending: false });
      
      if (course_id) {
        query = query.eq('course_id', course_id);
      }

      const { data: enrollments, error } = await query;

      if (error) {
        console.error("Error fetching enrollments:", error);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }

      return res.status(200).json(enrollments);

    } else if (req.method === "POST") {
      // POST /api/admin/enrollments - Create new enrollment
      const enrollmentData = req.body;

      const { data: enrollment, error } = await supabase
        .from('course_enrollments')
        .insert(enrollmentData)
        .select()
        .single();

      if (error) {
        console.error("Error creating enrollment:", error);
        return res.status(500).json({ error: "Failed to create enrollment" });
      }

      return res.status(200).json(enrollment);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
