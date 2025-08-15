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
      title: 'Tarea',
      render: (item: any) => (
        <div>
          <p className="font-medium text-sm">
            {item.task_instances?.task_templates?.name || item.task_instances?.name || 'Sin nombre'}
          </p>
          {item.task_instances?.task_templates?.description && (
            <p className="text-xs text-muted-foreground">{item.task_instances.task_templates.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'quantity',
      title: 'Cantidad',
      render: (item: any) => (
        <span className="text-sm font-medium">
          {item.quantity ? item.quantity.toLocaleString('es-AR') : '—'}
        </span>
      )
    },
    {
      key: 'unit',
      title: 'Unidad',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.unit || item.task_instances?.unit || item.task_instances?.task_templates?.unit || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'notes',
      title: 'Notas',
      render: (item: any) => (
        <span className="text-sm text-muted-foreground">
          {item.notes || '—'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
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
      {/* Estado para draft sin alcance */}
      {subcontract.status === 'draft' && subcontractTasks.length === 0 && (
        <Alert>
          <AlertDescription>
            Define el alcance del subcontrato agregando las tareas que deseas incluir en la licitación.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla de tareas */}
      {subcontractTasks.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="Sin tareas definidas"
          description="Agrega las tareas que formarán parte de este subcontrato para definir el alcance de trabajo"
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