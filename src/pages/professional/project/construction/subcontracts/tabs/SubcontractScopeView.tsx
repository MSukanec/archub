import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { TableTopBar } from '@/components/ui-custom/tables-and-trees/TableTopBar';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubcontractTasks } from '@/hooks/use-subcontract-tasks';

interface SubcontractScopeViewProps {
  subcontract: any;
  project?: any;
}

export function SubcontractScopeView({ subcontract, project }: SubcontractScopeViewProps) {
  const { openModal } = useGlobalModalStore();
  const [groupBy, setGroupBy] = useState<string>('rubros');
  
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
      width: '60%',
      className: 'w-[60%]',
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
      key: 'unit',
      label: 'Unidad',
      width: '10%',
      className: 'w-[10%]',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.unit || item.unit_symbol || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'amount',
      label: 'Cantidad',
      width: '10%',
      className: 'w-[10%]',
      render: (item: any) => (
        <span className="text-xs font-medium">
          {item.amount ? item.amount.toLocaleString('es-AR') : '—'}
        </span>
      )
    },
    {
      key: 'notes',
      label: 'Notas',
      width: '10%',
      className: 'w-[10%]',
      render: (item: any) => (
        <span className="text-xs text-muted-foreground">
          {item.notes || '—'}
        </span>
      )
    }
  ];

  // Grupos disponibles para el TableTopBar
  const groupOptions = [
    { value: 'none', label: 'Sin Agrupar' },
    { value: 'phases', label: 'Por Fases' },
    { value: 'rubros', label: 'Por Rubros' },
    { value: 'tasks', label: 'Por Tareas' },
    { value: 'rubros-phases', label: 'Por Fases y Rubros' },
    { value: 'phases-rubros', label: 'Por Rubros y Tareas' }
  ];

  // Procesar datos para agrupación (igual que en ConstructionTasks)
  const processedTasks = useMemo(() => {
    return subcontractTasks.map((task: any) => {
      let groupKey = '';
      
      if (groupBy === 'phases') {
        groupKey = task.phase_name || 'Sin Fase';
      } else if (groupBy === 'rubros') {
        groupKey = task.rubro_name || 'Sin Rubro';
      } else if (groupBy === 'tasks') {
        groupKey = task.task_name || 'Sin Tarea';
      } else if (groupBy === 'rubros-phases') {
        groupKey = `${task.rubro_name || 'Sin Rubro'} - ${task.phase_name || 'Sin Fase'}`;
      } else if (groupBy === 'phases-rubros') {
        groupKey = `${task.phase_name || 'Sin Fase'} - ${task.rubro_name || 'Sin Rubro'}`;
      }
      
      return {
        ...task,
        groupKey
      };
    });
  }, [subcontractTasks, groupBy]);

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
          data={processedTasks}
          columns={columns}
          groupBy={groupBy === 'none' ? undefined : 'groupKey'}
          rowActions={(item) => [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEditTask(item)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteTask(item),
              variant: 'destructive' as const
            }
          ]}
          topBar={{
            tabs: groupOptions.map(opt => opt.label),
            activeTab: groupOptions.find(opt => opt.value === groupBy)?.label || 'Por Rubros',
            onTabChange: (label) => {
              const option = groupOptions.find(opt => opt.label === label);
              if (option) setGroupBy(option.value);
            },
            showSearch: true,
            searchValue: '',
            onSearchChange: () => {}
          }}
          renderGroupHeader={groupBy === 'none' ? undefined : (groupKey: string, groupRows: any[]) => (
            <>
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}