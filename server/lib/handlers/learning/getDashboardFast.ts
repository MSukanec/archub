// api/lib/handlers/learning/getDashboardFast.ts
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

function formatCourses(courseProgressMap: Map<string, CourseProgressEntry>, courseImageMap: Map<string, string>) {
  return Array.from(courseProgressMap.values()).map(course => ({
    course_id: course.course_id,
    course_title: course.title,
    course_slug: course.slug,
    cover_url: courseImageMap.get(course.course_id) || null,
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
    cover_url: string | null;
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
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('course_id, courses!inner(id, title, slug)')
      .eq('user_id', dbUser.id);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return { success: false, error: 'Failed to fetch enrollments' };
    }

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

    // BULK QUERY 2: Get course cover images
    // Filter by category='course_cover' to get only cover images (not instructor photos, OG images, etc.)
    console.log('[getDashboardFast] ============= FETCHING COURSE IMAGES =============');
    console.log('[getDashboardFast] Course IDs:', courseIds);
    
    const { data: courseImages, error: imagesError } = await supabase
      .from('media_links')
      .select(`
        course_id,
        category,
        media_files!inner (
          file_url,
          is_deleted
        )
      `)
      .not('course_id', 'is', null)
      .in('course_id', courseIds)
      .eq('category', 'course_cover')
      .eq('media_files.is_deleted', false)
      .order('created_at', { ascending: false });
    
    console.log('[getDashboardFast] ============= QUERY RESULT =============');
    console.log('[getDashboardFast] Error:', imagesError);
    console.log('[getDashboardFast] Data count:', courseImages?.length || 0);
    console.log('[getDashboardFast] Full data:', JSON.stringify(courseImages, null, 2));

    // Build image map - first match per course wins (already sorted)
    const courseImageMap = new Map<string, string>();
    if (courseImages) {
      for (const img of courseImages) {
        console.log('[getDashboardFast] Processing image:', {
          course_id: img.course_id,
          category: img.category,
          media_files_type: Array.isArray(img.media_files) ? 'array' : typeof img.media_files,
          media_files: img.media_files
        });
        
        if (!courseImageMap.has(img.course_id)) {
          // Normalize: media_files can be array or object depending on Supabase response
          const mediaFile = Array.isArray(img.media_files) ? img.media_files[0] : img.media_files;
          console.log('[getDashboardFast] Normalized mediaFile:', mediaFile);
          
          if (mediaFile?.file_url) {
            console.log('[getDashboardFast] Setting course image:', img.course_id, '→', mediaFile.file_url);
            courseImageMap.set(img.course_id, mediaFile.file_url);
          } else {
            console.log('[getDashboardFast] NO file_url found for course:', img.course_id);
          }
        }
      }
    }
    
    console.log('[getDashboardFast] ============= FINAL IMAGE MAP =============');
    console.log('[getDashboardFast] Image map size:', courseImageMap.size);
    console.log('[getDashboardFast] Image map entries:', Array.from(courseImageMap.entries()));

    // BULK QUERY 3: Get ALL modules for these courses (NO JOINS)
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('id, course_id, title')
      .in('course_id', courseIds);

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return { success: false, error: 'Failed to fetch modules' };
    }

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

    // BULK QUERY 4: Get ALL lessons for these modules (NO JOINS)
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id, module_id, title, duration_sec, is_active')
      .in('module_id', moduleIds)
      .eq('is_active', true);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return { success: false, error: 'Failed to fetch lessons' };
    }

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

    // BULK QUERY 5: Get progress for ALL lessons (NO JOINS)
    const { data: progressData, error: progressError } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, is_completed, completed_at, last_position_sec')
      .eq('user_id', dbUser.id)
      .in('lesson_id', lessonIds);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return { success: false, error: 'Failed to fetch progress' };
    }

    // Build lookup Maps for in-memory combination
    const { moduleMap, lessonMap, progressMap } = buildLookupMaps(modules, lessons, progressData || []);

    // Initialize course progress tracking
    const courseProgressMap = seedCourseProgress(enrollments);

    // Accumulate progress data
    const { totalCompleted, totalLessons, completedLessons, totalStudyTime, activeDaysSet } = 
      accumulateProgress(lessons, moduleMap, progressMap, courseProgressMap);

    // Format output
    const courses = formatCourses(courseProgressMap, courseImageMap);
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
