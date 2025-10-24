// api/admin/enrollments.ts
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

      // Fetch progress for all enrollments in parallel
      const enrollmentsWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          // Get all modules for the course
          const { data: modules } = await supabase
            .from('course_modules')
            .select('id')
            .eq('course_id', enrollment.course_id);
          
          if (!modules || modules.length === 0) {
            return {
              ...enrollment,
              progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
            };
          }
          
          const moduleIds = modules.map(m => m.id);
          
          // Get all lessons for these modules
          const { data: lessons } = await supabase
            .from('course_lessons')
            .select('id')
            .in('module_id', moduleIds);
          
          if (!lessons || lessons.length === 0) {
            return {
              ...enrollment,
              progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
            };
          }
          
          const lessonIds = lessons.map(l => l.id);
          const total_lessons = lessons.length;
          
          // Get completed lessons for this user
          const { data: progressData } = await supabase
            .from('course_lesson_progress')
            .select('id, is_completed')
            .eq('user_id', enrollment.user_id)
            .in('lesson_id', lessonIds)
            .eq('is_completed', true);
          
          const completed_lessons = progressData?.length || 0;
          const progress_percentage = total_lessons > 0 
            ? Math.round((completed_lessons / total_lessons) * 100) 
            : 0;
          
          return {
            ...enrollment,
            progress: { 
              completed_lessons, 
              total_lessons, 
              progress_percentage 
            }
          };
        })
      );

      return res.status(200).json(enrollmentsWithProgress);

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
