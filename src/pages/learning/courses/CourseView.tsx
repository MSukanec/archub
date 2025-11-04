import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

import { Layout } from '@/components/layout/desktop/Layout';
import CourseDashboardTab from './view/CourseDashboardTab';
import CourseContentTab from './view/CourseContentTab';
import CoursePlayerTab from './view/CoursePlayerTab';
import CourseNotesTab from './view/CourseNotesTab';
import CourseMarkersTab from './view/CourseMarkersTab';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  
  // Get store state
  const storeActiveTab = useCoursePlayerStore(s => s.activeTab);
  const setStoreActiveTab = useCoursePlayerStore(s => s.setActiveTab);
  const currentLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const pendingSeek = useCoursePlayerStore(s => s.pendingSeek);
  const resetStore = useCoursePlayerStore(s => s.reset);
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  
  // Parse query params from window.location.search (more reliable than wouter's location)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const lessonParam = urlParams.get('lesson');
  const seekParam = urlParams.get('seek');
  
  const [activeTab, setActiveTab] = useState(tabParam || storeActiveTab || 'Visión General');
  
  // Initialize store with URL tab param if present (runs on mount AND when URL changes)
  useEffect(() => {
    if (tabParam && tabParam !== storeActiveTab) {
      setStoreActiveTab(tabParam as any);
      setActiveTab(tabParam);
    } else if (!tabParam && activeTab !== storeActiveTab) {
      // If no URL param, ensure local state matches store
      setActiveTab(storeActiveTab);
    }
  }, [tabParam]); // Re-run when URL changes (e.g., browser back/forward)
  
  // Sync activeTab with store ONLY when store changes from external actions (e.g., goToLesson)
  useEffect(() => {
    if (storeActiveTab !== activeTab) {
      setActiveTab(storeActiveTab);
    }
  }, [storeActiveTab]); // Note: activeTab intentionally NOT in deps to avoid loops
  
  // Reset store when leaving course view
  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);
  
  // Update URL when tab changes manually (to persist state)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setStoreActiveTab(newTab as any);
    // Update URL with tab parameter for deep linking support
    if (newTab === 'Visión General') {
      // Clear params for default tab
      navigate(`/learning/courses/${id}`);
    } else {
      // Include tab param for non-default tabs
      navigate(`/learning/courses/${id}?tab=${encodeURIComponent(newTab)}`);
    }
  };
  
  // Get course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!id && !!supabase
  });

  // Detect if coming from successful payment
  const enrolledParam = urlParams.get('enrolled');
  
  // Check if user is enrolled in this course (SECURITY CHECK)
  const { data: enrollment, isLoading: enrollmentLoading, refetch: refetchEnrollment } = useQuery({
    queryKey: ['course-enrollment', course?.id, userData?.user?.id],
    queryFn: async () => {
      if (!course?.id || !userData?.user?.id || !supabase) return null;
      
      // userData.user.id is already the UUID from users table
      const userId = userData.user.id;
      
      // Check enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) {
        return null;
      }
      
      return data;
    },
    enabled: !!course?.id && !!userData?.user?.id && !!supabase,
    staleTime: 0, // Always refetch to ensure fresh enrollment data
    gcTime: 0 // Don't cache enrollment checks
  });

  // Get last lesson in progress (for smart "Continue Course" button)
  const { data: lastLesson } = useQuery({
    queryKey: ['last-lesson-progress-header', course?.id, userData?.user?.id],
    queryFn: async () => {
      if (!course?.id || !userData?.user?.id || !supabase) return null;
      
      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', course.id);

      if (!courseModules || courseModules.length === 0) return null;

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });

      if (!courseLessons || courseLessons.length === 0) return null;

      const lessonIds = courseLessons.map(l => l.id);
      const firstLessonId = courseLessons[0].id;

      // Get the most recent lesson in progress
      const { data: progressData } = await supabase
        .from('course_lesson_progress')
        .select(`
          lesson_id,
          last_position_sec,
          is_completed,
          updated_at
        `)
        .eq('user_id', userData.user.id)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (!progressData || progressData.length === 0) {
        // No progress yet, return first lesson
        return {
          lesson_id: firstLessonId,
          last_position_sec: 0
        };
      }

      // Find first lesson that's not completed
      const inProgressLesson = progressData.find(p => !p.is_completed);
      
      // If no lesson in progress, return the most recently updated one
      const selectedLesson = inProgressLesson || progressData[0];

      return {
        lesson_id: selectedLesson.lesson_id,
        last_position_sec: selectedLesson.last_position_sec || 0
      };
    },
    enabled: !!course?.id && !!userData?.user?.id && !!supabase,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000 // Auto refresh every 15s
  });
  
  // Force refetch if coming from payment
  useEffect(() => {
    if (enrolledParam === 'true' && course?.id && userData?.user?.id) {
      refetchEnrollment();
      // Clean URL parameter
      const newUrl = window.location.pathname + (window.location.search.replace(/[?&]enrolled=true/, '').replace(/^\?$/, '') || '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [enrolledParam, course?.id, userData?.user?.id, refetchEnrollment]);

  const isLoading = courseLoading || enrollmentLoading;

  const headerTabs = [
    {
      id: 'Visión General',
      label: 'Visión General',
      isActive: activeTab === 'Visión General'
    },
    {
      id: 'Reproductor',
      label: 'Reproductor',
      isActive: activeTab === 'Reproductor'
    },
    {
      id: 'Contenido',
      label: 'Contenido',
      isActive: activeTab === 'Contenido'
    },
    {
      id: 'Apuntes',
      label: 'Apuntes',
      isActive: activeTab === 'Apuntes'
    },
    {
      id: 'Marcadores',
      label: 'Marcadores',
      isActive: activeTab === 'Marcadores'
    }
  ];

  // State to hold CoursePlayerTab navigation data
  const [navigationState, setNavigationState] = useState<{
    hasPrev: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onMarkComplete: () => void;
    isMarkingComplete: boolean;
    isCompleted: boolean;
  } | null>(null);

  const headerProps = {
    icon: BookOpen,
    title: course?.title || "Curso",
    showBackButton: true,
    onBackClick: () => {
      navigate('/learning/courses');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: handleTabChange,
    ...(activeTab === 'Visión General' && {
      actions: [
        <Button
          key="continue"
          variant="default"
          size="sm"
          onClick={() => {
            if (lastLesson) {
              goToLesson(lastLesson.lesson_id, lastLesson.last_position_sec);
            } else {
              handleTabChange('Reproductor');
            }
          }}
          data-testid="button-continue-course"
        >
          Continuar Curso
        </Button>
      ]
    }),
    ...(activeTab === 'Reproductor' && navigationState && {
      actions: [
        <Button
          key="previous"
          variant="secondary"
          size="sm"
          onClick={navigationState.onPrevious}
          disabled={!navigationState.hasPrev}
          data-testid="button-previous-lesson"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>,
        <Button
          key="next"
          variant="secondary"
          size="sm"
          onClick={navigationState.onNext}
          disabled={!navigationState.hasNext}
          data-testid="button-next-lesson"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      ]
    })
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Curso no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El curso con ID {id} no existe.
          </p>
        </div>
      </Layout>
    );
  }

  // SECURITY: Check if user is enrolled before showing course content
  if (!enrollment) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <EmptyState
          icon={<Lock />}
          title="Acceso Restringido"
          description="No tienes acceso a este curso. Necesitas inscribirte primero para poder ver su contenido."
          action={
            <Button 
              onClick={() => navigate('/learning/courses')}
              data-testid="button-back-to-courses"
            >
              Ver Cursos Disponibles
            </Button>
          }
        />
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Visión General':
        return <CourseDashboardTab courseId={course?.id} />;
      case 'Contenido':
        return <CourseContentTab courseId={course?.id} courseSlug={id} />;
      case 'Reproductor':
        return (
          <CoursePlayerTab 
            courseId={course?.id} 
            onNavigationStateChange={setNavigationState}
            initialLessonId={currentLessonId || lessonParam || undefined}
            initialSeekTime={pendingSeek ?? (seekParam ? parseInt(seekParam) : undefined)}
          />
        );
      case 'Apuntes':
        return <CourseNotesTab courseId={course?.id} courseSlug={id} />;
      case 'Marcadores':
        return <CourseMarkersTab courseId={course?.id} courseSlug={id} />;
      default:
        return null;
    }
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
