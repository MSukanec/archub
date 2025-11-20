/**
 * Learning Services - Barrel Export
 * 
 * Servicios del módulo learning organizados por categoría:
 * - Dashboard y cursos
 * - Progreso de lecciones
 * - Notas y marcadores
 * - Pricing
 */

// ========== DASHBOARD & COURSES ==========
export { getLearningDashboard } from './getLearningDashboard';
export { getLearningDashboardFast } from './getLearningDashboardFast';
export { getLearningCourses } from './getLearningCourses';
export { getCourseOverview } from './getCourseOverview';
export { getCourseStructure } from './getCourseStructure';
export { getCourseProgress } from './getCourseProgress';
export { getCourseEnrollment } from './getCourseEnrollment';
export { getLastLessonInProgress } from './getLastLessonInProgress';
export { getStudyTime } from './getStudyTime';
export { getCourseDuration } from './getCourseDuration';
export { getCourseLessonsSummary } from './getCourseLessonsSummary';
export { getLessonDetails } from './getLessonDetails';
export { getMonthlyStudyTime } from './getMonthlyStudyTime';

// ========== LESSON PROGRESS ==========
export { getLessonProgress } from './getLessonProgress';
export { updateLessonProgress } from './updateLessonProgress';
export { toggleLessonFavorite } from './toggleLessonFavorite';

// ========== NOTES ==========
export { getLessonNotes } from './getLessonNotes';
export { getCourseRecentNotes } from './getCourseRecentNotes';
export { upsertLessonNote } from './upsertLessonNote';
export { deleteLessonNote } from './deleteLessonNote';

// ========== MARKERS ==========
export { getLessonMarkers } from './getLessonMarkers';
export { getCourseMarkersUrl, getCourseMarkers, type MarkerWithLesson } from './getCourseMarkers';
export { getCourseRecentMarkers } from './getCourseRecentMarkers';
export { upsertLessonMarker } from './upsertLessonMarker';
export { deleteLessonMarker } from './deleteLessonMarker';

// ========== PRICING ==========
export { getCoursePricing } from './getCoursePricing';
