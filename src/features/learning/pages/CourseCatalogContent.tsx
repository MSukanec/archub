import { useState, useMemo } from 'react';
import { useAllCourses, UnifiedCourseGrid, useLearningCourses } from '@/features/learning';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocation } from 'wouter';

export type CourseCatalogTab = 'all' | 'enrolled' | 'completed';

interface CourseCatalogContentProps {
  /** Show tabs for filtering courses (only shown if user is authenticated) */
  showTabs?: boolean;
}

/**
 * Shared course catalog content component
 * Used by both public catalog (/cursos) and dashboard courses (/learning/courses)
 * 
 * Features:
 * - Displays all public courses
 * - Merges enrollment and progress data if user is authenticated
 * - Shows tabs to filter by enrollment status (if authenticated)
 * - Adapts card display based on enrollment (price vs progress bar)
 */
export function CourseCatalogContent({ showTabs = true }: CourseCatalogContentProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<CourseCatalogTab>('all');
  
  // Get public courses (always available)
  const { data: publicCourses, isLoading: publicLoading, error } = useAllCourses();
  
  // Get current user (may be null if not authenticated)
  const { data: userData } = useCurrentUser();
  const isAuthenticated = !!userData?.user;
  
  // Get user's enrollments and progress (only if authenticated)
  const { data: learningData, isLoading: learningLoading } = useLearningCourses();

  const isLoading = publicLoading || learningLoading;

  // Build enrollment and progress maps
  const { enrollmentMap, progressMap } = useMemo(() => {
    const enrollMap = new Map<string, boolean>();
    const progMap = new Map<string, { completed: number; total: number; percentage: number }>();
    
    if (learningData) {
      // Map enrollments
      learningData.enrollments?.forEach((e: any) => {
        if (e.status === 'active') {
          enrollMap.set(e.course_id, true);
        }
      });
      
      // Map progress
      learningData.progress?.forEach((p: any) => {
        progMap.set(p.course_id, {
          completed: p.done_lessons || 0,
          total: p.total_lessons || 0,
          percentage: Math.round(p.progress_pct || 0),
        });
      });
    }
    
    return { enrollmentMap: enrollMap, progressMap: progMap };
  }, [learningData]);

  // Merge public courses with enrollment data
  const coursesData = useMemo(() => {
    if (!publicCourses) return [];
    
    return publicCourses.map(course => {
      const isEnrolled = enrollmentMap.get(course.id) || false;
      const progress = progressMap.get(course.id);
      
      return {
        ...course,
        isEnrolled,
        progress,
        onViewCourse: () => navigate(`/learning/courses/${course.slug}`),
      };
    });
  }, [publicCourses, enrollmentMap, progressMap, navigate]);

  // Filter courses based on active tab
  const filteredCourses = useMemo(() => {
    if (activeTab === 'all') {
      return coursesData;
    } else if (activeTab === 'enrolled') {
      return coursesData.filter(c => c.isEnrolled && (c.progress?.percentage || 0) < 100);
    } else if (activeTab === 'completed') {
      return coursesData.filter(c => c.isEnrolled && c.progress?.percentage === 100);
    }
    return coursesData;
  }, [coursesData, activeTab]);

  // Calculate counts for tabs
  const enrolledCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && (c.progress?.percentage || 0) < 100).length,
    [coursesData]
  );
  
  const completedCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && c.progress?.percentage === 100).length,
    [coursesData]
  );

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error al cargar cursos</h2>
          <p className="text-muted-foreground">
            Hubo un problema al cargar los cursos. Por favor, intenta de nuevo más tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedCourseGrid 
      courses={filteredCourses}
      isLoading={isLoading}
      showTabs={showTabs && isAuthenticated}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as CourseCatalogTab)}
      enrolledCount={enrolledCount}
      completedCount={completedCount}
    />
  );
}
