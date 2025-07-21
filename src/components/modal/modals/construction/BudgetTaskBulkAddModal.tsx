import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { TaskSelectionTable, SelectedTask } from '@/components/ui-custom/TaskSelectionTable';
import { useBudgetTasks } from '@/hooks/use-budget-tasks';

interface BudgetTaskBulkAddModalProps {
  modalData?: {
    budgetId?: string;
    onSuccess?: () => void;
  };
  onClose: () => void;
}

export function BudgetTaskBulkAddModal({ modalData, onClose }: BudgetTaskBulkAddModalProps) {
  const { budgetId, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener tareas ya existentes en el presupuesto para excluirlas
  const { data: existingBudgetTasks = [] } = useBudgetTasks(budgetId || '');
  const excludeTaskIds = existingBudgetTasks.map(bt => bt.task_id);

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const handleSubmit = async () => {
    if (selectedTasks.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Adding tasks to budget:', budgetId, selectedTasks);
      // TODO: Implement task addition logic here
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
    } finally {
      setIsSubmitting(false);
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
      submitDisabled={selectedTasks.length === 0 || isSubmitting}
      showLoadingSpinner={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}