import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/users/hooks';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCourseOverview, useCourseEnrollment, useLastLessonInProgress, useCoursePlayerStore } from '@/features/learning';

import { Layout } from "@/layouts/dashboard/DashboardLayout";
import CourseDashboardView from '@/features/learning/views/course/CourseDashboardView';
import CourseContentView from '@/features/learning/views/course/CourseContentView';
import CoursePlayerView from '@/features/learning/views/course/CoursePlayerView';
import CourseNotesView from '@/features/learning/views/course/CourseNotesView';
import CourseMarkersView from '@/features/learning/views/course/CourseMarkersView';
import CourseForumView from '@/features/learning/views/course/CourseForumView';
import CourseFeedbackView from '@/features/learning/views/course/CourseFeedbackView';

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
  
  // 🚀 Usar hooks del feature learning
  const { data: course, isLoading: courseLoading } = useCourseOverview(id);

  // Detect if coming from successful payment
  const paymentParam = urlParams.get('payment');
  
  // 🚀 Check if user is enrolled in this course (SECURITY CHECK)
  const { data: enrollment, isLoading: enrollmentLoading, refetch: refetchEnrollment } = useCourseEnrollment(
    course?.id,
    userData?.user?.id
  );

  // 🚀 Get last lesson in progress (for smart "Continue Course" button)
  const { data: lastLesson } = useLastLessonInProgress(
    course?.id,
    userData?.user?.id
  );
  
  // Force immediate refetch if coming from payment completion to fetch fresh enrollment data
  useEffect(() => {
    if (paymentParam === 'success' && course?.id && userData?.user?.id) {
      // Refetch enrollment data immediately (ignores staleTime)
      refetchEnrollment();
      // Clean URL parameter
      const newUrl = window.location.pathname + (window.location.search.replace(/[?&]payment=success/, '').replace(/^\?$/, '') || '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [paymentParam, course?.id, userData?.user?.id, refetchEnrollment]);

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
    },
    {
      id: 'Foro',
      label: 'Foro',
      isActive: activeTab === 'Foro',
      badge: 'Nuevo'
    },
    {
      id: 'Feedback',
      label: 'Feedback',
      isActive: activeTab === 'Feedback',
      badge: 'Nuevo'
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
  // enrollment is { isEnrolled: boolean }, so we must check the property, not the object itself
  if (!enrollment?.isEnrolled) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <EmptyState
          icon={<Lock />}
          title="Acceso Restringido"
          description="No tienes acceso a este curso. Necesitas inscribirte primero para poder ver su contenido."
          action={
            <Button 
              onClick={() => navigate(`/learning/courses/${id}/info`)}
              data-testid="button-back-to-courses"
            >
              Ver Información del Curso
            </Button>
          }
        />
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Visión General':
        return <CourseDashboardView courseId={course?.id} />;
      case 'Contenido':
        return <CourseContentView courseId={course?.id} courseSlug={id} />;
      case 'Reproductor':
        return (
          <CoursePlayerView 
            courseId={course?.id} 
            onNavigationStateChange={setNavigationState}
            initialLessonId={currentLessonId || lessonParam || undefined}
            initialSeekTime={pendingSeek ?? (seekParam ? parseInt(seekParam) : undefined)}
          />
        );
      case 'Apuntes':
        return <CourseNotesView courseId={course?.id} courseSlug={id} />;
      case 'Marcadores':
        return <CourseMarkersView courseId={course?.id} courseSlug={id} />;
      case 'Foro':
        return <CourseForumView courseId={course?.id} />;
      case 'Feedback':
        return <CourseFeedbackView courseId={course?.id} />;
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
