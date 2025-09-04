import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { CheckSquare, Plus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { TaskCostsView } from './tabs/TaskCostsView';
import { useGeneratedTask } from "@/hooks/use-generated-tasks";

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Costos');
  
  const { data: task, isLoading } = useGeneratedTask(id || '');

  const headerTabs = [
    {
      id: 'Costos',
      label: 'Costos',
      isActive: activeTab === 'Costos'
    }
  ];

  // Función para truncar título largo
  const truncateTitle = (title: string, maxLength: number = 60) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  const headerProps = {
    icon: CheckSquare,
    title: truncateTitle(task?.custom_name || task?.name_rendered || "Tarea"),
    showBackButton: true,
    onBackClick: () => navigate('/library/tasks'),
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: {
      icon: Plus,
      label: "Agregar Costo",
      onClick: () => {
        // TODO: Implementar modal de agregar material
        console.log('Agregar material a tarea:', task?.id);
      }
    }
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
      case 'Costos':
        return (
          <TaskCostsView
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