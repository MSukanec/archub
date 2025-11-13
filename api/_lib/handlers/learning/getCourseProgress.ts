// api/_lib/handlers/learning/getCourseProgress.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface GetCourseProgressParams {
  courseId: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress_pct: number;
  last_position_sec: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GetCourseProgressResult =
  | { success: true; data: LessonProgress[] }
  | { success: false; error: string };

export async function getCourseProgress(
  ctx: LearningHandlerContext,
  params: GetCourseProgressParams
): Promise<GetCourseProgressResult> {
  try {
    const { supabase } = ctx;
    const { courseId } = params;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return { success: true, data: [] };
    }

    // Get all modules for the course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);

    if (modulesError || !modules) {
      console.error('Error fetching modules:', modulesError);
      return { success: false, error: 'Failed to fetch course modules' };
    }

    const moduleIds = modules.map(m => m.id);

    if (moduleIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get all lessons for these modules
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id')
      .in('module_id', moduleIds);

    if (lessonsError || !lessons) {
      console.error('Error fetching lessons:', lessonsError);
      return { success: false, error: 'Failed to fetch lessons' };
    }

    const lessonIds = lessons.map(l => l.id);

    if (lessonIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get progress for all lessons
    const { data: progress, error: progressError } = await supabase
      .from('course_lesson_progress')
      .select('*')
      .eq('user_id', dbUser.id)
      .in('lesson_id', lessonIds);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return { success: false, error: 'Failed to fetch progress' };
    }

    return { success: true, data: progress || [] };
  } catch (error: any) {
    console.error('Error in getCourseProgress handler:', error);
    return { success: false, error: error.message || 'Failed to fetch progress' };
  }
}
