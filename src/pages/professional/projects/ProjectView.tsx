import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import { Layout } from '@/components/layout/desktop/Layout';
import ProjectDataTab from '@/pages/professional/project-data/ProjectDataTab';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos del Proyecto');
  
  // Get project data
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!id && !!supabase
  });

  const headerTabs = [
    {
      id: 'Datos del Proyecto',
      label: 'Datos del Proyecto',
      isActive: activeTab === 'Datos del Proyecto'
    }
  ];

  const headerProps = {
    icon: FolderOpen,
    title: project?.name || "Proyecto",
    showBackButton: true,
    onBackClick: () => {
      navigate('/organization/projects');
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

  if (!project) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Proyecto no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El proyecto con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Datos del Proyecto':
        return <ProjectDataTab projectId={id} />;
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