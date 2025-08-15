import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/Table';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubcontractTasks } from '@/hooks/use-subcontract-tasks';

interface SubcontractScopeViewProps {
  subcontract: any;
  project?: any;
}

export function SubcontractScopeView({ subcontract, project }: SubcontractScopeViewProps) {
  const { openModal } = useGlobalModalStore();
  
  // Obtener tareas del subcontrato
  const { subcontractTasks, isLoading, deleteSubcontractTask } = useSubcontractTasks(subcontract?.id || '');
  
  const handleAddTask = () => {
    openModal('subcontract-task', {
      subcontractId: subcontract.id,
      projectId: project?.id,
      isEditing: false
    });
  };

  const handleEditTask = (task: any) => {
    openModal('subcontract-task', {
      subcontractId: subcontract.id,
      projectId: project?.id,
      taskId: task.id,
      isEditing: true
    });
  };

  const handleDeleteTask = (task: any) => {
    deleteSubcontractTask.mutate(task.id);
  };

  const columns = [
    {
      key: 'task_name',
      label: 'Tarea',
      render: (item: any) => (
        <div>
          <p className="font-medium text-xs">
            {item.task_name || 'Sin nombre'}
          </p>
          {item.task_description && (
            <p className="text-xs text-muted-foreground">{item.task_description}</p>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Cantidad',
      render: (item: any) => (
        <span className="text-xs font-medium">
          {item.amount ? item.amount.toLocaleString('es-AR') : '—'}
        </span>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.unit || item.unit_symbol || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'notes',
      label: 'Notas',
      render: (item: any) => (
        <span className="text-xs text-muted-foreground">
          {item.notes || '—'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditTask(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteTask(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tabla de tareas */}
      {subcontractTasks.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="Sin tareas definidas"
          description="Agrega las tareas que formarán parte de este subcontrato para definir el alcance de trabajo. No es obligatorio, pero puede ser útil si quieres definirlas o desglosarlas."
          action={
            <Button onClick={handleAddTask}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tareas
            </Button>
          }
        />
      ) : (
        <Table
          data={subcontractTasks}
          columns={columns}
          searchKey="task_name"
          searchPlaceholder="Buscar tareas..."
        />
      )}
    </div>
  );
}