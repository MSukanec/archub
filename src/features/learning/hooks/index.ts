/**
 * Learning Hooks - Barrel Export
 * 
 * React Query hooks del módulo learning organizados por categoría:
 * - Dashboard y cursos (Queries)
 * - Progreso de lecciones (Queries)
 * - Notas y marcadores (Queries)
 * - Pricing (Queries)
 * - Mutations para progreso, notas y marcadores
 */

// ========== DASHBOARD & COURSES (QUERIES) ==========
export { useLearningDashboard } from './use-learning-dashboard';
export { useLearningDashboardFast } from './use-learning-dashboard-fast';
export { useLearningCourses } from './use-learning-courses';
export { useCourseOverview } from './use-course-overview';
export { useCourseStructure } from './use-course-structure';
export { useCourseProgress } from './use-course-progress';
export { useCourseEnrollment } from './use-course-enrollment';
export { useLastLessonInProgress } from './use-last-lesson-in-progress';
export { useStudyTime } from './use-study-time';
export { useCourseDuration } from './use-course-duration';
export { useCourseLessonsSummary } from './use-course-lessons-summary';
export { useLessonDetails } from './use-lesson-details';
export { useMonthlyStudyTime } from './use-monthly-study-time';

// ========== LESSON PROGRESS (QUERIES) ==========
export { useLessonProgress } from './use-lesson-progress';

// ========== NOTES & MARKERS (QUERIES) ==========
export { useLessonNotes } from './use-lesson-notes';
export { useCourseRecentNotes } from './use-course-recent-notes';
export { useLessonMarkers } from './use-lesson-markers';
export { useCourseRecentMarkers } from './use-course-recent-markers';

// ========== PRICING (QUERIES) ==========
export { useCoursePricing } from './use-course-pricing';

// ========== MUTATIONS - PROGRESS ==========
export { useUpdateLessonProgress } from './use-update-lesson-progress';
export { useToggleLessonFavorite } from './use-toggle-lesson-favorite';

// ========== MUTATIONS - NOTES ==========
export { useUpsertLessonNote } from './use-upsert-lesson-note';
export { useDeleteLessonNote } from './use-delete-lesson-note';

// ========== MUTATIONS - MARKERS ==========
export { useUpsertLessonMarker } from './use-upsert-lesson-marker';
export { useDeleteLessonMarker } from './use-delete-lesson-marker';
