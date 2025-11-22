// api/lib/handlers/learning/getCoursesFull.ts
import type { LearningHandlerContext } from './shared.js';
import { getAuthenticatedUser } from './shared.js';

export interface Course {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  is_active: boolean;
  visibility: string;
  cover_url: string | null;
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

    console.log('[getCoursesFull] ===== FETCHING COURSES WITH IMAGES =====');

    const dbUser = await getAuthenticatedUser(ctx);
    if (!dbUser) {
      return {
        success: true,
        data: { courses: [], enrollments: [], progress: [] }
      };
    }

    // Execute ALL queries in parallel for maximum speed
    const [coursesResult, enrollmentsResult, progressResult, courseImagesResult] = await Promise.all([
      // Get all active courses
      supabase
        .from('courses')
        .select('id, slug, title, short_description, is_active, visibility')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .neq('visibility', 'draft'),

      // Get user's enrollments
      supabase
        .from('course_enrollments')
        .select('id, course_id, user_id, status, created_at, updated_at, courses!inner(slug, is_deleted)')
        .eq('user_id', dbUser.id)
        .eq('courses.is_deleted', false),

      // Get user's progress from optimized view
      supabase
        .from('course_progress_view')
        .select('*')
        .eq('user_id', dbUser.id),

      // Get course cover images
      // Filter by category='course_cover' to get only cover images (not instructor photos, OG images, etc.)
      supabase
        .from('media_links')
        .select('course_id, media_files!inner(file_url), category')
        .not('course_id', 'is', null)
        .eq('category', 'course_cover')
        .eq('media_files.is_deleted', false)
        .order('created_at', { ascending: false })
    ]);

    console.log('[getCoursesFull] Courses result:', coursesResult.error ? coursesResult.error : `${coursesResult.data?.length} courses`);
    console.log('[getCoursesFull] Enrollments result:', enrollmentsResult.error ? enrollmentsResult.error : `${enrollmentsResult.data?.length} enrollments`);
    console.log('[getCoursesFull] Progress result:', progressResult.error ? progressResult.error : `${progressResult.data?.length} progress records`);
    console.log('[getCoursesFull] Course images result:', courseImagesResult.error ? courseImagesResult.error : `${courseImagesResult.data?.length} images`);
    console.log('[getCoursesFull] Course images sample data:', courseImagesResult.data?.slice(0, 2));

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

    // Course images are optional, log error but continue
    if (courseImagesResult.error) {
      console.warn('Warning fetching course images:', courseImagesResult.error);
    }

    // Build image map - first match per course wins (already sorted)
    const imageMap = new Map<string, string>();
    if (courseImagesResult.data) {
      for (const img of courseImagesResult.data) {
        if (!imageMap.has(img.course_id)) {
          // Normalize: media_files can be array or object depending on Supabase response
          const mediaFile = Array.isArray(img.media_files) ? img.media_files[0] : img.media_files;
          if (mediaFile?.file_url) {
            imageMap.set(img.course_id, mediaFile.file_url);
          }
        }
      }
    }

    // Combine courses with their cover images
    const coursesWithImages = (coursesResult.data || []).map((course: any) => ({
      ...course,
      cover_url: imageMap.get(course.id) || null
    }));

    // Flatten enrollment data
    const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
      ...e,
      course_slug: e.courses?.slug
    }));

    return {
      success: true,
      data: {
        courses: coursesWithImages,
        enrollments: enrollments,
        progress: progressResult.data || []
      }
    };
  } catch (error: any) {
    console.error('Error in getCoursesFull handler:', error);
    return { success: false, error: error.message || 'Failed to fetch courses' };
  }
}
