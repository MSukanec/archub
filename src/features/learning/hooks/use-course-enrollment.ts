import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Check if the current user is enrolled in a specific course
 * 
 * IMPORTANT: userId must be the `users.id` (from the users table), 
 * NOT the auth_id from Supabase Auth. The course_enrollments table
 * uses `users.id` as the foreign key.
 * 
 * @param courseId - The course UUID
 * @param userId - The user's UUID from the `users` table (NOT auth_id)
 */
export function useCourseEnrollment(courseId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['course-enrollment', courseId, userId],
    queryFn: async () => {
      if (!userId || !courseId) {
        return { isEnrolled: false };
      }

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error checking enrollment:', error);
        return { isEnrolled: false };
      }

      return { isEnrolled: !!data };
    },
    enabled: !!userId && !!courseId,
    staleTime: 5000, // Cache for 5 seconds only (quick refresh after changes)
  });
}
