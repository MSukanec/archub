import { useMemo } from 'react';
import { useLearningCourses } from './use-learning-courses';
import { useCourseLessonsSummary } from './use-course-lessons-summary';
import type { CourseData, EnrollmentData, CourseProgressViewData } from '../services/student/getLearningCourses';
import { useLocation } from 'wouter';
export type CourseTabFilter = 'enrolled'| 'completed'| 'all';
export type EnrollmentStatus = 'enrolled'| 'completed'| 'not_enrolled';
/**
 * View-model completo para renderizar un curso.
 * Todos los campos están listos para mostrar, sin necesidad de cálculos adicionales.
 * 
 * IMPORTANTE: Este view-model incluye TODA la lógica de navegación y estado.
 * El componente de UI solo debe renderizar los datos sin ninguna lógica condicional.
 */
export interface CourseViewModel {
  id: string;
  slug: string;
  displayTitle: string;
  coverUrl: string | null;
  durationText: string;
  lessonsCountText: string;
  enrollmentStatus: EnrollmentStatus;
  progressPercent: number;
  progressText: string;
  showProgress: boolean;
  showCartIcon: boolean;
  ctaText: string;
  ctaDisabled: boolean;
  hasDuration: boolean;
  onClick: () => void;
}
/**
 * View-model para el empty state.
 * Encapsula toda la lógica de presentación del estado vacío,
 * incluyendo textos, acciones y navegación.
 * 
 * El componente solo debe renderizar sin ninguna lógica condicional.
 */
export interface EmptyStateViewModel {
  show: boolean;
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
}
export interface UseCourseListDataResult {
  courseViewModels: CourseViewModel[];
  enrolledCount: number;
  completedCount: number;
  isLoading: boolean;
  emptyState: EmptyStateViewModel;
}
/**
 * Formatea la duración en segundos a texto legible (ej: "2h 30m" o "45m").
 */
