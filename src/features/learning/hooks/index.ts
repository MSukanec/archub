/**
 * Learning Hooks - Barrel Export
 * 
 * React Query hooks del módulo learning organizados por categoría:
 * - Public (landing pages, catalog)
 * - Student (dashboard, progress, notes, markers)
 * - Admin (course management)
 * - Mutations (progress, notes, markers)
 */

// ========== PUBLIC HOOKS (LANDING PAGES) ==========
export { useCourseLanding } from './use-course-landing';
export { useAllCourses } from './use-all-courses';

// ========== STUDENT HOOKS - DASHBOARD & COURSES (QUERIES) ==========
export { useLearningDashboard } from './use-learning-dashboard';
export { useLearningDashboardFast } from './use-learning-dashboard-fast';
export { useLearningCourses } from './use-learning-courses';
export { useAdminCourses } from './use-admin-courses';
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
export { useCourseListData, type CourseTabFilter, type CourseViewModel, type EnrollmentStatus } from './use-course-list-data';

// ========== LESSON PROGRESS (QUERIES) ==========
export { useLessonProgress } from './use-lesson-progress';

// ========== NOTES & MARKERS (QUERIES) ==========
export { useLessonNotes } from './use-lesson-notes';
export { useCourseRecentNotes } from './use-course-recent-notes';
export { useLessonMarkers } from './use-lesson-markers';
export { useCourseMarkers, type MarkerWithLesson } from './use-course-markers';
export { useCourseRecentMarkers } from './use-course-recent-markers';

// ========== PRICING (QUERIES) ==========
export { useCoursePricing } from './use-course-pricing';
export { useCoursePrice } from './use-course-price';

// ========== MUTATIONS - PROGRESS ==========
export { useUpdateLessonProgress } from './use-update-lesson-progress';
export { useToggleLessonFavorite } from './use-toggle-lesson-favorite';

// ========== MUTATIONS - NOTES ==========
export { useUpsertLessonNote } from './use-upsert-lesson-note';
export { useDeleteLessonNote } from './use-delete-lesson-note';

// ========== MUTATIONS - MARKERS ==========
export { useUpsertLessonMarker } from './use-upsert-lesson-marker';
export { useDeleteLessonMarker } from './use-delete-lesson-marker';

// ========== MUTATIONS - ENROLLMENT ==========
export { useRemoveCourseEnrollment } from './use-remove-course-enrollment';
