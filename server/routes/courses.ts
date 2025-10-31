import type { Express } from "express";
import type { RouteDeps } from './_base';
import { extractToken, createAuthenticatedClient } from './_base';

/**
 * Register course-related endpoints (lessons progress, notes, enrollments, dashboard)
 * All endpoints require authentication as they handle user-specific data.
 */
export function registerCourseRoutes(app: Express, deps: RouteDeps): void {
  const { supabase } = deps;

  // ========== LESSON PROGRESS ENDPOINTS ==========

  // POST /api/lessons/:lessonId/progress - Mark lesson progress/complete
  app.post("/api/lessons/:lessonId/progress", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { progress_pct, last_position_sec, completed_at, is_completed } = req.body;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: existingUser, error: userLookupError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userLookupError || !existingUser) {
        console.error("User not found in users table:", user.id, userLookupError);
        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Use the CORRECT user_id from users table
      const dbUserId = existingUser.id;
      
      // Upsert progress
      // Auto-complete when progress >= 95%
      const normalizedProgress = progress_pct || 0;
      const shouldAutoComplete = normalizedProgress >= 95;
      const finalIsCompleted = is_completed !== undefined ? is_completed : shouldAutoComplete;
      const finalCompletedAt = (finalIsCompleted || shouldAutoComplete) ? (completed_at || new Date().toISOString()) : null;
      
      const { data, error } = await authenticatedSupabase
        .from('course_lesson_progress')
        .upsert({
          user_id: dbUserId,
          lesson_id: lessonId,
          progress_pct: normalizedProgress,
          last_position_sec: last_position_sec || 0,
          completed_at: finalCompletedAt,
          is_completed: finalIsCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error upserting lesson progress:", error);
        return res.status(500).json({ error: "Failed to update progress" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // GET /api/courses/:courseId/progress - Get all lesson progress for a course
  app.get("/api/courses/:courseId/progress", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Get all modules for the course
      const { data: modules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError || !modules) {
        console.error("Error fetching modules:", modulesError);
        return res.status(500).json({ error: "Failed to fetch course modules" });
      }
      
      const moduleIds = modules.map(m => m.id);
      
      if (moduleIds.length === 0) {
        return res.json([]);
      }
      
      // Get all lessons for these modules
      const { data: lessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);
      
      if (lessonsError || !lessons) {
        console.error("Error fetching lessons:", lessonsError);
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      const lessonIds = lessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json([]);
      }
      
      // Get progress for all lessons
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds);
      
      if (progressError) {
        console.error("Error fetching progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // ========== LESSON NOTES ENDPOINTS ==========

  // GET /api/lessons/:lessonId/notes - Get all notes for a lesson
  app.get("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: notes, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notes:", error);
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      res.json(notes || []);
    } catch (error) {
      console.error("Error fetching lesson notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // POST /api/lessons/:lessonId/notes - Create or update a lesson note
  app.post("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { body, time_sec, is_pinned } = req.body;
      
      if (body === undefined || typeof body !== 'string') {
        return res.status(400).json({ error: "Body must be a string" });
      }
      
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .is('time_sec', null)
        .single();
      
      let noteData;
      
      if (existingNote) {
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .update({
            body,
            is_pinned: is_pinned ?? false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating note:", error);
          return res.status(500).json({ error: "Failed to update note" });
        }
        
        noteData = data;
      } else {
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .insert({
            user_id: dbUser.id,
            lesson_id: lessonId,
            body,
            time_sec: time_sec || null,
            is_pinned: is_pinned ?? false
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating note:", error);
          return res.status(500).json({ error: "Failed to create note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      console.error("Error saving lesson note:", error);
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  // ========== USER PROGRESS ENDPOINTS ==========

  // GET /api/user/all-progress - Get all lesson progress for current user
  app.get("/api/user/all-progress", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Get all progress for this user
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id);
      
      if (progressError) {
        console.error("Error fetching user progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      console.log('📊 /api/user/all-progress returning:', JSON.stringify(progress, null, 2));
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // GET /api/user/enrollments - Get all course enrollments for current user
  app.get("/api/user/enrollments", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current auth user
      const { data: { user: authUser }, error: authUserError } = await authenticatedSupabase.auth.getUser();
      
      if (authUserError || !authUser || !authUser.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user record from the users table using auth_id
      const { data: userRecord, error: userRecordError } = await authenticatedSupabase
        .from('users')
        .select('id, email')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      
      if (userRecordError || !userRecord) {
        console.error("Error fetching user record:", userRecordError);
        return res.json([]);
      }
      
      // Get all enrollments for this user with course slug
      const { data: enrollments, error: enrollmentsError} = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(slug)')
        .eq('user_id', userRecord.id);
      
      if (enrollmentsError) {
        console.error("Error fetching user enrollments:", enrollmentsError);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Flatten the course slug
      const formattedEnrollments = (enrollments || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      res.json(formattedEnrollments);
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // ========== LEARNING DASHBOARD ENDPOINT ==========

  // GET /api/learning/dashboard - Consolidated endpoint for dashboard data
  app.get("/api/learning/dashboard", async (req, res) => {
    try {
      // Extract and validate token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json({
          enrollments: [],
          progress: [],
          courseLessons: [],
          recentCompletions: []
        });
      }
      
      // Get enrollments first (small query)
      const { data: enrollments, error: enrollmentsError } = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(id, slug, title)')
        .eq('user_id', dbUser.id);
      
      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
        throw enrollmentsError;
      }
      
      // If no enrollments, return early
      if (!enrollments || enrollments.length === 0) {
        return res.json({
          enrollments: [],
          courses: [],
          global: null,
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          recentCompletions: []
        });
      }
      
      // Get enrolled course IDs
      const courseIds = enrollments.map((e: any) => e.course_id);
      
      // Execute remaining queries in parallel, but ONLY for enrolled courses
      const [progressResult, courseLessonsResult, recentCompletionsResult] = await Promise.all([
        // Get all progress for this user
        authenticatedSupabase
          .from('course_lesson_progress')
          .select('*')
          .eq('user_id', dbUser.id),
        
        // Get ONLY lessons from enrolled courses (not ALL lessons!)
        authenticatedSupabase
          .from('course_lessons')
          .select('id, module_id, course_modules!inner(course_id)')
          .eq('is_active', true)
          .in('course_modules.course_id', courseIds),
        
        // Get recent completions using optimized view (much faster!)
        authenticatedSupabase
          .from('course_lesson_completions_view')
          .select('*')
          .eq('user_id', dbUser.id)
          .eq('is_completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10)
      ]);
      
      // Check for errors
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
      
      const progress = progressResult.data || [];
      const courseLessons = courseLessonsResult.data || [];
      
      // Calculate global progress
      const total_lessons_total = courseLessons.length;
      const done_lessons_total = progress.filter((p: any) => p.is_completed).length;
      const global_progress_pct = total_lessons_total > 0 
        ? Math.round((done_lessons_total / total_lessons_total) * 100) 
        : 0;
      
      // Calculate course-specific progress
      const courses = enrollments.map((enrollment: any) => {
        const courseId = enrollment.course_id;
        const lessons = courseLessons.filter((l: any) => l.course_modules?.course_id === courseId);
        const total_lessons = lessons.length;
        const lessonIds = lessons.map((l: any) => l.id);
        const done_lessons = progress.filter((p: any) => 
          p.is_completed && lessonIds.includes(p.lesson_id)
        ).length;
        const progress_pct = total_lessons > 0 
          ? Math.round((done_lessons / total_lessons) * 100) 
          : 0;
        
        return {
          course_id: courseId,
          course_title: enrollment.courses?.title || 'Sin título',
          course_slug: enrollment.courses?.slug || '',
          progress_pct,
          done_lessons,
          total_lessons
        };
      });
      
      // Calculate study time
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      let seconds_lifetime = 0;
      let seconds_this_month = 0;
      
      progress.forEach((p: any) => {
        const lastPos = p.last_position_sec || 0;
        seconds_lifetime += lastPos;
        
        const updateDate = new Date(p.updated_at);
        if (updateDate >= startOfMonth) {
          seconds_this_month += lastPos;
        }
      });
      
      // Calculate active days and streak
      const cutoffDate = new Date(Date.now() - 60 * 86400000);
      const daysSet = new Set<string>();
      
      progress.forEach((p: any) => {
        const updateDate = new Date(p.updated_at);
        if (updateDate >= cutoffDate) {
          const day = updateDate.toISOString().slice(0, 10);
          daysSet.add(day);
        }
      });
      
      // Calculate current streak
      const sortedDays = Array.from(daysSet).sort((a, b) => b.localeCompare(a));
      let currentStreak = 0;
      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (sortedDays[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Format recent completions (view already has flat structure!)
      const recentCompletions = (recentCompletionsResult.data || []).map((completion: any) => {
        return {
          type: 'completed',
          when: completion.completed_at,
          lesson_title: completion.lesson_title || 'Sin título',
          module_title: completion.module_title || 'Sin módulo',
          course_title: completion.course_title || 'Sin curso',
          course_slug: completion.course_slug || ''
        };
      });
      
      // Return pre-calculated data (no heavy computation needed on frontend!)
      res.json({
        global: {
          done_lessons_total,
          total_lessons_total,
          progress_pct: global_progress_pct
        },
        courses: courses,
        study: {
          seconds_lifetime,
          seconds_this_month
        },
        currentStreak,
        activeDays: sortedDays.length,
        recentCompletions
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}
