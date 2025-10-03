import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, FolderPlus, FileVideo } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import { Layout } from '@/components/layout/desktop/Layout';
import AdminCourseDataTab from './view/AdminCourseDataTab';
import AdminCourseContentTab from './view/AdminCourseContentTab';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function AdminCourseView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos del Curso');
  const { openModal } = useGlobalModalStore();
  
  // Get course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!id && !!supabase
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['course-modules', id],
    queryFn: async () => {
      if (!id || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', id)
        .order('sort_index', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!supabase
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', id],
    queryFn: async () => {
      if (!id || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*, course_modules!inner(course_id)')
        .eq('course_modules.course_id', id)
        .order('sort_index', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!supabase
  });

  const handleCreateModule = () => {
    if (!id) return;
    openModal('course-module', { courseId: id });
  };

  const handleCreateLesson = () => {
    if (!id) return;
    openModal('lesson', { courseId: id });
  };

  const headerTabs = [
    {
      id: 'Datos del Curso',
      label: 'Datos del Curso',
      isActive: activeTab === 'Datos del Curso'
    },
    {
      id: 'Contenido del Curso',
      label: 'Contenido del Curso',
      isActive: activeTab === 'Contenido del Curso'
    }
  ];

  const headerProps = {
    icon: BookOpen,
    title: course?.title || "Curso",
    showBackButton: true,
    onBackClick: () => {
      navigate('/admin/courses');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actions: [
      <Button
        key="create-module"
        onClick={handleCreateModule}
        className="h-8 px-3 text-xs"
        data-testid="button-create-module"
      >
        <FolderPlus className="w-4 h-4 mr-1" />
        Agregar Módulo
      </Button>,
      <Button
        key="create-lesson"
        onClick={handleCreateLesson}
        className="h-8 px-3 text-xs"
        data-testid="button-create-lesson"
      >
        <FileVideo className="w-4 h-4 mr-1" />
        Agregar Lección
      </Button>
    ]
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
        return <AdminCourseDataTab courseId={id} />;
      case 'Contenido del Curso':
        return <AdminCourseContentTab courseId={id} modules={modules} lessons={lessons} />;
      default:
        return <AdminCourseDataTab courseId={id} />;
    }
  };

  return (
    <Layout headerProps={headerProps} wide>
      {renderTabContent()}
    </Layout>
  );
}
