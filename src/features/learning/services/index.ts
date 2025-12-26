/**
 * Learning Services - Barrel Export
 * 
 * Servicios del módulo learning organizados por categoría:
 * - Public (landing pages, course catalog)
 * - Student (dashboard, progress, notes, markers)
 * - Admin (course management) - to be added
 */
// ========== PUBLIC SERVICES ==========
export { fetchCourseLandingBySlug, getAllPublicCourses } from './public/courseLanding';
// ========== STUDENT SERVICES - DASHBOARD & COURSES ==========
export { getLearningDashboard } from './student/getLearningDashboard';
export { getLearningDashboardFast } from './student/getLearningDashboardFast';
export { getLearningCourses } from './student/getLearningCourses';
export { getCourseOverview } from './student/getCourseOverview';
export { getCourseStructure } from './student/getCourseStructure';
export { getCourseProgress } from './student/getCourseProgress';
export { getCourseEnrollment } from './student/getCourseEnrollment';
export { getLastLessonInProgress } from './student/getLastLessonInProgress';
export { getStudyTime } from './student/getStudyTime';
export { getCourseDuration } from './student/getCourseDuration';
export { getCourseLessonsSummary } from './student/getCourseLessonsSummary';
export { getLessonDetails } from './student/getLessonDetails';
export { getMonthlyStudyTime } from './student/getMonthlyStudyTime';
// ========== STUDENT SERVICES - LESSON PROGRESS ==========
export { getLessonProgress } from './student/getLessonProgress';
export { updateLessonProgress } from './student/updateLessonProgress';
export { toggleLessonFavorite } from './student/toggleLessonFavorite';
// ========== STUDENT SERVICES - NOTES ==========
export { getLessonNotes } from './student/getLessonNotes';
export { getCourseRecentNotes } from './student/getCourseRecentNotes';
export { upsertLessonNote } from './student/upsertLessonNote';
export { deleteLessonNote } from './student/deleteLessonNote';
// ========== STUDENT SERVICES - MARKERS ==========
export { getLessonMarkers } from './student/getLessonMarkers';
export { getCourseMarkersUrl, getCourseMarkers, type MarkerWithLesson } from './student/getCourseMarkers';
export { getCourseRecentMarkers } from './student/getCourseRecentMarkers';
export { upsertLessonMarker } from './student/upsertLessonMarker';
export { deleteLessonMarker } from './student/deleteLessonMarker';
// ========== STUDENT SERVICES - PRICING ==========
export { getCoursePricing } from './student/getCoursePricing';
// ========== ADMIN SERVICES - FAQS ==========
export { createCourseFaq } from './admin/createCourseFaq';
export { updateCourseFaq } from './admin/updateCourseFaq';
export { deleteCourseFaq } from './admin/deleteCourseFaq';
// ========== ADMIN SERVICES - TESTIMONIALS ==========
export { createTestimonial } from './admin/createTestimonial';
export { updateTestimonial } from './admin/updateTestimonial';
export { deleteTestimonial } from './admin/deleteTestimonial';
