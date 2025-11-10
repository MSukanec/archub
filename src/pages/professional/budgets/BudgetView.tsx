import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DollarSign, Plus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { BudgetListTab } from './view/BudgetListTab';
import { BudgetMaterialsTab } from './view/BudgetMaterialsTab';
import { useBudgets } from "@/hooks/use-budgets";
import { useBudgetItems, useCreateBudgetItem, useDeleteBudgetItem } from "@/hooks/use-budget-items";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useProjectContext } from '@/stores/projectContext';

export default function BudgetView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Listado de Items');
  
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: budgets, isLoading } = useBudgets(selectedProjectId || undefined);
  const budget = budgets?.find(b => b.id === id);
  const { data: budgetItems = [], isLoading: isLoadingItems } = useBudgetItems(id);
  const { openModal } = useGlobalModalStore();
  const createBudgetItem = useCreateBudgetItem();
  const deleteBudgetItem = useDeleteBudgetItem();

  // Función para agregar tarea
  const handleAddTask = () => {
    if (!selectedProjectId || !currentOrganizationId || !budget) {
      console.error('No project, organization or budget selected');
      return;
    }

    const modalData = {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      budgetId: budget.id,
      currencyId: budget.currency_id,
      isEditing: false
    };

    console.log('🔧 BudgetView - handleAddTask modalData:', modalData);
    openModal('budget-item', modalData);
  };

  // Función para duplicar tarea
  const handleDuplicateTask = (task: any) => {
    if (!selectedProjectId || !currentOrganizationId || !budget || !task) {
      console.error('No project, organization, budget or task selected');
      return;
    }

    // Crear una copia de la tarea sin el id y con campos actualizados
    const duplicatedData = {
      budget_id: task.budget_id,
      task_id: task.task_id,
      organization_id: task.organization_id,
      project_id: task.project_id,
      quantity: task.quantity,
      unit_price: task.unit_price || 0,
      currency_id: task.currency_id || budget.currency_id,
      markup_pct: task.markup_pct || 0,
      tax_pct: task.tax_pct || 0,
      cost_scope: task.cost_scope || 'materials_and_labor',
      created_by: task.created_by,
      description: task.description ? `${task.description} (copia)` : 'Copia',
      sort_key: task.sort_key || 0
    };

    createBudgetItem.mutate(duplicatedData);
  };

  // Función para eliminar tarea
  const handleDeleteTask = (taskId: string) => {
    if (!taskId) {
      console.error('No task ID provided');
      return;
    }

    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar tarea del presupuesto',
      description: '¿Estás seguro de que deseas eliminar esta tarea del presupuesto? Esta acción no se puede deshacer.',
      onConfirm: () => {
        deleteBudgetItem.mutate(taskId);
      }
    });
  };

  const headerTabs = [
    {
      id: 'Listado de Items',
      label: 'Listado de Items',
      isActive: activeTab === 'Listado de Items'
    },
    {
      id: 'Cómputo de Materiales',
      label: 'Cómputo de Materiales',
      isActive: activeTab === 'Cómputo de Materiales'
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
    // Solo mostrar actionButton en la tab de "Listado de Items"
    ...(activeTab === 'Listado de Items' && {
      actionButton: {
        icon: Plus,
        label: "Agregar Tarea",
        onClick: handleAddTask
      }
    })
  };

  if (isLoading || isLoadingItems) {
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
      case 'Listado de Items':
        return (
          <BudgetListTab
            budget={budget}
            tasks={budgetItems}
            isLoading={isLoadingItems}
            onAddTask={handleAddTask}
            onDuplicateTask={handleDuplicateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'Cómputo de Materiales':
        return (
          <BudgetMaterialsTab
            budget={budget}
            onNavigateToTasks={() => setActiveTab('Listado de Items')}
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