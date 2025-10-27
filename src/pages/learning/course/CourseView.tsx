import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';

import { Layout } from '@/components/layout/desktop/Layout';
import CourseDataTab from './view/CourseDataTab';
import CourseContentTab from './view/CourseContentTab';
import CourseViewer from './view/CourseViewer';
import CourseNotesTab from './view/CourseNotesTab';
import CourseMarkersTab from './view/CourseMarkersTab';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  
  // Get store state
  const storeActiveTab = useCoursePlayerStore(s => s.activeTab);
  const setStoreActiveTab = useCoursePlayerStore(s => s.setActiveTab);
  const currentLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const pendingSeek = useCoursePlayerStore(s => s.pendingSeek);
  const resetStore = useCoursePlayerStore(s => s.reset);
  
  // Parse query params from window.location.search (more reliable than wouter's location)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const lessonParam = urlParams.get('lesson');
  const seekParam = urlParams.get('seek');
  
  const [activeTab, setActiveTab] = useState(tabParam || storeActiveTab || 'Dashboard');
  
  // Initialize store with URL tab param if present (runs on mount AND when URL changes)
  useEffect(() => {
    if (tabParam && tabParam !== storeActiveTab) {
      console.log('🔗 Sincronizando store desde URL:', tabParam);
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
      console.log('🔄 Sincronizando tab desde store:', storeActiveTab);
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
    if (newTab === 'Dashboard') {
      // Clear params for default tab
      navigate(`/learning/courses/${id}`);
    } else {
      // Include tab param for non-default tabs
      navigate(`/learning/courses/${id}?tab=${encodeURIComponent(newTab)}`);
    }
  };
  
  // Get course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', id)
        .single();
        
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!id && !!supabase
  });

  const headerTabs = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      isActive: activeTab === 'Dashboard'
    },
    {
      id: 'Contenido',
      label: 'Contenido',
      isActive: activeTab === 'Contenido'
    },
    {
      id: 'Lecciones',
      label: 'Lecciones',
      isActive: activeTab === 'Lecciones'
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

  // State to hold CourseViewer navigation data
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
    ...(activeTab === 'Dashboard' && {
      actions: [
        <Button
          key="continue"
          variant="default"
          size="sm"
          onClick={() => handleTabChange('Lecciones')}
          data-testid="button-continue-course"
        >
          Continuar Curso
        </Button>
      ]
    }),
    ...(activeTab === 'Lecciones' && navigationState && {
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
          key="complete"
          variant={navigationState.isCompleted ? "secondary" : "default"}
          size="sm"
          onClick={navigationState.onMarkComplete}
          disabled={navigationState.isMarkingComplete || navigationState.isCompleted}
          data-testid="button-mark-complete"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {navigationState.isCompleted ? 'Completada' : (navigationState.isMarkingComplete ? 'Marcando...' : 'Marcar como Completa')}
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
      <Layout headerProps={headerProps} wide>
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
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Curso no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El curso con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <CourseDataTab courseId={course?.id} />;
      case 'Contenido':
        return <CourseContentTab courseId={course?.id} />;
      case 'Lecciones':
        return (
          <CourseViewer 
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
    <Layout headerProps={headerProps} wide>
      {renderTabContent()}
    </Layout>
  );
}
