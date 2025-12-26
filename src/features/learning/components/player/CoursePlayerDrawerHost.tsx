import { useMemo, useEffect, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoursePlayerStore, useCourseProgress, CourseMarkersSimple } from '@/features/learning';
import { useCourseSidebarStore } from '@/stores/sidebarStore';
import { PlayerDrawer } from './PlayerDrawer';

export function CoursePlayerDrawerHost() {
  const [match, params] = useRoute('/learning/courses/:courseSlug');
  const [location] = useLocation();
  
  const activeTab = useCoursePlayerStore(s => s.activeTab);
  const setActiveTab = useCoursePlayerStore(s => s.setActiveTab);
  
  // Sync activeTab from URL query params on mount/location change (for deep links)
  useEffect(() => {
    if (match && params?.courseSlug) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab');
      if (urlTab === 'Reproductor') {
        // Use getState() to avoid dependency on activeTab
        const currentTab = useCoursePlayerStore.getState().activeTab;
        if (currentTab !== 'Reproductor') {
          setActiveTab('Reproductor');
        }
      }
    }
  }, [location, match, params?.courseSlug, setActiveTab]);
  
  const isOnCoursePlayerTab = match && !!params?.courseSlug && activeTab === 'Reproductor';
  const courseSlug = isOnCoursePlayerTab ? params?.courseSlug : null;

  const storeLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const vimeoPlayer = useCoursePlayerStore(s => s.vimeoPlayer);
  const { currentLessonId: sidebarLessonId, modules, lessons } = useCourseSidebarStore();
  
  const activeLessonId = storeLessonId || sidebarLessonId || null;

  const { data: course } = useQuery({
    queryKey: ['course', courseSlug],
    queryFn: async () => {
      if (!courseSlug || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_deleted', false)
        .eq('slug', courseSlug)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!courseSlug && !!supabase && isOnCoursePlayerTab
  });

  const { data: progressData = [] } = useCourseProgress(course?.id);
  
  const progressMap = useMemo(() => {
    const map = new Map<string, { is_completed?: boolean; progress_pct?: number }>();
    progressData.forEach((p: any) => {
      map.set(p.lesson_id, { is_completed: p.is_completed, progress_pct: Number(p.progress_pct) });
    });
    return map;
  }, [progressData]);

  const handleLessonSelect = useCallback((lessonId: string) => {
    goToLesson(lessonId, null);
  }, [goToLesson]);

  const handleMarkerLessonSelect = useCallback((lessonId: string, timeSec: number | null) => {
    goToLesson(lessonId, timeSec);
  }, [goToLesson]);

  if (!isOnCoursePlayerTab || modules.length === 0) {
    return null;
  }

  return (
    <PlayerDrawer
      modules={modules}
      lessons={lessons}
      activeLessonId={activeLessonId}
      progressMap={progressMap}
      onLessonSelect={handleLessonSelect}
      markersContent={
        course?.id ? (
          <CourseMarkersSimple 
            courseId={course.id} 
            activeLessonId={activeLessonId}
            onMarkerClick={handleMarkerLessonSelect}
          />
        ) : undefined
      }
    />
  );
}
