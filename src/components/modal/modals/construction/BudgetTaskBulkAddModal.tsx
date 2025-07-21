import { useState, useMemo } from 'react';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { useConstructionTasks } from '@/hooks/use-construction-tasks';
import { useBudgetTasks } from '@/hooks/use-budget-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from "@/hooks/use-toast";
import { Calculator, Plus, Search } from 'lucide-react';

interface BudgetTaskBulkAddModalProps {
  modalData: {
    budgetId: string;
    projectId: string;
    organizationId: string;
    existingTaskIds?: string[]; // IDs de tareas que ya están en el presupuesto
  };
  onClose: () => void;
}

export function BudgetTaskBulkAddModal({ 
  modalData, 
  onClose 
}: BudgetTaskBulkAddModalProps) {
  console.log('BudgetTaskBulkAddModal rendered with modalData:', modalData);
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData } = useCurrentUser();
  const { createBudgetTask } = useBudgetTasks(modalData.budgetId);

  // Obtener todas las tareas del proyecto
  const { data: allTasks = [], isLoading } = useConstructionTasks(
    modalData.projectId, 
    modalData.organizationId
  );

  // Filtrar tareas que no están ya en el presupuesto
  const availableTasks = useMemo(() => {
    const existingIds = modalData.existingTaskIds || [];
    return allTasks.filter(task => 
      !existingIds.includes(task.task_instance_id || task.id)
    );
  }, [allTasks, modalData.existingTaskIds]);

  // Filtrar tareas por búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return availableTasks;
    
    const searchLower = searchValue.toLowerCase();
    return availableTasks.filter(task => 
      task.task?.display_name?.toLowerCase().includes(searchLower) ||
      task.task?.rubro_name?.toLowerCase().includes(searchLower) ||
      task.task?.category_name?.toLowerCase().includes(searchLower) ||
      task.task?.code?.toLowerCase().includes(searchLower)
    );
  }, [availableTasks, searchValue]);

  // Manejar selección individual
  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Seleccionar/deseleccionar todas las tareas filtradas
  const handleSelectAll = () => {
    const allFilteredIds = filteredTasks.map(task => task.task_instance_id || task.id);
    const allSelected = allFilteredIds.every(id => selectedTaskIds.includes(id));
    
    if (allSelected) {
      // Deseleccionar todas las filtradas
      setSelectedTaskIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Seleccionar todas las filtradas
      setSelectedTaskIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // Agregar tareas seleccionadas al presupuesto
  const handleSubmit = async () => {
    if (selectedTaskIds.length === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos una tarea para agregar al presupuesto",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear una budget_task por cada tarea seleccionada
      const promises = selectedTaskIds.map(taskId => 
        createBudgetTask.mutateAsync({
          budget_id: modalData.budgetId,
          task_id: taskId,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
        })
      );

      await Promise.all(promises);

      toast({
        title: "Tareas agregadas",
        description: `Se agregaron ${selectedTaskIds.length} tareas al presupuesto correctamente`,
      });

      onClose();
    } catch (error) {
      console.error('Error adding tasks to budget:', error);
      toast({
        title: "Error",
        description: "No se pudieron agregar las tareas al presupuesto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por tarea, rubro o categoría..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Controles de selección */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTaskIds.length} de {filteredTasks.length} tareas seleccionadas
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {filteredTasks.every(task => selectedTaskIds.includes(task.task_instance_id || task.id))
              ? "Deseleccionar todas"
              : "Seleccionar todas"
            }
          </Button>
        </div>
      )}

      {/* Lista de tareas */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Cargando tareas disponibles...
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Calculator className="w-8 h-8 text-muted-foreground" />}
          title={searchValue ? "Sin resultados" : "No hay tareas disponibles"}
          description={
            searchValue 
              ? "No se encontraron tareas que coincidan con tu búsqueda"
              : "Todas las tareas del proyecto ya están agregadas a este presupuesto"
          }
        />
      ) : (
        <div className="border rounded-lg">
          {/* Header de la tabla */}
          <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-xs font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-3">Rubro</div>
            <div className="col-span-6">Tarea</div>
            <div className="col-span-2 text-right">Cantidad</div>
          </div>

          {/* Filas de tareas */}
          <div className="max-h-96 overflow-y-auto">
            {filteredTasks.map((task) => {
              const taskId = task.task_instance_id || task.id;
              const isSelected = selectedTaskIds.includes(taskId);

              return (
                <div
                  key={taskId}
                  className={`grid grid-cols-12 gap-4 p-3 border-b hover:bg-muted/20 cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/10' : ''
                  }`}
                  onClick={() => handleTaskToggle(taskId)}
                >
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTaskToggle(taskId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="col-span-3">
                    <Badge variant="secondary" className="text-xs">
                      {task.task?.rubro_name || 'Sin rubro'}
                    </Badge>
                  </div>
                  <div className="col-span-6">
                    <div className="text-sm font-medium leading-tight">
                      {task.task?.display_name || task.task?.task_code || 'Tarea sin nombre'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.task?.category_name || 'Sin categoría'}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="text-sm font-medium">
                      {task.quantity || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.unit_symbol || 'ud'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = viewPanel; // Mismo contenido para ambos modos

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
      rightLabel={`Agregar ${selectedTaskIds.length} tarea${selectedTaskIds.length !== 1 ? 's' : ''}`}
      onRightClick={handleSubmit}
      submitDisabled={selectedTaskIds.length === 0 || isSubmitting}
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