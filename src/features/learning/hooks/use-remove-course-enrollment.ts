import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { learningKeys } from '@/core/query-keys';
import { apiRequest } from '@/lib/queryClient';

interface RemoveEnrollmentParams {
  enrollmentId: string;
  courseId: string;
  userId: string;
  courseSlug?: string;
}

/**
 * Hook para desinscrirse de un curso
 * Invalida automáticamente todas las queries relacionadas
 */
export function useRemoveCourseEnrollment() {
  return useMutation({
    mutationFn: async ({ enrollmentId }: RemoveEnrollmentParams) => {
      const response = await apiRequest('DELETE', `/api/admin/enrollments/${enrollmentId}`);
      if (!response.ok) {
        throw new Error('Failed to remove enrollment');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      const { courseId, userId, courseSlug } = variables;

      // Invalidate enrollment queries - CRITICAL for landing page update
      queryClient.invalidateQueries({
        queryKey: learningKeys.courseEnrollment(courseId, userId),
      });

      // Invalidate course landing data if slug provided
      if (courseSlug) {
        queryClient.invalidateQueries({
          queryKey: learningKeys.courseLanding(courseSlug),
        });
      }

      // Invalidate course progress
      queryClient.invalidateQueries({
        queryKey: learningKeys.courseProgress(courseId),
      });

      // Invalidate last lesson in progress
      queryClient.invalidateQueries({
        queryKey: learningKeys.lastLessonInProgress(courseId, userId),
      });

      // Invalidate all course lessons summary
      queryClient.invalidateQueries({
        queryKey: learningKeys.courseLessonsSummary([courseId]),
      });
    },
  });
}
