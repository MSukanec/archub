import { useState, useMemo } from 'react';
import { useAllCourses, UnifiedCourseGrid, useLearningCourses } from '@/features/learning';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocation } from 'wouter';
import type { CoursesCatalogContentProps, CourseCatalogTab } from './types';

export function CoursesCatalogContent({ mode, showTabs = true }: CoursesCatalogContentProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<CourseCatalogTab>('all');
  
  const { data: publicCourses, isLoading: publicLoading, error } = useAllCourses();
  
  const { data: userData } = useCurrentUser();
  const isAuthenticated = !!userData?.user;
  
  const { data: learningData, isLoading: learningLoading } = useLearningCourses();

  const isLoading = publicLoading || learningLoading;

  const { enrollmentMap, progressMap } = useMemo(() => {
    const enrollMap = new Map<string, boolean>();
    const progMap = new Map<string, { completed: number; total: number; percentage: number }>();
    
    if (learningData) {
      learningData.enrollments?.forEach((e: any) => {
        if (e.status === 'active') {
          enrollMap.set(e.course_id, true);
        }
      });
      
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

  const coursesData = useMemo(() => {
    if (!publicCourses) return [];
    
    return publicCourses.map(course => {
      const isEnrolled = enrollmentMap.get(course.id) || false;
      const progress = progressMap.get(course.id);
      
      const courseUrl = mode === 'public' 
        ? `/cursos/${course.slug}`
        : `/learning/courses/${course.slug}`;
      
      return {
        ...course,
        isEnrolled,
        progress,
        onViewCourse: () => navigate(courseUrl),
      };
    });
  }, [publicCourses, enrollmentMap, progressMap, navigate, mode]);

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

  const enrolledCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && (c.progress?.percentage || 0) < 100).length,
    [coursesData]
  );
  
  const completedCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && c.progress?.percentage === 100).length,
    [coursesData]
  );

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
      mode={mode}
      isLoading={false}
      showTabs={showTabs && isAuthenticated}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as CourseCatalogTab)}
      enrolledCount={enrolledCount}
      completedCount={completedCount}
    />
  );
}
