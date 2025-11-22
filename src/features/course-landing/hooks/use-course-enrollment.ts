import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

/**
 * Check if the current user is enrolled in a specific course
 */
export function useCourseEnrollment(courseId: string) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['course-enrollment', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) {
        return { isEnrolled: false };
      }

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error checking enrollment:', error);
        return { isEnrolled: false };
      }

      return { isEnrolled: !!data };
    },
    enabled: !!user && !!courseId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
