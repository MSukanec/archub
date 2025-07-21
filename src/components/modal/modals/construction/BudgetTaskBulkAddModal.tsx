import React, { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Table } from '@/components/ui-custom/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, List, FolderOpen, Package } from 'lucide-react';
import { useConstructionTasks } from '@/hooks/use-construction-tasks';
import { useBudgetTasks } from '@/hooks/use-budget-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';

interface ConstructionTask {
  task_instance_id: string;
  display_name: string;
  rubro_name: string;
  quantity: number;
  unit_symbol: string;
  task_code: string;
  task?: {
    display_name: string;
    rubro_name: string;
    unit_symbol: string;
  };
}

type GroupingType = 'none' | 'rubro';

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
  const [selectedTasks, setSelectedTasks] = useState<ConstructionTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [grouping, setGrouping] = useState<GroupingType>('rubro');
  
  // Obtener datos del usuario
  const { data: userData } = useCurrentUser();
  
  // Obtener todas las tareas de construcción
  const { data: allTasks = [] } = useConstructionTasks();
  
  // Obtener tareas ya existentes en el presupuesto para excluirlas
  const { data: existingBudgetTasks = [], createMultipleBudgetTasks } = useBudgetTasks(budgetId || '');
  const excludeTaskIds = existingBudgetTasks.map(bt => bt.task_id);

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  // Filtrar tareas disponibles (excluir las ya existentes en el presupuesto)
  const availableTasks = useMemo(() => {
    return allTasks.filter(task => !excludeTaskIds.includes(task.task_instance_id));
  }, [allTasks, excludeTaskIds]);

  // Filtrar tareas por búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return availableTasks;
    
    return availableTasks.filter(task =>
      task.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.rubro_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task?.rubro_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableTasks, searchTerm]);

  // Definir columnas de la tabla
  const columns = useMemo(() => [
    {
      key: 'checkbox',
      label: '',
      render: (task: ConstructionTask) => (
        <Checkbox
          checked={selectedTasks.some(selected => selected.task_instance_id === task.task_instance_id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedTasks(prev => [...prev, task]);
            } else {
              setSelectedTasks(prev => prev.filter(t => t.task_instance_id !== task.task_instance_id));
            }
          }}
        />
      ),
      sortable: false,
      width: '40px'
    },
    {
      key: 'rubro_name',
      label: 'Rubro',
      render: (task: ConstructionTask) => (
        <div className="text-sm font-medium">
          {task.task?.rubro_name || task.rubro_name || 'Sin Rubro'}
        </div>
      ),
      sortable: true
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: ConstructionTask) => (
        <div className="text-sm line-clamp-2">
          {task.task?.display_name || task.display_name || task.task_code}
        </div>
      ),
      sortable: true
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: ConstructionTask) => (
        <div className="text-sm font-medium text-right">
          {task.quantity || 0}
        </div>
      ),
      sortable: true,
      sortType: 'number' as const,
      width: '100px'
    }
  ], [selectedTasks]);

  const handleSubmit = async () => {
    if (selectedTasks.length === 0 || !budgetId || !userData?.user?.id) {
      return;
    }

    console.log('Adding tasks to budget:', budgetId, selectedTasks);
    
    // Convertir tareas seleccionadas al formato requerido por la base de datos
    const tasksToAdd = selectedTasks.map(task => ({
      budget_id: budgetId,
      task_id: task.task_instance_id, // task_instance_id es el ID correcto
      organization_id: userData.organization.id,
      project_id: userData.preferences.last_project_id || '',
    }));

    try {
      await createMultipleBudgetTasks.mutateAsync(tasksToAdd);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
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
    <div className="space-y-4">
      {/* Controles de búsqueda y agrupación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={grouping} onValueChange={(value: GroupingType) => setGrouping(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Sin agrupar
              </div>
            </SelectItem>
            <SelectItem value="rubro">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Agrupadas por rubro
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas de selección */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Tabla usando el componente Table.tsx existente */}
      <Table
        data={filteredTasks}
        columns={columns}
        selectable={false}
        getItemId={(task) => task.task_instance_id}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No se encontraron tareas que coincidan con la búsqueda' : 'No hay tareas disponibles para agregar'}
          </div>
        }
        className="border rounded-lg"
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
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}