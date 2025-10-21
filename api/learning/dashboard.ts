// api/learning/dashboard.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    if (req.method === "GET") {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (!dbUser) {
        return res.json({
          enrollments: [],
          progress: [],
          courseLessons: [],
          recentCompletions: []
        });
      }
      
      // Execute all queries in parallel for maximum speed
      const [enrollmentsResult, progressResult, courseLessonsResult, recentCompletionsResult] = await Promise.all([
        // Get enrollments with course slug
        supabase
          .from('course_enrollments')
          .select('*, courses(slug)')
          .eq('user_id', dbUser.id),
        
        // Get all progress
        supabase
          .from('course_lesson_progress')
          .select('*')
          .eq('user_id', dbUser.id),
        
        // Get all active course lessons with course info
        supabase
          .from('course_lessons')
          .select('id, module_id, course_modules!inner(course_id)')
          .eq('is_active', true),
        
        // Get recent completions (last 10) with lesson and course details
        supabase
          .from('course_lesson_progress')
          .select(`
            *,
            course_lessons!inner(
              id,
              title,
              course_modules!inner(
                id,
                title,
                course_id,
                courses!inner(
                  id,
                  title,
                  slug
                )
              )
            )
          `)
          .eq('user_id', dbUser.id)
          .eq('is_completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10)
      ]);
      
      // Check for errors
      if (enrollmentsResult.error) {
        console.error("Error fetching enrollments:", enrollmentsResult.error);
        throw enrollmentsResult.error;
      }
      
      if (progressResult.error) {
        console.error("Error fetching progress:", progressResult.error);
        throw progressResult.error;
      }
      
      if (courseLessonsResult.error) {
        console.error("Error fetching course lessons:", courseLessonsResult.error);
        throw courseLessonsResult.error;
      }
      
      if (recentCompletionsResult.error) {
        console.error("Error fetching recent completions:", recentCompletionsResult.error);
        throw recentCompletionsResult.error;
      }
      
      // Format enrollments to flatten course slug
      const formattedEnrollments = (enrollmentsResult.data || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      // Format recent completions to extract nested data
      const formattedCompletions = (recentCompletionsResult.data || []).map((completion: any) => {
        const lesson = completion.course_lessons;
        const module = lesson?.course_modules;
        const course = module?.courses;
        
        return {
          id: completion.id,
          completed_at: completion.completed_at,
          lesson_title: lesson?.title || 'Sin título',
          module_title: module?.title || 'Sin módulo',
          course_title: course?.title || 'Sin curso',
          course_slug: course?.slug || '',
          lesson_id: lesson?.id,
          module_id: module?.id,
          course_id: course?.id
        };
      });
      
      // Return consolidated data
      return res.status(200).json({
        enrollments: formattedEnrollments,
        progress: progressResult.data || [],
        courseLessons: courseLessonsResult.data || [],
        recentCompletions: formattedCompletions
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error fetching dashboard data:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
}
