import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getAdminClient } from './_base';
import { createClient } from '@supabase/supabase-js';

/**
 * Helper function to verify admin access
 * This is internal to the admin module and uses service role key to verify admin status
 */
async function verifyAdmin(authHeader: string) {
  const token = authHeader.substring(7);
  
  const authSupabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  
  const { data: { user }, error } = await authSupabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: "Invalid or expired token" };
  }
  
  const { data: adminCheck } = await authSupabase
    .from('admin_users')
    .select('auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();
  
  if (!adminCheck) {
    return { isAdmin: false, error: "Admin access required" };
  }
  
  return { isAdmin: true, user };
}

/**
 * Register all admin-related endpoints
 * All endpoints require admin authentication via verifyAdmin()
 */
export function registerAdminRoutes(app: Express, deps: RouteDeps): void {
  const { supabase } = deps;

  // ==================== COURSE MANAGEMENT ====================
  
  // GET /api/admin/courses - Get all courses
  app.get("/api/admin/courses", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { data: courses, error: coursesError } = await adminClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (coursesError) {
        return res.status(500).json({ error: "Failed to fetch courses" });
      }
      
      return res.json(courses);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/courses/:id - Get single course
  app.get("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      
      const { data: course, error: courseError } = await adminClient
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (courseError) {
        return res.status(500).json({ error: "Failed to fetch course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/courses/:id - Update course
  app.patch("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const updates = req.body;
      
      const { data: course, error: courseError } = await adminClient
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (courseError) {
        return res.status(500).json({ error: "Failed to update course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/courses/:id - Delete course
  app.delete("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      
      const { error: courseError } = await adminClient
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (courseError) {
        return res.status(500).json({ error: "Failed to delete course" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== MODULE MANAGEMENT ====================

  // GET /api/admin/modules?course_id=X - Get modules for a course
  app.get("/api/admin/modules", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { course_id } = req.query;
      
      let query = adminClient
        .from('course_modules')
        .select('*')
        .order('sort_index', { ascending: true });
      
      if (course_id) {
        query = query.eq('course_id', course_id);
      }
      
      const { data: modules, error: modulesError } = await query;
      
      if (modulesError) {
        return res.status(500).json({ error: "Failed to fetch modules" });
      }
      
      return res.json(modules || []);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/modules/:id - Update module
  app.patch("/api/admin/modules/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const updates = req.body;
      
      const { data: module, error: moduleError } = await adminClient
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (moduleError) {
        return res.status(500).json({ error: "Failed to update module" });
      }
      
      return res.json(module);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== LESSON MANAGEMENT ====================

  // GET /api/admin/lessons?module_id=X - Get lessons for a module
  app.get("/api/admin/lessons", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { module_id } = req.query;
      
      let query = adminClient
        .from('course_lessons')
        .select('*')
        .order('sort_index', { ascending: true });
      
      if (module_id) {
        query = query.eq('module_id', module_id);
      }
      
      const { data: lessons, error: lessonsError } = await query;
      
      if (lessonsError) {
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      return res.json(lessons || []);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/lessons/:id - Update lesson
  app.patch("/api/admin/lessons/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const updates = req.body;
      
      const { data: lesson, error: lessonError } = await adminClient
        .from('course_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (lessonError) {
        return res.status(500).json({ error: "Failed to update lesson" });
      }
      
      return res.json(lesson);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // ==================== ENROLLMENT MANAGEMENT ====================

  // GET /api/admin/enrollments - Get all enrollments with progress (OPTIMIZED)
  app.get("/api/admin/enrollments", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { course_id } = req.query;
      
      // QUERY 1: Fetch ALL enrollments with users and courses
      let enrollmentsQuery = adminClient
        .from('course_enrollments')
        .select(`
          *,
          users!inner(id, full_name, email, avatar_url),
          courses!inner(id, title)
        `)
        .order('started_at', { ascending: false });
      
      if (course_id) {
        enrollmentsQuery = enrollmentsQuery.eq('course_id', course_id);
      }
      
      const { data: enrollments, error: enrollmentsError} = await enrollmentsQuery;
      
      if (enrollmentsError) {
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }

      if (!enrollments || enrollments.length === 0) {
        return res.json([]);
      }
      
      // Extract unique course IDs and user IDs
      const courseIds = Array.from(new Set(enrollments.map(e => e.course_id)));
      const userIds = Array.from(new Set(enrollments.map(e => e.user_id)));
      
      // QUERY 2: Fetch ALL payments for these users and courses
      const { data: allPayments } = await adminClient
        .from('payments')
        .select('id, amount, currency, provider, status, user_id, course_id')
        .in('user_id', userIds)
        .in('course_id', courseIds)
        .eq('product_type', 'course');
      
      // Create (user_id + course_id) -> payment mapping
      const paymentMap = new Map<string, any>();
      (allPayments || []).forEach(payment => {
        const key = `${payment.user_id}_${payment.course_id}`;
        paymentMap.set(key, payment);
      });
      
      // QUERY 3: Fetch ALL modules for ALL courses at once
      const { data: allModules } = await adminClient
        .from('course_modules')
        .select('id, course_id')
        .in('course_id', courseIds);
      
      if (!allModules || allModules.length === 0) {
        // No modules = no lessons = 0% progress for everyone
        return res.json(enrollments.map(e => {
          const paymentKey = `${e.user_id}_${e.course_id}`;
          return {
            ...e,
            payment: paymentMap.get(paymentKey) || null,
            progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
          };
        }));
      }
      
      // Create course_id -> module_ids mapping
      const courseModulesMap = new Map<string, string[]>();
      allModules.forEach(module => {
        if (!courseModulesMap.has(module.course_id)) {
          courseModulesMap.set(module.course_id, []);
        }
        courseModulesMap.get(module.course_id)!.push(module.id);
      });
      
      const allModuleIds = allModules.map(m => m.id);
      
      // QUERY 4: Fetch ALL lessons for ALL modules at once
      const { data: allLessons } = await adminClient
        .from('course_lessons')
        .select('id, module_id')
        .in('module_id', allModuleIds);
      
      if (!allLessons || allLessons.length === 0) {
        // No lessons = 0% progress for everyone
        return res.json(enrollments.map(e => {
          const paymentKey = `${e.user_id}_${e.course_id}`;
          return {
            ...e,
            payment: paymentMap.get(paymentKey) || null,
            progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
          };
        }));
      }
      
      // Create module_id -> lesson_ids mapping
      const moduleLessonsMap = new Map<string, string[]>();
      allLessons.forEach(lesson => {
        if (!moduleLessonsMap.has(lesson.module_id)) {
          moduleLessonsMap.set(lesson.module_id, []);
        }
        moduleLessonsMap.get(lesson.module_id)!.push(lesson.id);
      });
      
      const allLessonIds = allLessons.map(l => l.id);
      
      // QUERY 5: Fetch ALL progress for ALL users and ALL lessons at once
      const { data: allProgress } = await adminClient
        .from('course_lesson_progress')
        .select('user_id, lesson_id, is_completed')
        .in('user_id', userIds)
        .in('lesson_id', allLessonIds)
        .eq('is_completed', true);
      
      // Create user_id -> Set<completed_lesson_ids> mapping
      const userProgressMap = new Map<string, Set<string>>();
      (allProgress || []).forEach(progress => {
        if (!userProgressMap.has(progress.user_id)) {
          userProgressMap.set(progress.user_id, new Set());
        }
        userProgressMap.get(progress.user_id)!.add(progress.lesson_id);
      });
      
      // COMBINE: Calculate progress for each enrollment in memory (super fast)
      const enrollmentsWithProgress = enrollments.map(enrollment => {
        const moduleIds = courseModulesMap.get(enrollment.course_id) || [];
        
        // Get all lesson IDs for this course
        const lessonIds = moduleIds.flatMap(moduleId => 
          moduleLessonsMap.get(moduleId) || []
        );
        
        const total_lessons = lessonIds.length;
        
        // Get completed lessons for this user
        const completedLessons = userProgressMap.get(enrollment.user_id) || new Set();
        const completed_lessons = lessonIds.filter(lessonId => 
          completedLessons.has(lessonId)
        ).length;
        
        const progress_percentage = total_lessons > 0 
          ? Math.round((completed_lessons / total_lessons) * 100) 
          : 0;
        
        // Get payment for this enrollment
        const paymentKey = `${enrollment.user_id}_${enrollment.course_id}`;
        
        return {
          ...enrollment,
          payment: paymentMap.get(paymentKey) || null,
          progress: { 
            completed_lessons, 
            total_lessons, 
            progress_percentage 
          }
        };
      });
      
      return res.json(enrollmentsWithProgress);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // POST /api/admin/enrollments - Create enrollment
  app.post("/api/admin/enrollments", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { user_id, course_id, status, expires_at } = req.body;
      
      const { data, error: insertError } = await adminClient
        .from('course_enrollments')
        .insert({
          user_id,
          course_id,
          status,
          expires_at: expires_at || null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        return res.status(500).json({ error: "Failed to create enrollment" });
      }
      
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/enrollments/:id - Update enrollment
  app.patch("/api/admin/enrollments/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const { user_id, course_id, status, expires_at } = req.body;
      
      const { data, error: updateError } = await adminClient
        .from('course_enrollments')
        .update({
          user_id,
          course_id,
          status,
          expires_at: expires_at || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        return res.status(500).json({ error: "Failed to update enrollment" });
      }
      
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/enrollments/:id
  app.delete("/api/admin/enrollments/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      
      const { error: deleteError } = await adminClient
        .from('course_enrollments')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        return res.status(500).json({ error: "Failed to delete enrollment" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // ==================== ADMIN DASHBOARD ====================

  // GET /api/admin/dashboard - Get admin dashboard data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Execute all queries in parallel
      const [
        allCoursesResult,
        activeCoursesResult,
        allEnrollmentsResult,
        activeEnrollmentsResult,
        expiringThisMonthResult,
        expiringNextMonthResult,
        recentEnrollmentsResult,
        expiringSoonResult,
        allProgressResult
      ] = await Promise.all([
        // Total courses
        adminClient.from('courses').select('id', { count: 'exact', head: true }),
        
        // Active courses
        adminClient.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        
        // Total enrollments
        adminClient.from('course_enrollments').select('id', { count: 'exact', head: true }),
        
        // Active enrollments
        adminClient.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        
        // Expiring this month
        adminClient.from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', startOfMonth.toISOString())
          .lte('expires_at', endOfMonth.toISOString()),
        
        // Expiring next month
        adminClient.from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', startOfNextMonth.toISOString())
          .lte('expires_at', endOfNextMonth.toISOString()),
        
        // Recent enrollments (last 10)
        adminClient.from('course_enrollments')
          .select('*, users(full_name, email), courses(title, slug)')
          .order('started_at', { ascending: false })
          .limit(10),
        
        // Expiring in next 30 days
        adminClient.from('course_enrollments')
          .select('*, users(full_name, email), courses(title, slug)')
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', now.toISOString())
          .lte('expires_at', next30Days.toISOString())
          .order('expires_at', { ascending: true })
          .limit(10),
        
        // All lesson progress for avg completion rate
        adminClient.from('course_lesson_progress')
          .select('progress_pct')
      ]);
      
      // Calculate average completion rate
      const progressData = allProgressResult.data || [];
      const avgCompletionRate = progressData.length > 0
        ? progressData.reduce((sum, p) => sum + (p.progress_pct || 0), 0) / progressData.length
        : 0;
      
      // Note: Revenue data would require a payments table - setting to 0 for now
      const stats = {
        totalCourses: allCoursesResult.count || 0,
        activeCourses: activeCoursesResult.count || 0,
        totalEnrollments: allEnrollmentsResult.count || 0,
        activeEnrollments: activeEnrollmentsResult.count || 0,
        expiringThisMonth: expiringThisMonthResult.count || 0,
        expiringNextMonth: expiringNextMonthResult.count || 0,
        totalRevenue: 0, // TODO: Implement when payments table is available
        revenueThisMonth: 0, // TODO: Implement when payments table is available
        revenueLastMonth: 0, // TODO: Implement when payments table is available
        avgCompletionRate: avgCompletionRate
      };
      
      return res.json({
        stats,
        recentEnrollments: recentEnrollmentsResult.data || [],
        expiringSoon: expiringSoonResult.data || []
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== USER MANAGEMENT ====================

  // GET /api/admin/users - Get all users with stats
  app.get("/api/admin/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      
      // Get query parameters for filtering
      const searchValue = req.query.search as string || '';
      const sortBy = req.query.sortBy as string || 'created_at';
      const statusFilter = req.query.statusFilter as string || 'all';
      
      // Build query
      let query = adminClient
        .from('users')
        .select(`
          *,
          user_data (
            first_name,
            last_name,
            country
          )
        `);
      
      // Apply filters
      if (searchValue) {
        query = query.or(`full_name.ilike.%${searchValue}%,email.ilike.%${searchValue}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }
      
      // Apply sorting
      if (sortBy === 'name') {
        query = query.order('full_name', { ascending: true });
      } else if (sortBy === 'email') {
        query = query.order('email', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error: usersError } = await query;
      
      if (usersError) {
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      
      // Get user presence data
      const userIds = data.map(u => u.id);
      
      const { data: presenceData } = await adminClient
        .from('user_presence')
        .select('user_id, last_seen_at')
        .in('user_id', userIds);
      
      // Create presence map using user.id as key
      const presenceMap = new Map(presenceData?.map(p => [p.user_id, p.last_seen_at]) ?? []);
      
      // Get organization counts for each user
      const usersWithCounts = await Promise.all(
        data.map(async (user) => {
          const { count } = await adminClient
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true);
          
          return {
            ...user,
            organizations_count: count || 0,
            last_seen_at: presenceMap.get(user.id) || null
          };
        })
      );
      
      // Sort by last activity (most recent first)
      const sortedUsers = usersWithCounts.sort((a, b) => {
        if (!a.last_seen_at && !b.last_seen_at) return 0;
        if (!a.last_seen_at) return 1;
        if (!b.last_seen_at) return -1;
        return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
      });
      
      return res.json(sortedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/users/:id - Update user (deactivate)
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const { is_active } = req.body;
      
      // Update user
      const { data, error: updateError } = await adminClient
        .from('users')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== COUPON MANAGEMENT ====================

  // POST /api/admin/coupons - Create coupon
  app.post("/api/admin/coupons", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { couponData, selectedCourses } = req.body;
      
      // Create coupon using service role (bypasses RLS)
      const { data: newCoupon, error: couponError } = await adminClient
        .from('coupons')
        .insert({
          code: couponData.code.toUpperCase(),
          type: couponData.type,
          amount: couponData.amount,
          is_active: couponData.is_active,
          starts_at: couponData.starts_at || null,
          expires_at: couponData.expires_at || null,
          max_redemptions: couponData.max_redemptions || null,
          per_user_limit: couponData.per_user_limit || 1,
          min_order_total: couponData.min_order_total || null,
          currency: couponData.currency || null,
          applies_to_all: selectedCourses?.length === 0,
        })
        .select()
        .single();
      
      if (couponError) {
        console.error('Error creating coupon:', couponError);
        return res.status(500).json({ error: "Failed to create coupon" });
      }
      
      // Create course associations if any
      if (selectedCourses && selectedCourses.length > 0) {
        const associations = selectedCourses.map((courseId: string) => ({
          coupon_id: newCoupon.id,
          course_id: courseId
        }));
        
        const { error: assocError } = await adminClient
          .from('coupon_courses')
          .insert(associations);
        
        if (assocError) {
          console.error('Error creating coupon associations:', assocError);
          // Coupon was created, but associations failed
          // We'll still return success but log the error
        }
      }
      
      return res.json(newCoupon);
    } catch (error: any) {
      console.error('Create coupon error:', error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/coupons/:id - Update coupon
  app.patch("/api/admin/coupons/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      const { couponData, selectedCourses } = req.body;
      
      // Update coupon using service role (bypasses RLS)
      const { data: updatedCoupon, error: updateError } = await adminClient
        .from('coupons')
        .update({
          code: couponData.code.toUpperCase(),
          type: couponData.type,
          amount: couponData.amount,
          is_active: couponData.is_active,
          starts_at: couponData.starts_at || null,
          expires_at: couponData.expires_at || null,
          max_redemptions: couponData.max_redemptions || null,
          per_user_limit: couponData.per_user_limit || 1,
          min_order_total: couponData.min_order_total || null,
          currency: couponData.currency || null,
          applies_to_all: selectedCourses?.length === 0,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating coupon:', updateError);
        return res.status(500).json({ error: "Failed to update coupon" });
      }
      
      // Update course associations
      // First, delete all existing associations
      await adminClient
        .from('coupon_courses')
        .delete()
        .eq('coupon_id', id);
      
      // Then create new associations if any
      if (selectedCourses && selectedCourses.length > 0) {
        const associations = selectedCourses.map((courseId: string) => ({
          coupon_id: id,
          course_id: courseId
        }));
        
        const { error: assocError } = await adminClient
          .from('coupon_courses')
          .insert(associations);
        
        if (assocError) {
          console.error('Error updating coupon associations:', assocError);
        }
      }
      
      return res.json(updatedCoupon);
    } catch (error: any) {
      console.error('Update coupon error:', error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/coupons/:id - Delete coupon
  app.delete("/api/admin/coupons/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const adminClient = getAdminClient();
      const { id } = req.params;
      
      // Delete coupon associations first (cascade)
      await adminClient
        .from('coupon_courses')
        .delete()
        .eq('coupon_id', id);
      
      // Delete coupon using service role (bypasses RLS)
      const { error: deleteError } = await adminClient
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting coupon:', deleteError);
        return res.status(500).json({ error: "Failed to delete coupon" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Delete coupon error:', error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
