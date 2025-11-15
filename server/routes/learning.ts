import type { Express } from "express";
import type { RouteDeps } from "./_base";
import {
  handleGetCoursesFull,
  handleGetDashboard,
  handleGetDashboardFast,
  handleGetCourseProgress
} from '../controllers/learning/courses.controller.js';
import {
  handleGetLessonNotes,
  handleCreateOrUpdateLessonNote,
  handleUpdateLessonProgress
} from '../controllers/learning/lessons.controller.js';

/**
 * Register learning-related endpoints (courses, dashboard, lessons, notes, progress)
 */
export function registerLearningRoutes(app: Express, deps: RouteDeps): void {
  // ========== LEARNING - COURSES ENDPOINTS ==========
  
  // GET /api/learning/courses-full - Get all courses with enrollments and progress
  app.get("/api/learning/courses-full", handleGetCoursesFull);
  
  // GET /api/learning/dashboard - Get student dashboard with enrollments, progress, and recent completions
  app.get("/api/learning/dashboard", handleGetDashboard);
  
  // GET /api/learning/dashboard-fast - Get optimized student dashboard
  app.get("/api/learning/dashboard-fast", handleGetDashboardFast);
  
  // GET /api/courses/:id/progress - Get progress for a specific course
  app.get("/api/courses/:id/progress", handleGetCourseProgress);

  // ========== LEARNING - LESSONS ENDPOINTS ==========
  
  // GET /api/lessons/:id/notes - Get all notes for a lesson
  app.get("/api/lessons/:id/notes", handleGetLessonNotes);
  
  // POST /api/lessons/:id/notes - Create or update a lesson note
  app.post("/api/lessons/:id/notes", handleCreateOrUpdateLessonNote);
  
  // POST /api/lessons/:id/progress - Update lesson progress
  app.post("/api/lessons/:id/progress", handleUpdateLessonProgress);
}
