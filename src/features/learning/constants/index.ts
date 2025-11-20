/**
 * Constants for the Learning module
 */

// ========== QUERY KEYS ==========
export const LEARNING_QUERY_KEYS = {
  // Dashboard
  dashboard: ['learning', 'dashboard'] as const,
  dashboardFast: ['learning', 'dashboard', 'fast'] as const,
  
  // Courses
  courses: ['learning', 'courses'] as const,
  coursesFull: ['learning', 'courses', 'full'] as const,
  course: (courseId: string) => ['learning', 'courses', courseId] as const,
  courseOverview: (courseId: string) => ['learning', 'courses', courseId, 'overview'] as const,
  courseStructure: (courseId: string) => ['learning', 'courses', courseId, 'structure'] as const,
  courseProgress: (courseId: string) => ['learning', 'courses', courseId, 'progress'] as const,
  coursePricing: (courseSlug: string, currency?: string, provider?: string) => 
    ['learning', 'courses', courseSlug, 'pricing', currency, provider] as const,
  
  // Lessons
  lesson: (lessonId: string) => ['learning', 'lessons', lessonId] as const,
  lessonProgress: (lessonId: string) => ['learning', 'lessons', lessonId, 'progress'] as const,
  lessonNotes: (lessonId: string) => ['learning', 'lessons', lessonId, 'notes'] as const,
  lessonSummaryNote: (lessonId: string) => ['learning', 'lessons', lessonId, 'summary-note'] as const,
  lessonMarkers: (lessonId: string) => ['learning', 'lessons', lessonId, 'markers'] as const,
} as const;

// ========== NOTE TYPES ==========
export const NOTE_TYPES = {
  SUMMARY: 'summary',
  MARKER: 'marker',
  GENERAL: 'general',
} as const;

export type NoteType = typeof NOTE_TYPES[keyof typeof NOTE_TYPES];

// ========== LESSON STATUS ==========
export const LESSON_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type LessonStatus = typeof LESSON_STATUS[keyof typeof LESSON_STATUS];

// ========== COURSE STATUS ==========
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];

// ========== AUTO-COMPLETION THRESHOLD ==========
export const AUTO_COMPLETE_THRESHOLD = 95; // Auto-complete lesson when >= 95% progress
