import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen, FolderPlus, FileVideo, Plus, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import AdminCourseDataView from '@/features/learning/views/admin/AdminCourseDataView';
import AdminCourseContentView from '@/features/learning/views/admin/AdminCourseContentView';
import AdminCourseMarketingView from '@/features/learning/views/admin/AdminCourseMarketingView';
import AdminCourseTestimonialsView from '@/features/learning/views/admin/AdminCourseTestimonialsView';
import AdminCourseForumView from '@/features/learning/views/admin/AdminCourseForumView';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
export default function AdminCourseSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos del Curso');
  const { openModal } = useGlobalModalStore();
  
  // Get course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const res = await fetch(`/api/admin/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!id && !!supabase
  });
  const { data: modules = [] } = useQuery({
    queryKey: ['/api/admin/modules', id],
    queryFn: async () => {
      if (!id || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const res = await fetch(`/api/admin/modules?course_id=${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    },
    enabled: !!id && !!supabase
  });
  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/admin/lessons', id],
    queryFn: async () => {
      if (!id || !supabase || modules.length === 0) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const allLessons: any[] = [];
      
      for (const module of modules) {
        const res = await fetch(`/api/admin/lessons?module_id=${module.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include'
        });
        if (res.ok) {
          const moduleLessons = await res.json();
          allLessons.push(...moduleLessons);
        }
      }
      return allLessons;
    },
    enabled: !!id && !!supabase && modules.length > 0
  });
  const handleCreateModule = () => {
    if (!id) return;
    openModal('course-module', { courseId: id });
  };
  const handleCreateLesson = () => {
    if (!id) return;
    openModal('lesson', { courseId: id });
  };
  const handleCreateTestimonial = () => {
    if (!id) return;
    openModal('testimonial', { courseId: id });
  };
  const handleCreateForumCategory = () => {
    if (!id) return;
    openModal('course-forum-category', { courseId: id, mode: 'create'});
  };
  const getHeaderActions = () => {
    if (activeTab === 'Contenido del Curso') {
      return [
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
      ];
    }
    
    if (activeTab === 'Testimonios') {
      return [
        <Button
          key="create-testimonial"
          onClick={handleCreateTestimonial}
          className="h-8 px-3 text-xs"
          data-testid="button-create-testimonial"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Testimonio
        </Button>
      ];
    }
    if (activeTab === 'Foro') {
      return [
        <Button
          key="create-forum-category"
          onClick={handleCreateForumCategory}
          className="h-8 px-3 text-xs"
          data-testid="button-create-forum-category"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Agregar Categoría
        </Button>
      ];
    }
    
    return [];
  };
  const headerTabs = [
    {
      id: 'Datos del Curso',
      label: 'Datos del Curso',
      isActive: activeTab === 'Datos del Curso'
    },
    {
      id: 'Marketing/Landing',
      label: 'Marketing/Landing',
      isActive: activeTab === 'Marketing/Landing'
    },
    {
      id: 'Contenido del Curso',
      label: 'Contenido del Curso',
      isActive: activeTab === 'Contenido del Curso'
    },
    {
      id: 'Foro',
      label: 'Foro',
      isActive: activeTab === 'Foro'
    },
    {
      id: 'Testimonios',
      label: 'Testimonios',
      isActive: activeTab === 'Testimonios'
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
    actions: getHeaderActions()
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
        return <AdminCourseDataView courseId={id} />;
      case 'Marketing/Landing':
        return <AdminCourseMarketingView courseId={id} />;
      case 'Contenido del Curso':
        return <AdminCourseContentView courseId={id} modules={modules} lessons={lessons} />;
      case 'Foro':
        return <AdminCourseForumView courseId={id} />;
      case 'Testimonios':
        return <AdminCourseTestimonialsView courseId={id} />;
      default:
        return <AdminCourseDataView courseId={id} />;
    }
  };
  return (
    <Layout headerProps={headerProps} wide>
      {renderTabContent()}
    </Layout>
  );
}
