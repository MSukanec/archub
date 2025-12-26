/**
 * Data transformation utilities for the Learning module
 */

/**
 * Formats minutes to a human-readable time string.
 * 
 * @param totalMinutes - Total duration in minutes
 * @returns Formatted time string (e.g., "2h 30m" or "45m")
 * 
 * @example
 * formatMinutesToTime(150) // "2h 30m"
 * formatMinutesToTime(45)  // "45m"
 * formatMinutesToTime(0)   // "0m"
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Formats seconds to a human-readable time string.
 * 
 * @param totalSeconds - Total duration in seconds
 * @returns Formatted time string (e.g., "2h 30m" or "45m")
 * 
 * @example
 * formatSecondsToTime(5400) // "1h 30m"
 * formatSecondsToTime(2700) // "45m"
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Formats seconds to HH:MM:SS format.
 * 
 * @param totalSeconds - Total duration in seconds
 * @returns Formatted time string (e.g., "01:30:45" or "00:45:30")
 */
export function formatSecondsToHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats lesson count to a human-readable string.
 * 
 * @param count - Number of lessons
 * @returns Formatted string (e.g., "1 lección" or "10 lecciones")
 */
export function formatLessonsCount(count: number): string {
  return `${count} ${count === 1 ? 'lección' : 'lecciones'}`;
}

/**
 * Formats progress text showing completed vs total lessons.
 * 
 * @param completed - Number of completed lessons
 * @param total - Total number of lessons
 * @returns Formatted progress text (e.g., "5 de 10 lecciones")
 */
export function formatProgressText(completed: number, total: number): string {
  return `${completed} de ${total} ${total === 1 ? 'lección' : 'lecciones'}`;
}

/**
 * Maps modules and lessons arrays into modules with nested lessons.
 * Calculates total duration for each module.
 * 
 * @param modules - Array of course modules
 * @param lessons - Array of all lessons
 * @returns Array of modules with nested lessons and duration
 */
export function mapModulesWithLessons(
  modules: any[],
  lessons: any[]
): any[] {
  return modules.map(module => {
    const moduleLessons = lessons.filter(l => l.module_id === module.id);
    const totalDurationSec = moduleLessons.reduce((sum, lesson) => {
      return sum + (lesson.duration_sec || 0);
    }, 0);
    
    return {
      ...module,
      lessons: moduleLessons,
      total_duration_min: Math.ceil(totalDurationSec / 60)
    };
  });
}

/**
 * Calculates course statistics from modules with lessons.
 * 
 * @param modules - Array of modules with nested lessons
 * @returns Course statistics including totals and formatted duration
 */
export function calculateCourseStats(modules: any[]): {
  total_modules: number;
  total_lessons: number;
  total_duration_hours: number;
  total_duration_formatted: string;
} {
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalDurationMin = modules.reduce((sum, m) => sum + (m.total_duration_min || 0), 0);
  const totalDurationHours = totalDurationMin / 60;
  
  return {
    total_modules: modules.length,
    total_lessons: totalLessons,
    total_duration_hours: totalDurationHours,
    total_duration_formatted: formatMinutesToTime(totalDurationMin)
  };
}
