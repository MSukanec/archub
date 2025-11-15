import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getAdminClient } from './_base';
import { verifyAdminUser, HttpError } from '../../api/lib/auth-helpers.js';
import { listCourses, getCourse, createCourse, updateCourse, deleteCourse } from '../../api/lib/handlers/admin/courses.js';
import { listModules, getModule, createModule, updateModule, deleteModule } from '../../api/lib/handlers/admin/modules.js';
import { listLessons, getLesson, createLesson, updateLesson, deleteLesson } from '../../api/lib/handlers/admin/lessons.js';
import { listEnrollments, getEnrollment, createEnrollment, updateEnrollment, deleteEnrollment } from '../../api/lib/handlers/admin/enrollments.js';
import { getDashboardStats } from '../../api/lib/handlers/admin/dashboard.js';
import { listUsers, updateUser } from '../../api/lib/handlers/admin/users.js';
import { createCoupon, updateCoupon, deleteCoupon } from '../../api/lib/handlers/admin/coupons.js';

/**
 * Register all admin-related endpoints
 * All endpoints require admin authentication via verifyAdminUser()
 */
export function registerAdminRoutes(app: Express, deps: RouteDeps): void {
  const { supabase } = deps;

  // ==================== COURSE MANAGEMENT ====================
  
  // GET /api/admin/courses - Get all courses
  app.get("/api/admin/courses", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await listCourses(ctx);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/courses/:id - Get single course
  app.get("/api/admin/courses/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await getCourse(ctx, { id });
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/admin/courses - Create course
  app.post("/api/admin/courses", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await createCourse(ctx, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/courses/:id - Update course
  app.patch("/api/admin/courses/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateCourse(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/courses/:id - Delete course
  app.delete("/api/admin/courses/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await deleteCourse(ctx, { id });
      return result.success 
        ? res.json({ success: true })
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== MODULE MANAGEMENT ====================

  // GET /api/admin/modules?course_id=X - Get modules for a course
  app.get("/api/admin/modules", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { course_id } = req.query;
      
      const result = await listModules(ctx, course_id ? { course_id: course_id as string } : undefined);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/admin/modules - Create module
  app.post("/api/admin/modules", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await createModule(ctx, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/modules/:id - Get single module
  app.get("/api/admin/modules/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await getModule(ctx, { id });
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/modules/:id - Update module
  app.patch("/api/admin/modules/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateModule(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/modules/:id - Delete module
  app.delete("/api/admin/modules/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await deleteModule(ctx, { id });
      return result.success 
        ? res.json({ success: true })
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== LESSON MANAGEMENT ====================

  // GET /api/admin/lessons?module_id=X - Get lessons for a module
  app.get("/api/admin/lessons", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { module_id } = req.query;
      
      const result = await listLessons(ctx, module_id ? { module_id: module_id as string } : undefined);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // POST /api/admin/lessons - Create lesson
  app.post("/api/admin/lessons", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await createLesson(ctx, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/lessons/:id - Get single lesson
  app.get("/api/admin/lessons/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await getLesson(ctx, { id });
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/lessons/:id - Update lesson
  app.patch("/api/admin/lessons/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateLesson(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/lessons/:id - Delete lesson
  app.delete("/api/admin/lessons/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await deleteLesson(ctx, { id });
      return result.success 
        ? res.json({ success: true })
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // ==================== ENROLLMENT MANAGEMENT ====================

  // GET /api/admin/enrollments - Get all enrollments with progress (OPTIMIZED)
  app.get("/api/admin/enrollments", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { course_id } = req.query;
      
      const result = await listEnrollments(ctx, course_id ? { course_id: course_id as string } : undefined);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // POST /api/admin/enrollments - Create enrollment
  app.post("/api/admin/enrollments", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await createEnrollment(ctx, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/enrollments/:id - Get single enrollment
  app.get("/api/admin/enrollments/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await getEnrollment(ctx, { id });
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/enrollments/:id - Update enrollment
  app.patch("/api/admin/enrollments/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateEnrollment(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/enrollments/:id
  app.delete("/api/admin/enrollments/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await deleteEnrollment(ctx, { id });
      return result.success 
        ? res.json({ success: true })
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // ==================== ADMIN DASHBOARD ====================

  // GET /api/admin/dashboard - Get admin dashboard data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await getDashboardStats(ctx);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== USER MANAGEMENT ====================

  // GET /api/admin/users - Get all users with stats
  app.get("/api/admin/users", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { search, sortBy, statusFilter } = req.query;
      
      const result = await listUsers(ctx, {
        search: search as string,
        sortBy: sortBy as string,
        statusFilter: statusFilter as string,
      });
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/users/:id - Update user (deactivate)
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateUser(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // ==================== COUPON MANAGEMENT ====================

  // POST /api/admin/coupons - Create coupon
  app.post("/api/admin/coupons", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      
      const result = await createCoupon(ctx, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/coupons/:id - Update coupon
  app.patch("/api/admin/coupons/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await updateCoupon(ctx, { id }, req.body);
      return result.success 
        ? res.json(result.data)
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/coupons/:id - Delete coupon
  app.delete("/api/admin/coupons/:id", async (req, res) => {
    try {
      await verifyAdminUser(req.headers.authorization ?? "");
      const adminClient = getAdminClient();
      const ctx = { supabase: adminClient };
      const { id } = req.params;
      
      const result = await deleteCoupon(ctx, { id });
      return result.success 
        ? res.json({ success: true })
        : res.status(500).json({ error: result.error });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
