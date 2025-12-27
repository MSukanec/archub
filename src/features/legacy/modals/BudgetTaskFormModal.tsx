import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { TaskSelectionTable, SelectedTask, useBudgetTasks } from '@/features/tasks';
import { useCurrentUser } from '@/features/users/hooks';

interface BudgetTaskFormModalProps {
  modalData?: {
    budgetId?: string;
    onSuccess?: () => void;
  };
  onClose: () => void;
}

export function BudgetTaskFormModal({ modalData, onClose }: BudgetTaskFormModalProps) {
  const { budgetId, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  
  const { data: userData } = useCurrentUser();
  
  const { budgetTasks: existingBudgetTasks = [], createMultipleBudgetTasks } = useBudgetTasks(budgetId || '');
  const excludeTaskIds = existingBudgetTasks.map((bt: any) => bt.task_id);

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const handleSubmit = async () => {
    if (selectedTasks.length === 0 || !budgetId || !userData?.user?.id) {
      return;
    }

    console.log('Adding tasks to budget:', budgetId, selectedTasks);
    
    const tasksToAdd = selectedTasks.map(task => ({
      budget_id: budgetId,
      task_id: task.task_instance_id,
      organization_id: userData.organization?.id || '',
      project_id: userData.preferences?.last_project_id || '',
    }));

    try {
      await createMultipleBudgetTasks.mutateAsync(tasksToAdd);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground">
        <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
        <p>Modal de agregar tareas funcionando correctamente</p>
      </div>
    </div>
  );

  const editPanel = (
    <div className="space-y-6">
      <TaskSelectionTable
        selectedTasks={selectedTasks}
        onTasksChange={setSelectedTasks}
        excludeTaskIds={excludeTaskIds}
      />
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Agregar Tareas al Presupuesto"
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={`Agregar ${selectedTasks.length > 0 ? selectedTasks.length : ''} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={handleSubmit}
      submitDisabled={selectedTasks.length === 0 || createMultipleBudgetTasks.isPending}
      showLoadingSpinner={createMultipleBudgetTasks.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      wide={true}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}
