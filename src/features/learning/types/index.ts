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
  accessType?: 'free' | 'paid' | 'trial';
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
  note_type?: 'summary' | 'marker' | 'general';
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
 */
export interface LearningDashboardFast {
  enrollments: Array<{
    course: Course;
    progress: CourseProgressSummary;
  }>;
  recentActivity: Array<{
    lessonId: string;
    lessonTitle: string;
    courseTitle: string;
    completedAt: string;
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
 * Lesson status derived from progress
 */
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Get lesson status from progress data
 */
export function getLessonStatus(progress?: CourseLessonProgress): LessonStatus {
  if (!progress) return 'not_started';
  if (progress.is_completed || (progress.progress_pct && Number(progress.progress_pct) >= 95)) {
    return 'completed';
  }
  if (progress.progress_pct && Number(progress.progress_pct) > 0) {
    return 'in_progress';
  }
  return 'not_started';
}
