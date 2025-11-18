import type { CourseModule, Lesson } from '@shared/schema';
import type { ModuleWithLessons, CourseStats } from '../types';

/**
 * Group lessons by module and calculate module durations
 */
export function mapModulesWithLessons(
  modules: CourseModule[],
  lessons: Lesson[]
): ModuleWithLessons[] {
  return modules.map((module) => {
    const moduleLessons = lessons.filter((l) => l.module_id === module.id);
    const total_duration_min = moduleLessons.reduce(
      (sum, lesson) => sum + (lesson.duration_sec || 0) / 60,
      0
    );

    return {
      ...module,
      lessons: moduleLessons,
      total_duration_min: Math.round(total_duration_min),
    };
  });
}

/**
 * Calculate course statistics
 */
export function calculateCourseStats(
  modules: ModuleWithLessons[]
): CourseStats {
  const total_lessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const total_duration_min = modules.reduce(
    (sum, m) => sum + m.total_duration_min,
    0
  );
  const total_duration_hours = total_duration_min / 60;

  return {
    total_modules: modules.length,
    total_lessons,
    total_duration_hours: Math.round(total_duration_hours * 10) / 10,
    total_duration_formatted: formatDuration(total_duration_hours),
  };
}

/**
 * Format duration hours to readable string
 * Examples: "2 horas", "3.5 horas", "65+ horas"
 */
function formatDuration(hours: number): string {
  if (hours >= 100) return '100+ horas';
  if (hours >= 50) return '50+ horas';
  if (hours % 1 === 0) return `${hours} horas`;
  return `${hours.toFixed(1)} horas`;
}

/**
 * Format minutes to MM:SS
 */
export function formatMinutesToTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hrs > 0) {
    return `${hrs}h ${mins}min`;
  }
  return `${mins}min`;
}
