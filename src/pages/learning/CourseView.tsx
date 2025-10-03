import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import { Layout } from '@/components/layout/desktop/Layout';
import CourseDataTab from './tabs/CourseDataTab';
import CourseViewer from './tabs/CourseViewer';

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

  const headerTabs = [
    {
      id: 'Datos del Curso',
      label: 'Datos del Curso',
      isActive: activeTab === 'Datos del Curso'
    },
    {
      id: 'Visor',
      label: 'Visor',
      isActive: activeTab === 'Visor'
    }
  ];

  const headerProps = {
    icon: BookOpen,
    title: course?.title || "Curso",
    showBackButton: true,
    onBackClick: () => {
      navigate('/learning/courses');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab
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
        return <CourseDataTab courseId={id} />;
      case 'Visor':
        return <CourseViewer courseId={id} />;
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
