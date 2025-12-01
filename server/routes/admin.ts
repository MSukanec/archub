import type { Express } from "express";
import type { RouteDeps } from './_base';
import * as dashboardController from '../controllers/admin/dashboard.controller.js';
import * as usersController from '../controllers/admin/users.controller.js';
import * as couponsController from '../controllers/admin/coupons.controller.js';
import * as coursesController from '../controllers/admin/courses.controller.js';
import * as modulesController from '../controllers/admin/modules.controller.js';
import * as lessonsController from '../controllers/admin/lessons.controller.js';
import * as enrollmentsController from '../controllers/admin/enrollments.controller.js';
import * as resetTestDataController from '../controllers/admin/reset-test-data.controller.js';
import * as subscriptionsController from '../controllers/admin/subscriptions.controller.js';
import * as plansController from '../controllers/admin/plans.controller.js';

/**
 * Register all admin-related endpoints
 * All endpoints require admin authentication
 */
export function registerAdminRoutes(app: Express, deps: RouteDeps): void {
  // ==================== DASHBOARD ====================
  app.get("/api/admin/dashboard", dashboardController.getDashboard);

  // ==================== USERS ====================
  app.get("/api/admin/users", usersController.getUsers);
  app.patch("/api/admin/users/:id", usersController.patchUser);

  // ==================== COUPONS ====================
  app.get("/api/admin/coupons", couponsController.getCoupons);
  app.post("/api/admin/coupons", couponsController.postCoupon);
  app.patch("/api/admin/coupons/:id", couponsController.patchCoupon);
  app.delete("/api/admin/coupons/:id", couponsController.removeCoupon);

  // ==================== COURSES ====================
  app.get("/api/admin/courses", coursesController.getCourses);
  app.get("/api/admin/courses/:id", coursesController.getSingleCourse);
  app.post("/api/admin/courses", coursesController.postCourse);
  app.patch("/api/admin/courses/:id", coursesController.patchCourse);
  app.delete("/api/admin/courses/:id", coursesController.removeCourse);

  // ==================== MODULES ====================
  app.get("/api/admin/modules", modulesController.getModules);
  app.post("/api/admin/modules", modulesController.postModule);
  app.patch("/api/admin/modules/:id", modulesController.patchModule);
  app.delete("/api/admin/modules/:id", modulesController.removeModule);

  // ==================== LESSONS ====================
  app.get("/api/admin/lessons", lessonsController.getLessons);
  app.post("/api/admin/lessons", lessonsController.postLesson);
  app.patch("/api/admin/lessons/:id", lessonsController.patchLesson);
  app.delete("/api/admin/lessons/:id", lessonsController.removeLesson);

  // ==================== ENROLLMENTS ====================
  app.get("/api/admin/enrollments", enrollmentsController.getEnrollments);
  app.post("/api/admin/enrollments", enrollmentsController.postEnrollment);
  app.patch("/api/admin/enrollments/:id", enrollmentsController.patchEnrollment);
  app.delete("/api/admin/enrollments/:id", enrollmentsController.removeEnrollment);

  // ==================== SUBSCRIPTIONS ====================
  app.get("/api/admin/subscriptions", subscriptionsController.getSubscriptions);

  // ==================== PLANS ====================
  app.get("/api/admin/plans", plansController.getPlans);

  // ==================== DEV/TEST UTILITIES ====================
  app.post("/api/admin/reset-test-data", resetTestDataController.resetTestData);
}
