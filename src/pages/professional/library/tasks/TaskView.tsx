import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { CheckSquare } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { TaskMaterialsView } from './tabs/TaskMaterialsView';
import { useGeneratedTask } from "@/hooks/use-generated-tasks";

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Materiales');
  
  const { data: task, isLoading } = useGeneratedTask(id || '');

  const headerTabs = [
    {
      id: 'Materiales',
      label: 'Materiales',
      isActive: activeTab === 'Materiales'
    }
  ];

  const headerProps = {
    icon: CheckSquare,
    title: task?.custom_name || task?.name_rendered || "Tarea",
    showBackButton: true,
    onBackClick: () => navigate('/library/tasks'),
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

  if (!task) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Tarea no encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            La tarea con ID {id} no existe o no tienes permisos para verla.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Materiales':
        return (
          <TaskMaterialsView
            task={task}
          />
        );
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