import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DollarSign, Plus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { BudgetListTab } from './view/BudgetListTab';
import { useBudgets } from "@/hooks/use-budgets";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useProjectContext } from '@/stores/projectContext';

export default function BudgetView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Lista');
  
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: budgets, isLoading } = useBudgets(selectedProjectId || undefined);
  const budget = budgets?.find(b => b.id === id);
  const { openModal } = useGlobalModalStore();

  // Función para agregar tarea
  const handleAddTask = () => {
    if (!selectedProjectId || !currentOrganizationId) {
      console.error('No project or organization selected');
      return;
    }

    openModal('budget-item', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      isEditing: false
    });
  };

  const headerTabs = [
    {
      id: 'Lista',
      label: 'Lista',
      isActive: activeTab === 'Lista'
    }
  ];

  const headerProps = {
    icon: DollarSign,
    title: budget?.name || "Presupuesto",
    showBackButton: true,
    onBackClick: () => {
      navigate('/professional/budgets');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: {
      icon: Plus,
      label: "Agregar Tarea",
      onClick: handleAddTask
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

  if (!budget) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Presupuesto no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El presupuesto con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Lista':
        return (
          <BudgetListTab
            budget={budget}
            tasks={[]} // Por ahora tasks vacías para mostrar empty state
            isLoading={false}
            onAddTask={handleAddTask}
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