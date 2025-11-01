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
        console.error("Error fetching courses:", coursesError);
        return res.status(500).json({ error: "Failed to fetch courses" });
      }
      
      return res.json(courses);
    } catch (error: any) {
      console.error("Error in /api/admin/courses:", error);
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
        console.error("Error fetching course:", courseError);
        return res.status(500).json({ error: "Failed to fetch course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      console.error("Error in /api/admin/courses/:id:", error);
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
        console.error("Error updating course:", courseError);
        return res.status(500).json({ error: "Failed to update course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/courses/:id:", error);
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
        console.error("Error deleting course:", courseError);
        return res.status(500).json({ error: "Failed to delete course" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error in DELETE /api/admin/courses/:id:", error);
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
        console.error("Error fetching modules:", modulesError);
        return res.status(500).json({ error: "Failed to fetch modules" });
      }
      
      return res.json(modules || []);
    } catch (error: any) {
      console.error("Error in /api/admin/modules:", error);
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
        console.error("Error updating module:", moduleError);
        return res.status(500).json({ error: "Failed to update module" });
      }
      
      return res.json(module);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/modules/:id:", error);
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
        console.error("Error fetching lessons:", lessonsError);
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      return res.json(lessons || []);
    } catch (error: any) {
      console.error("Error in /api/admin/lessons:", error);
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
        console.error("Error updating lesson:", lessonError);
        return res.status(500).json({ error: "Failed to update lesson" });
      }
      
      return res.json(lesson);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/lessons/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // ==================== ENROLLMENT MANAGEMENT ====================

  // GET /api/admin/enrollments - Get all enrollments with progress
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
      
      // Fetch enrollments with users and courses
      let query = adminClient
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
      
      const { data: enrollments, error: enrollmentsError } = await query;
      
      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Fetch progress for all enrollments in parallel
      const enrollmentsWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          // Get all modules for the course
          const { data: modules } = await adminClient
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
          const { data: lessons } = await adminClient
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
          const { data: progressData } = await adminClient
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
      
      return res.json(enrollmentsWithProgress);
    } catch (error: any) {
      console.error("Error in /api/admin/enrollments:", error);
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
        console.error("Error creating enrollment:", insertError);
        return res.status(500).json({ error: "Failed to create enrollment" });
      }
      
      return res.json(data);
    } catch (error: any) {
      console.error("Error in POST /api/admin/enrollments:", error);
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
        console.error("Error updating enrollment:", updateError);
        return res.status(500).json({ error: "Failed to update enrollment" });
      }
      
      return res.json(data);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/enrollments/:id:", error);
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
        console.error("Error deleting enrollment:", deleteError);
        return res.status(500).json({ error: "Failed to delete enrollment" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error in DELETE /api/admin/enrollments/:id:", error);
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
      console.error("Error in /api/admin/dashboard:", error);
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
        console.error("Error fetching users:", usersError);
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      
      // Get user presence data
      const authIds = data.map(u => u.auth_id);
      
      const { data: presenceData } = await adminClient
        .from('user_presence')
        .select('user_id, last_seen_at')
        .in('user_id', authIds);
      
      // Create presence map using auth_id as key
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
            last_seen_at: presenceMap.get(user.auth_id) || null
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
      console.error("Error in /api/admin/users:", error);
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
        console.error("Error updating user:", updateError);
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      return res.json(data);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/users/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
