// api/admin/courses.ts
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

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    if (req.method === "GET") {
      // GET /api/admin/courses - Get all courses
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        return res.status(500).json({ error: "Failed to fetch courses" });
      }

      return res.status(200).json(courses);

    } else if (req.method === "POST") {
      // POST /api/admin/courses - Create new course
      const courseData = req.body;

      const { data: course, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) {
        console.error("Error creating course:", error);
        return res.status(500).json({ error: "Failed to create course" });
      }

      return res.status(200).json(course);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
