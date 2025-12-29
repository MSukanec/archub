import { useQuery } from '@tanstack/react-query';
import { getAllPublicCourses } from '../services/public/courseLanding';
import { learningKeys } from '@/core/query-keys';
import type { Course } from '@shared/schema';

/**
 * Fetch all public courses for catalog page
 * PUBLIC endpoint - no authentication required
 */
export function useAllCourses() {
  return useQuery<Course[]>({
    queryKey: learningKeys.coursesPublic(),
    queryFn: getAllPublicCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