function formatDuration(totalDurationSec: number): string {
  const hours = Math.floor(totalDurationSec / 3600);
  const minutes = Math.floor((totalDurationSec % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
/**
 * Formatea el conteo de lecciones (ej: "1 lección" o "10 lecciones").
 */
function formatLessonsCount(count: number): string {
  return `${count} ${count === 1 ? 'lección': 'lecciones'}`;
}
/**
 * Formatea el texto de progreso (ej: "5 de 10 lecciones").
 */
function formatProgressText(completed: number, total: number): string {
  return `${completed} de ${total} ${total === 1 ? 'lección': 'lecciones'}`;
}
/**
 * Hook para gestionar la lógica de negocio de la lista de cursos.
 * 
 * Retorna un view-model completo con TODOS los datos formateados y listos para renderizar.
 * CourseList.tsx NO debe hacer ningún cálculo, solo mapear el view-model a JSX.
 * 
 * Encapsula:
 * - Obtención de cursos, enrollments y progreso
 * - Agregación de progreso por curso
 * - Filtrado por estado (enrolled, completed, all)
 * - Formateo de textos (duración, progreso, contadores)
 * - Determinación de estados de UI (mostrar botones, progreso, etc.)
 * - Lógica de navegación (onClick callbacks ya listos)
 * 
 * @param activeTab - Filtro activo ('enrolled'| 'completed'| 'all')
 * @param onShowAllCourses - Callback para mostrar todos los cursos (cambiar a tab 'all')
 * @returns View-model completo con datos listos para renderizar
 */
export function useCourseListData(
  activeTab: CourseTabFilter,
  onShowAllCourses?: () => void
): UseCourseListDataResult {
  const { data: fullData, isLoading: fullDataLoading } = useLearningCourses();
  const [, navigate] = useLocation();
  const courses = fullData?.courses || [];
  const courseProgressData = fullData?.progress || [];
  const enrollments = fullData?.enrollments || [];
  // DEBUG: Log course data to see if cover_url is present
  console.log('[useCourseListData] Courses:', courses.map(c => ({ id: c.id, title: c.title, cover_url: c.cover_url })));
  console.log('[useCourseListData] First course full data:', courses[0]);
  const courseIds = useMemo(() => courses.map((c: CourseData) => c.id), [courses]);
  const { data: courseLessonsSummary } = useCourseLessonsSummary(courseIds);
  // Build progress map
  const courseProgress = useMemo(() => {
    const progressMap = new Map<string, { completed: number; total: number; percentage: number; totalDurationSec: number }>();
    
    if (!courseLessonsSummary) return progressMap;
    
    courses.forEach((course: CourseData) => {
      const viewProgress = courseProgressData.find((p: CourseProgressViewData) => p.course_id === course.id);
      const lessonsSummary = courseLessonsSummary.get(course.id);
      const totalLessons = lessonsSummary?.totalLessons || 0;
      const totalDurationSec = lessonsSummary?.totalDurationSec || 0;
      
      if (viewProgress) {
        progressMap.set(course.id, {
          completed: viewProgress.done_lessons || 0,
          total: viewProgress.total_lessons || totalLessons,
          percentage: Math.round(viewProgress.progress_pct || 0),
          totalDurationSec
        });
      } else {
        progressMap.set(course.id, {
          completed: 0,
          total: totalLessons,
          percentage: 0,
          totalDurationSec
        });
      }
    });
    
    return progressMap;
  }, [courses, courseProgressData, courseLessonsSummary]);
  // Build enrollment map for quick lookup
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, boolean>();
    enrollments.forEach((e: EnrollmentData) => {
      if (e.status === 'active') {
        map.set(e.course_id, true);
      }
    });
    return map;
  }, [enrollments]);
  // Build complete view-models with all presentation logic and navigation callbacks
  const allViewModels = useMemo(() => {
    const activeCourses = courses.filter((c: CourseData) => c.is_active && c.visibility !== 'draft');
    
    return activeCourses.map((course: CourseData): CourseViewModel => {
      const progress = courseProgress.get(course.id) || { completed: 0, total: 0, percentage: 0, totalDurationSec: 0 };
      const hasEnrollment = enrollmentMap.get(course.id) || false;
      
      // Determine enrollment status
      let enrollmentStatus: EnrollmentStatus = 'not_enrolled';
      if (hasEnrollment) {
        enrollmentStatus = progress.percentage === 100 ? 'completed': 'enrolled';
      }
      // Format all presentation data
      const durationText = formatDuration(progress.totalDurationSec);
      const lessonsCountText = formatLessonsCount(progress.total);
      const progressText = formatProgressText(progress.completed, progress.total);
      const hasDuration = progress.totalDurationSec > 0;
      const showProgress = hasEnrollment;
      const showCartIcon = enrollmentStatus === 'not_enrolled';
      const ctaText = hasEnrollment ? 'Ver curso': 'Suscribirme';
      const ctaDisabled = false;
      // Create onClick callback with complete navigation logic
      // NO branching needed in the component - all logic is here
      const onClick = () => {
        if (hasEnrollment) {
          // User is enrolled - go to course view
          navigate(`/learning/courses/${course.slug}`);
        } else {
          // User is not enrolled - go to checkout
          navigate(`/checkout?course=${course.slug}`);
        }
      };
      return {
        id: course.id,
        slug: course.slug,
        displayTitle: course.title,
        coverUrl: course.cover_url || null,
        durationText,
        lessonsCountText,
        enrollmentStatus,
        progressPercent: progress.percentage,
        progressText,
        showProgress,
        showCartIcon,
        ctaText,
        ctaDisabled,
        hasDuration,
        onClick
      };
    });
  }, [courses, courseProgress, enrollmentMap, navigate]);
  // Filter view-models by active tab
  const courseViewModels = useMemo(() => {
    if (activeTab === 'enrolled') {
      return allViewModels.filter(vm => vm.enrollmentStatus === 'enrolled');
    } else if (activeTab === 'completed') {
      return allViewModels.filter(vm => vm.enrollmentStatus === 'completed');
    }
    
    return allViewModels;
  }, [allViewModels, activeTab]);
  // Calculate counts from ALL courses (not filtered)
  const enrolledCount = useMemo(() => {
    return allViewModels.filter(vm => vm.enrollmentStatus === 'enrolled').length;
  }, [allViewModels]);
  const completedCount = useMemo(() => {
    return allViewModels.filter(vm => vm.enrollmentStatus === 'completed').length;
  }, [allViewModels]);
  // Calculate empty state view-model with all presentation logic
  // NO branching needed in the component - all logic is here
  const emptyState = useMemo((): EmptyStateViewModel => {
    const isEmpty = courseViewModels.length === 0;
    
    if (!isEmpty) {
      return {
        show: false,
        title: '',
        description: ''
      };
    }
    // Empty state logic based on active tab
    if (activeTab === 'enrolled') {
      return {
        show: true,
        title: 'No tienes cursos inscritos',
        description: 'Explora nuestro catálogo y comienza a aprender hoy',
        ctaText: onShowAllCourses ? 'Ver todos los cursos': undefined,
        onCtaClick: onShowAllCourses
      };
    }
    
    if (activeTab === 'completed') {
      return {
        show: true,
        title: 'Aún no has completado ningún curso',
        description: 'Continúa con tus cursos en progreso para completarlos',
        ctaText: onShowAllCourses ? 'Ver todos los cursos': undefined,
        onCtaClick: onShowAllCourses
      };
    }
    
    // activeTab === 'all'
    return {
      show: true,
      title: 'No hay cursos disponibles',
      description: 'Actualmente no hay cursos activos para mostrar'
    };
  }, [courseViewModels.length, activeTab, onShowAllCourses]);
  return {
    courseViewModels,
    enrolledCount,
    completedCount,
    isLoading: fullDataLoading,
    emptyState
  };
}
