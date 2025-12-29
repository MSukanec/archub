/**
 * Centralized Query Keys for Learning Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de learning DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: learningKeys.courseOverview(courseId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedData) {
 *   queryClient.setQueryData(learningKeys.courseProgress(courseId), updatedData)
 * }
 */

type NullableId = string | null | undefined;

export const learningKeys = {
  all: ['learning'] as const,

  // Dashboard
  dashboard: () => [...learningKeys.all, 'dashboard'] as const,
  dashboardFast: () => [...learningKeys.all, 'dashboard', 'fast'] as const,

  // Courses - Base
  courses: () => [...learningKeys.all, 'courses'] as const,
  coursesFull: () => [...learningKeys.courses(), 'full'] as const,
  coursesPublic: () => [...learningKeys.courses(), 'public'] as const,
  
  // Courses - Admin
  adminCourses: () => [...learningKeys.all, 'admin', 'courses'] as const,

  // Course Details
  course: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined] as const,
  courseOverview: (courseIdOrSlug: NullableId) => 
    [...learningKeys.courses(), courseIdOrSlug ?? undefined, 'overview'] as const,
  courseStructure: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'structure'] as const,
  courseProgress: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'progress'] as const,
  courseLanding: (slug: NullableId) => 
    [...learningKeys.courses(), slug ?? undefined, 'landing'] as const,
  courseDuration: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'duration'] as const,

  // Course Pricing
  coursePricing: (courseSlug: NullableId, currency?: string, provider?: string) => 
    [...learningKeys.courses(), courseSlug ?? undefined, 'pricing', currency, provider] as const,
  coursePrice: (courseSlug: NullableId, currency?: string, provider?: string) => 
    [...learningKeys.courses(), courseSlug ?? undefined, 'price', currency, provider] as const,

  // Course Enrollment
  courseEnrollment: (courseId: NullableId, userId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'enrollment', userId ?? undefined] as const,
  
  // Course Lessons Summary
  courseLessonsSummary: (courseIds: string[]) => 
    [...learningKeys.courses(), 'lessons-summary', ...courseIds] as const,

  // Course Notes & Markers
  courseRecentNotes: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'recent-notes'] as const,
  courseRecentMarkers: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'recent-markers'] as const,
  courseMarkers: (courseId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'markers'] as const,

  // Last Lesson in Progress
  lastLessonInProgress: (courseId: NullableId, userId: NullableId) => 
    [...learningKeys.courses(), courseId ?? undefined, 'last-lesson', userId ?? undefined] as const,

  // Study Time
  studyTime: (userId: NullableId, courseId?: NullableId) => 
    [...learningKeys.all, 'study-time', userId ?? undefined, courseId ?? undefined] as const,
  monthlyStudyTime: () => [...learningKeys.all, 'monthly-study-time'] as const,

  // Lessons
  lessons: () => [...learningKeys.all, 'lessons'] as const,
  lesson: (lessonId: NullableId) => 
    [...learningKeys.lessons(), lessonId ?? undefined] as const,
  lessonProgress: (lessonId: NullableId) => 
    [...learningKeys.lessons(), lessonId ?? undefined, 'progress'] as const,
  lessonNotes: (lessonId: NullableId) => 
    [...learningKeys.lessons(), lessonId ?? undefined, 'notes'] as const,
  lessonSummaryNote: (lessonId: NullableId) => 
    [...learningKeys.lessons(), lessonId ?? undefined, 'summary-note'] as const,
  lessonMarkers: (lessonId: NullableId) => 
    [...learningKeys.lessons(), lessonId ?? undefined, 'markers'] as const,
} as const;

export type LearningQueryKey = readonly (string | undefined)[];
