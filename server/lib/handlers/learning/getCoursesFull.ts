// api/lib/handlers/learning/getCoursesFull.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface Course {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  is_active: boolean;
  visibility: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  course_slug?: string;
}

export interface CoursesFullData {
  courses: Course[];
  enrollments: Enrollment[];
  progress: any[];
}

export type GetCoursesFullResult =
  | { success: true; data: CoursesFullData }
  | { success: false; error: string };

export async function getCoursesFull(
  ctx: LearningHandlerContext
): Promise<GetCoursesFullResult> {
  try {
    const { supabase } = ctx;

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return {
        success: true,
        data: { courses: [], enrollments: [], progress: [] }
      };
    }

    // Execute ALL queries in parallel for maximum speed
    const [coursesResult, enrollmentsResult, progressResult] = await Promise.all([
      // Get all active courses
      supabase
        .from('courses')
        .select('id, slug, title, short_description, cover_url, is_active, visibility')
        .eq('is_active', true)
        .neq('visibility', 'draft'),

      // Get user's enrollments
      supabase
        .from('course_enrollments')
        .select('id, course_id, user_id, status, created_at, updated_at, courses(slug)')
        .eq('user_id', dbUser.id),

      // Get user's progress from optimized view
      supabase
        .from('course_progress_view')
        .select('*')
        .eq('user_id', dbUser.id)
    ]);

    if (coursesResult.error) {
      console.error('Error fetching courses:', coursesResult.error);
      return { success: false, error: 'Failed to fetch courses' };
    }

    if (enrollmentsResult.error) {
      console.error('Error fetching enrollments:', enrollmentsResult.error);
      return { success: false, error: 'Failed to fetch enrollments' };
    }

    if (progressResult.error) {
      console.error('Error fetching progress:', progressResult.error);
      return { success: false, error: 'Failed to fetch progress' };
    }

    // Flatten enrollment data
    const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
      ...e,
      course_slug: e.courses?.slug
    }));

    return {
      success: true,
      data: {
        courses: coursesResult.data || [],
        enrollments: enrollments,
        progress: progressResult.data || []
      }
    };
  } catch (error: any) {
    console.error('Error in getCoursesFull handler:', error);
    return { success: false, error: error.message || 'Failed to fetch courses' };
  }
}
