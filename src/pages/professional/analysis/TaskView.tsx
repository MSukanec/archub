import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { CheckSquare, Plus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { TaskCostsView } from './tabs/TaskCostsView';
import { TaskBasicDataView } from './tabs/TaskBasicDataView';
import { useGeneratedTask } from "@/hooks/use-generated-tasks";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos Básicos');
  
  const { data: task, isLoading } = useGeneratedTask(id || '');
  const { openModal } = useGlobalModalStore();
  
  // Detectar el origen de navegación basado en el referrer o localStorage
  const getNavigationSource = () => {
    if (typeof window === 'undefined') return 'analysis';
    
    const storedSource = localStorage.getItem('taskViewSource');
    const referrer = document.referrer;
    
    if (storedSource === 'admin' || referrer.includes('/admin/tasks')) {
      return 'admin';
    } else if (storedSource === 'budgets' || referrer.includes('/budgets')) {
      return 'budgets';
    }
    return 'analysis';
  };

  const navigationSource = getNavigationSource();

  const headerTabs = [
    {
      id: 'Datos Básicos',
      label: 'Datos Básicos',
      isActive: activeTab === 'Datos Básicos'
    },
    {
      id: 'Costos',
      label: 'Costos',
      isActive: activeTab === 'Costos'
    }
  ];

  // Mostrar nombre completo sin truncar

  const headerProps = {
    icon: CheckSquare,
    title: task?.custom_name || task?.name_rendered || "Tarea",
    showBackButton: true,
    onBackClick: () => {
      // Limpiar localStorage al salir
      localStorage.removeItem('taskViewSource');
      // Navegar según el origen
      switch (navigationSource) {
        case 'admin':
          navigate('/admin/tasks');
          break;
        case 'budgets':
          // Get budget_id from localStorage if available
          const budgetId = localStorage.getItem('taskViewSourceBudgetId');
          if (budgetId) {
            localStorage.removeItem('taskViewSourceBudgetId');
            navigate(`/professional/budgets/view/${budgetId}`);
          } else {
            navigate('/professional/budgets');
          }
          break;
        default:
          navigate('/analysis');
          break;
      }
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: activeTab === 'Costos' ? {
      icon: Plus,
      label: "Agregar Costo",
      onClick: () => {
        openModal('cost-modal', { task });
      }
    } : undefined
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
      case 'Datos Básicos':
        return (
          <TaskBasicDataView
            task={task}
            onTabChange={setActiveTab}
          />
        );
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