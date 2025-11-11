// api/learning/dashboard-fast.ts - Optimized dashboard endpoint
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
        .maybeSingle();
      
      if (!dbUser) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      // BULK QUERY 1: Get enrollments with course info
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, courses!inner(id, title, slug)')
        .eq('user_id', dbUser.id);
        
      if (!enrollments || enrollments.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const courseIds = enrollments.map(e => e.course_id);
      
      // BULK QUERY 2: Get ALL modules for these courses (NO JOINS)
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id, course_id, title')
        .in('course_id', courseIds);
      
      if (!modules || modules.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const moduleIds = modules.map(m => m.id);
      
      // BULK QUERY 3: Get ALL lessons for these modules (NO JOINS)
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, module_id, title, duration_sec, is_active')
        .in('module_id', moduleIds)
        .eq('is_active', true);
      
      if (!lessons || lessons.length === 0) {
        return res.json({
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        });
      }
      
      const lessonIds = lessons.map(l => l.id);
      
      // BULK QUERY 4: Get progress for ALL lessons (NO JOINS - just user_id and lesson IDs)
      const { data: progressData } = await supabase
        .from('course_lesson_progress')
        .select('lesson_id, is_completed, completed_at, last_position_sec')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds);
      
      
      // CREATE LOOKUP MAPS for in-memory combination
      const moduleMap = new Map(modules.map(m => [m.id, m]));
      const lessonMap = new Map(lessons.map(l => [l.id, l]));
      const progressMap = new Map((progressData || []).map(p => [p.lesson_id, p]));
      
      // Initialize course progress tracking
      const progressByCourse = new Map();
      const completedLessons: any[] = [];
      let totalCompleted = 0;
      let totalLessons = 0;
      let totalStudyTime = 0;
      const activeDaysSet = new Set();
      
      // Initialize courses with zero progress
      for (const enrollment of enrollments) {
        const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
        progressByCourse.set(enrollment.course_id, {
          completed: 0,
          total: 0,
          course_id: enrollment.course_id,
          title: course?.title,
          slug: course?.slug
        });
      }
      
      // Count lessons per course and calculate progress
      for (const lesson of lessons) {
        const module = moduleMap.get(lesson.module_id);
        if (!module) continue;
        
        const courseId = module.course_id;
        const courseProgress = progressByCourse.get(courseId);
        if (!courseProgress) continue;
        
        // Increment total lessons for this course
        courseProgress.total++;
        totalLessons++;
        
        // Check if this lesson is completed
        const progress = progressMap.get(lesson.id);
        if (progress) {
          // Track study time
          if (progress.last_position_sec) {
            totalStudyTime += progress.last_position_sec;
          }
          
          // Track completed lessons
          if (progress.is_completed) {
            courseProgress.completed++;
            totalCompleted++;
            
            // Track for recent completions
            if (progress.completed_at) {
              completedLessons.push({
                completed_at: progress.completed_at,
                lesson_title: lesson.title || 'Sin título',
                module_title: module.title || 'Sin módulo',
                course_title: courseProgress.title || 'Sin curso',
                course_slug: courseProgress.slug || ''
              });
              
              // Track active days
              const day = new Date(progress.completed_at).toISOString().slice(0, 10);
              activeDaysSet.add(day);
            }
          }
        }
      }
      
      // Format courses with progress
      const courses = Array.from(progressByCourse.values()).map(course => ({
        course_id: course.course_id,
        course_title: course.title || 'Sin título',
        course_slug: course.slug || '',
        progress_pct: course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0,
        done_lessons: course.completed,
        total_lessons: course.total
      }));
      
      // Calculate global progress
      const globalProgress = totalLessons > 0 ? {
        done_lessons_total: totalCompleted,
        total_lessons_total: totalLessons,
        progress_pct: Math.round((totalCompleted / totalLessons) * 100)
      } : null;
      
      // Sort and limit recent completions
      const recentCompletions = completedLessons
        .sort((a: any, b: any) => b.completed_at.localeCompare(a.completed_at))
        .slice(0, 10)
        .map((c: any) => ({
          type: 'completed',
          when: c.completed_at,
          ...c
        }));
      
      // Calculate current streak
      const sortedDays = Array.from(activeDaysSet).sort((a: any, b: any) => b.localeCompare(a));
      let currentStreak = 0;
      
      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (sortedDays[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Return optimized response
      return res.status(200).json({
        global: globalProgress,
        courses: courses,
        study: {
          seconds_lifetime: totalStudyTime,
          seconds_this_month: totalStudyTime
        },
        currentStreak,
        activeDays: activeDaysSet.size,
        recentCompletions
      });
      
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error fetching dashboard-fast data:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
}
