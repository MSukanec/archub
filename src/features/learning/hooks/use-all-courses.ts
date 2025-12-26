import { useQuery } from '@tanstack/react-query';
import { getAllPublicCourses } from '../services/public/courseLanding';
import type { Course } from '@shared/schema';
/**
 * Fetch all public courses for catalog page
 * PUBLIC endpoint - no authentication required
 */
export function useAllCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses', 'public'],
    queryFn: getAllPublicCourses,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
