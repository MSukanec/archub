// api/_lib/handlers/learning/getDashboard.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface DashboardEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  course_slug?: string;
}

export interface RecentCompletion {
  id: string;
  completed_at: string;
  lesson_title: string;
  module_title: string;
  course_title: string;
  course_slug: string;
  lesson_id: string;
  module_id: string;
  course_id: string;
}

export interface DashboardData {
  enrollments: DashboardEnrollment[];
  progress: any[];
  courseLessons: any[];
  recentCompletions: RecentCompletion[];
}

export type GetDashboardResult =
  | { success: true; data: DashboardData }
  | { success: false; error: string };

export async function getDashboard(
  ctx: LearningHandlerContext
): Promise<GetDashboardResult> {
  try {
    const { supabase } = ctx;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return {
        success: true,
        data: {
          enrollments: [],
          progress: [],
          courseLessons: [],
          recentCompletions: []
        }
      };
    }

    // Execute all queries in parallel for maximum speed
    const [enrollmentsResult, progressResult, courseLessonsResult, recentCompletionsResult] = await Promise.all([
      // Get enrollments with course slug
      supabase
        .from('course_enrollments')
        .select('*, courses(slug)')
        .eq('user_id', dbUser.id),

      // Get all progress
      supabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id),

      // Get all active course lessons with course info
      supabase
        .from('course_lessons')
        .select('id, module_id, course_modules!inner(course_id)')
        .eq('is_active', true),

      // Get recent completions (last 10) with lesson and course details
      supabase
        .from('course_lesson_progress')
        .select(`
          *,
          course_lessons!inner(
            id,
            title,
            course_modules!inner(
              id,
              title,
              course_id,
              courses!inner(
                id,
                title,
                slug
              )
            )
          )
        `)
        .eq('user_id', dbUser.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)
    ]);

    // Check for errors
    if (enrollmentsResult.error) {
      console.error('Error fetching enrollments:', enrollmentsResult.error);
      return { success: false, error: 'Failed to fetch enrollments' };
    }

    if (progressResult.error) {
      console.error('Error fetching progress:', progressResult.error);
      return { success: false, error: 'Failed to fetch progress' };
    }

    if (courseLessonsResult.error) {
      console.error('Error fetching course lessons:', courseLessonsResult.error);
      return { success: false, error: 'Failed to fetch course lessons' };
    }

    if (recentCompletionsResult.error) {
      console.error('Error fetching recent completions:', recentCompletionsResult.error);
      return { success: false, error: 'Failed to fetch recent completions' };
    }

    // Format enrollments to flatten course slug
    const formattedEnrollments = (enrollmentsResult.data || []).map((e: any) => ({
      ...e,
      course_slug: e.courses?.slug
    }));

    // Format recent completions to extract nested data
    const formattedCompletions = (recentCompletionsResult.data || []).map((completion: any) => {
      const lesson = completion.course_lessons;
      const module = lesson?.course_modules;
      const course = module?.courses;

      return {
        id: completion.id,
        completed_at: completion.completed_at,
        lesson_title: lesson?.title || 'Sin título',
        module_title: module?.title || 'Sin módulo',
        course_title: course?.title || 'Sin curso',
        course_slug: course?.slug || '',
        lesson_id: lesson?.id,
        module_id: module?.id,
        course_id: course?.id
      };
    });

    return {
      success: true,
      data: {
        enrollments: formattedEnrollments,
        progress: progressResult.data || [],
        courseLessons: courseLessonsResult.data || [],
        recentCompletions: formattedCompletions
      }
    };
  } catch (error: any) {
    console.error('Error in getDashboard handler:', error);
    return { success: false, error: error.message || 'Failed to fetch dashboard data' };
  }
}
