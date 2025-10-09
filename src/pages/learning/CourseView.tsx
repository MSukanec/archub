import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

import { Layout } from '@/components/layout/desktop/Layout';
import CourseDataTab from './view/CourseDataTab';
import CourseViewer from './view/CourseViewer';
import CourseNotes from './view/CourseNotes';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos del Curso');
  
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
      id: 'Datos del Curso',
      label: 'Datos del Curso',
      isActive: activeTab === 'Datos del Curso'
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
    onTabChange: setActiveTab,
    ...(activeTab === 'Datos del Curso' && {
      actions: [
        <Button
          key="continue"
          variant="default"
          size="sm"
          onClick={() => setActiveTab('Lecciones')}
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
      case 'Datos del Curso':
        return <CourseDataTab courseId={course?.id} />;
      case 'Lecciones':
        return <CourseViewer courseId={course?.id} onNavigationStateChange={setNavigationState} />;
      case 'Apuntes':
        return <CourseNotes courseId={course?.id} />;
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
