/**
 * Types for the Learning module
 */
import type {
  Course,
  CourseModule,
  Lesson,
  CourseLessonProgress,
  CourseLessonNote,
} from '@shared/schema';
// ========== EXTENDED COURSE TYPES ==========
/**
 * Course with full details including modules, lessons, and progress
 */
export interface CourseWithDetails extends Course {
  modules?: CourseModuleWithLessons[];
  progress?: CourseProgressSummary;
  enrollment?: EnrollmentInfo;
}
/**
 * Course module with nested lessons and progress
 */
export interface CourseModuleWithLessons extends CourseModule {
  lessons?: LessonWithProgress[];
}
/**
 * Lesson with user progress data
 */
export interface LessonWithProgress extends Lesson {
  progress?: CourseLessonProgress;
}
// ========== PROGRESS TYPES ==========
/**
 * Summary of course progress for a user
 */
export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  lastAccessedAt?: string;
  favoriteLessons?: string[]; // lesson IDs
}
/**
 * Update lesson progress payload
 */
export interface UpdateLessonProgressPayload {
  lessonId: string;
  progress_pct?: number;
  last_position_sec?: number;
  completed_at?: string | null;
  is_completed?: boolean;
}
// ========== ENROLLMENT TYPES ==========
/**
 * Enrollment information for a course
 */
export interface EnrollmentInfo {
  isEnrolled: boolean;
  enrolledAt?: string;
  expiresAt?: string | null;
  accessType?: 'free'| 'paid'| 'trial';
}
// ========== NOTES & MARKERS TYPES ==========
/**
 * Lesson note with extended info
 */
export interface LessonNote extends CourseLessonNote {
  // All fields from CourseLessonNote
}
/**
 * Create/Update lesson note payload
 */
export interface UpsertLessonNotePayload {
  lessonId: string;
  body: string;
  time_sec?: number | null;
  is_pinned?: boolean;
  note_type?: 'summary'| 'marker'| 'general';
}
/**
 * Lesson marker (video bookmark)
 */
export interface LessonMarker extends CourseLessonNote {
  time_sec: number; // Required for markers
}
/**
 * Create/Update marker payload
 */
export interface UpsertMarkerPayload {
  lessonId: string;
  body: string;
  time_sec: number;
  is_pinned?: boolean;
}
// ========== DASHBOARD TYPES ==========
/**
 * Learning dashboard data
 */
export interface LearningDashboard {
  enrolledCourses: CourseWithDetails[];
  recentCompletions: LessonWithProgress[];
  favoriteLessons: LessonWithProgress[];
  overallProgress: {
    totalCourses: number;
    completedCourses: number;
    totalLessons: number;
    completedLessons: number;
  };
}
/**
 * Fast dashboard data (optimized version)
 * Matches the backend DashboardFastData interface
 */
export interface LearningDashboardFast {
  global: {
    done_lessons_total: number;
    total_lessons_total: number;
    progress_pct: number;
  } | null;
  courses: Array<{
    course_id: string;
    course_title: string;
    course_slug: string;
    cover_url: string | null;
    progress_pct: number;
    done_lessons: number;
    total_lessons: number;
  }>;
  study: {
    seconds_lifetime: number;
    seconds_this_month: number;
  };
  currentStreak: number;
  activeDays: number;
  recentCompletions: Array<{
    type: string;
    when: string;
    lesson_title: string;
    module_title: string;
    course_title: string;
    course_slug: string;
  }>;
}
// ========== PRICING TYPES ==========
/**
 * Course pricing information
 */
export interface CoursePricing {
  courseSlug: string;
  currency: string;
  provider: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPct?: number;
  isOnSale?: boolean;
}
// ========== HELPER TYPES ==========
/**
 * Get lesson status from progress data
 * 
 * Returns 'not_started'| 'in_progress'| 'completed'
 * based on the progress data.
 * 
 * Note: LessonStatus type is exported from constants/index.ts
 */
export function getLessonStatus(progress?: CourseLessonProgress): 'not_started'| 'in_progress'| 'completed'{
  if (!progress) return 'not_started';
  if (progress.is_completed || (progress.progress_pct && Number(progress.progress_pct) >= 95)) {
    return 'completed';
  }
  if (progress.progress_pct && Number(progress.progress_pct) > 0) {
    return 'in_progress';
  }
  return 'not_started';
}
// ========== PUBLIC LANDING TYPES (from course-landing) ==========
import type { CourseFaq, Testimonial } from '@shared/schema';
/**
 * Course landing page data (public-facing)
 */
export interface CourseLandingData {
  course: Course;
  modules: ModuleWithLessons[];
  faqs: CourseFaq[];
  testimonials: Testimonial[];
  stats: CourseStats;
  clientGallery?: { id: string; url: string }[];
}
/**
 * Module with lessons and duration (for landing pages)
 */
export interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
  total_duration_min: number;
}
/**
 * Course statistics for landing pages
 */
export interface CourseStats {
  total_modules: number;
  total_lessons: number;
  total_duration_hours: number;
  total_duration_formatted: string;
}
