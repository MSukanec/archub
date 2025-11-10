import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { TaskSelectionTable, SelectedTask } from '@/components/ui-custom/TaskSelectionTable';
import { useSubcontractTasks } from '@/hooks/use-subcontract-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';

interface SubcontractTaskFormModalProps {
  modalData?: {
    subcontractId?: string;
    projectId?: string;
    onSuccess?: () => void;
  };
  onClose: () => void;
}

export function SubcontractTaskFormModal({ modalData, onClose }: SubcontractTaskFormModalProps) {
  const { subcontractId, projectId, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  
  // Obtener datos del usuario
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  
  // Obtener tareas ya existentes en el subcontrato para excluirlas
  const { subcontractTasks: existingSubcontractTasks = [], createMultipleSubcontractTasks } = useSubcontractTasks(subcontractId || '');
  const excludeTaskIds = existingSubcontractTasks.map((st: any) => st.task_id);

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const handleSubmit = async () => {
    if (selectedTasks.length === 0 || !subcontractId || !userData?.user?.id) {
      return;
    }

    
    // Convertir tareas seleccionadas al formato requerido por la base de datos
    const tasksToAdd = selectedTasks.map(task => ({
      subcontract_id: subcontractId,
      task_id: task.task_instance_id, // task_instance_id es el ID correcto
      organization_id: currentOrganizationId || '',
      project_id: selectedProjectId || '',
      quantity: task.quantity || 1,
      unit: task.unit || '',
      notes: task.notes || ''
    }));

    try {
      await createMultipleSubcontractTasks.mutateAsync(tasksToAdd);
      onSuccess?.();
      onClose();
    } catch (error) {
      // El error se maneja en el hook con toast
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
      title="Agregar Tareas al Subcontrato"
      description="Selecciona las tareas del proyecto que deseas incluir en el alcance del subcontrato"
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={`Agregar ${selectedTasks.length > 0 ? selectedTasks.length : ''} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={handleSubmit}
      submitDisabled={selectedTasks.length === 0 || createMultipleSubcontractTasks.isPending}
      showLoadingSpinner={createMultipleSubcontractTasks.isPending}
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