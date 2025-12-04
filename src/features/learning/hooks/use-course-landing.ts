import { useQuery } from '@tanstack/react-query';
import { fetchCourseLandingBySlug } from '../services';
import { mapModulesWithLessons, calculateCourseStats } from '../mappers';
import type { CourseLandingData } from '../types';

/**
 * Fetch complete course landing data by slug
 * PUBLIC endpoint - no authentication required
 */
export function useCourseLanding(slug: string) {
  return useQuery<CourseLandingData>({
    queryKey: ['course-landing', slug],
    queryFn: async () => {
      const rawData = await fetchCourseLandingBySlug(slug);
      
      // Map modules with lessons and calculate stats
      const modulesWithLessons = mapModulesWithLessons(
        rawData.modules,
        rawData.lessons
      );
      
      const stats = calculateCourseStats(modulesWithLessons);

      return {
        course: rawData.course,
        modules: modulesWithLessons,
        faqs: rawData.faqs,
        testimonials: rawData.testimonials,
        stats,
        clientGallery: rawData.clientGallery,
      };
    },
    enabled: !!slug,
    staleTime: 60000, // Cache for 1 minute (landing pages rarely change)
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
