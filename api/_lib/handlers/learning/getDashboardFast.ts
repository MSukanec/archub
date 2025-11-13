// api/_lib/handlers/learning/getDashboardFast.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

// Types
interface Module {
  id: string;
  course_id: string;
  title: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  duration_sec: number;
  is_active: boolean;
}

interface Progress {
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_position_sec: number;
}

interface CourseProgressEntry {
  completed: number;
  total: number;
  course_id: string;
  title: string;
  slug: string;
}

interface CompletedLesson {
  completed_at: string;
  lesson_title: string;
  module_title: string;
  course_title: string;
  course_slug: string;
}

// Pure helper functions
function buildLookupMaps(modules: Module[], lessons: Lesson[], progressData: Progress[]) {
  return {
    moduleMap: new Map(modules.map(m => [m.id, m])),
    lessonMap: new Map(lessons.map(l => [l.id, l])),
    progressMap: new Map(progressData.map(p => [p.lesson_id, p]))
  };
}

function seedCourseProgress(enrollments: any[]): Map<string, CourseProgressEntry> {
  const courseProgressMap = new Map<string, CourseProgressEntry>();
  
  for (const enrollment of enrollments) {
    const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
    courseProgressMap.set(enrollment.course_id, {
      completed: 0,
      total: 0,
      course_id: enrollment.course_id,
      title: course?.title || 'Sin título',
      slug: course?.slug || ''
    });
  }
  
  return courseProgressMap;
}

function accumulateProgress(
  lessons: Lesson[],
  moduleMap: Map<string, Module>,
  progressMap: Map<string, Progress>,
  courseProgressMap: Map<string, CourseProgressEntry>
) {
  let totalCompleted = 0;
  let totalLessons = 0;
  let totalStudyTime = 0;
  const completedLessons: CompletedLesson[] = [];
  const activeDaysSet = new Set<string>();

  for (const lesson of lessons) {
    const module = moduleMap.get(lesson.module_id);
    if (!module) continue;

    const courseId = module.course_id;
    const courseProgress = courseProgressMap.get(courseId);
    if (!courseProgress) continue;

    // Increment total lessons for this course
    courseProgress.total++;
    totalLessons++;

    // Check if this lesson is completed
    const progress = progressMap.get(lesson.id);
    if (progress) {
      // Track study time
      if (progress.last_position_sec) {
        totalStudyTime += progress.last_position_sec;
      }

      // Track completed lessons
      if (progress.is_completed) {
        courseProgress.completed++;
        totalCompleted++;

        // Track for recent completions
        if (progress.completed_at) {
          completedLessons.push({
            completed_at: progress.completed_at,
            lesson_title: lesson.title || 'Sin título',
            module_title: module.title || 'Sin módulo',
            course_title: courseProgress.title || 'Sin curso',
            course_slug: courseProgress.slug || ''
          });

          // Track active days
          const day = new Date(progress.completed_at).toISOString().slice(0, 10);
          activeDaysSet.add(day);
        }
      }
    }
  }

  return { totalCompleted, totalLessons, completedLessons, totalStudyTime, activeDaysSet };
}

function formatCourses(courseProgressMap: Map<string, CourseProgressEntry>) {
  return Array.from(courseProgressMap.values()).map(course => ({
    course_id: course.course_id,
    course_title: course.title,
    course_slug: course.slug,
    progress_pct: course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0,
    done_lessons: course.completed,
    total_lessons: course.total
  }));
}

function computeGlobalProgress(totalCompleted: number, totalLessons: number) {
  return totalLessons > 0
    ? {
        done_lessons_total: totalCompleted,
        total_lessons_total: totalLessons,
        progress_pct: Math.round((totalCompleted / totalLessons) * 100)
      }
    : null;
}

function computeRecentCompletions(completedLessons: CompletedLesson[]) {
  return completedLessons
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .slice(0, 10)
    .map(c => ({
      type: 'completed',
      when: c.completed_at,
      ...c
    }));
}

function computeStreak(activeDaysSet: Set<string>, today = new Date()): number {
  const sortedDays = Array.from(activeDaysSet).sort((a, b) => b.localeCompare(a));
  let currentStreak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (sortedDays[i] === expectedDate) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
}

// Main handler
export interface DashboardFastData {
  global: {
    done_lessons_total: number;
    total_lessons_total: number;
    progress_pct: number;
  } | null;
  courses: Array<{
    course_id: string;
    course_title: string;
    course_slug: string;
    progress_pct: number;
    done_lessons: number;
    total_lessons: number;
  }>;
  study: {
    seconds_lifetime: number;
    seconds_this_month: number;
  };
  currentStreak: number;
  activeDays: number;
  recentCompletions: any[];
}

export type GetDashboardFastResult =
  | { success: true; data: DashboardFastData }
  | { success: false; error: string };

export async function getDashboardFast(
  ctx: LearningHandlerContext
): Promise<GetDashboardFastResult> {
  try {
    const { supabase } = ctx;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return {
        success: true,
        data: {
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        }
      };
    }

    // BULK QUERY 1: Get enrollments with course info
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, courses!inner(id, title, slug)')
      .eq('user_id', dbUser.id);

    if (!enrollments || enrollments.length === 0) {
      return {
        success: true,
        data: {
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        }
      };
    }

    const courseIds = enrollments.map(e => e.course_id);

    // BULK QUERY 2: Get ALL modules for these courses (NO JOINS)
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id, course_id, title')
      .in('course_id', courseIds);

    if (!modules || modules.length === 0) {
      return {
        success: true,
        data: {
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        }
      };
    }

    const moduleIds = modules.map(m => m.id);

    // BULK QUERY 3: Get ALL lessons for these modules (NO JOINS)
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id, module_id, title, duration_sec, is_active')
      .in('module_id', moduleIds)
      .eq('is_active', true);

    if (!lessons || lessons.length === 0) {
      return {
        success: true,
        data: {
          global: null,
          courses: [],
          study: { seconds_lifetime: 0, seconds_this_month: 0 },
          currentStreak: 0,
          activeDays: 0,
          recentCompletions: []
        }
      };
    }

    const lessonIds = lessons.map(l => l.id);

    // BULK QUERY 4: Get progress for ALL lessons (NO JOINS)
    const { data: progressData } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, is_completed, completed_at, last_position_sec')
      .eq('user_id', dbUser.id)
      .in('lesson_id', lessonIds);

    // Build lookup Maps for in-memory combination
    const { moduleMap, lessonMap, progressMap } = buildLookupMaps(modules, lessons, progressData || []);

    // Initialize course progress tracking
    const courseProgressMap = seedCourseProgress(enrollments);

    // Accumulate progress data
    const { totalCompleted, totalLessons, completedLessons, totalStudyTime, activeDaysSet } = 
      accumulateProgress(lessons, moduleMap, progressMap, courseProgressMap);

    // Format output
    const courses = formatCourses(courseProgressMap);
    const globalProgress = computeGlobalProgress(totalCompleted, totalLessons);
    const recentCompletions = computeRecentCompletions(completedLessons);
    const currentStreak = computeStreak(activeDaysSet);

    return {
      success: true,
      data: {
        global: globalProgress,
        courses,
        study: {
          seconds_lifetime: totalStudyTime,
          seconds_this_month: totalStudyTime
        },
        currentStreak,
        activeDays: activeDaysSet.size,
        recentCompletions
      }
    };
  } catch (error: any) {
    console.error('Error in getDashboardFast handler:', error);
    return { success: false, error: error.message || 'Failed to fetch dashboard data' };
  }
}
