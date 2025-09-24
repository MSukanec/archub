import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUpdateConstructionTask, useInitializeCostScope } from '@/hooks/use-construction-tasks';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GripVertical, Calculator, FileText, Copy, Trash2, Info, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TaskMaterialsUnitCost from '@/components/construction/TaskMaterialsUnitCost';
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal';
import { useTaskMaterials } from '@/hooks/use-generated-tasks';
import { useTaskLabor } from '@/hooks/use-task-labor';

// Drag and Drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface BudgetTask {
  id: string;
  custom_name?: string;
  task?: {
    display_name?: string;
  };
  phase_name?: string;
  division_name?: string;
  unit?: string;
  quantity?: number;
  description?: string;
  [key: string]: any;
}

interface BudgetTreeProps {
  tasks: BudgetTask[];
  onReorder?: (reorderedTasks: BudgetTask[]) => void;
  onDuplicateTask?: (task: BudgetTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onQuantityChange?: (taskId: string, quantity: number) => void;
  onAddTask?: () => void;
}

// Component for subtotal calculation (Cantidad x Costo Unitario)
const SubtotalDisplay = ({ task, quantity }: { task: any; quantity: number }) => {
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id || task.id);
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(task.task_id || task.id);

  const isLoadingData = isLoading || laborLoading;

  // Calculate cost per unit (materials + labor)
  const costPerUnit = useMemo(() => {
    const materialsCost = materials.reduce((sum, material) => {
      const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
      const unitPrice = materialView?.avg_price || 0;
      const amount = material.amount || 0;
      return sum + (amount * unitPrice);
    }, 0);

    const laborCost = labor.reduce((sum, laborItem) => {
      const laborView = laborItem.labor_view;
      const unitPrice = laborView?.avg_price || 0;
      const amount = laborItem.quantity || 0;
      return sum + (amount * unitPrice);
    }, 0);

    return materialsCost + laborCost;
  }, [materials, labor]);

  // Calculate subtotal (quantity × cost per unit)
  const subtotal = quantity * costPerUnit;

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (isLoadingData) {
    return <span className="text-xs text-muted-foreground">...</span>;
  }

  if (subtotal === 0) {
    return <span className="text-xs text-muted-foreground">–</span>;
  }

  return (
    <span className="text-xs font-medium text-foreground">
      {formatCost(subtotal)}
    </span>
  );
};

// Component for cost breakdown popover content
const TaskCostBreakdown = ({ task }: { task: any }) => {
  // For construction tasks, use task.task_id (the generated task ID), for other tasks use task.id
  const taskId = task.task_id || task.id;
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(taskId);
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(taskId);

  const isLoading = materialsLoading || laborLoading;

  // Calcular total de materiales por unidad
  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  // Calcular total de mano de obra por unidad
  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  const totalPerUnit = materialsTotalPerUnit + laborTotalPerUnit;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[var(--card-border)]">
        <Info className="h-3 w-3 text-[var(--accent-2)]" />
        <h3 className="text-xs font-semibold text-[var(--card-fg)]">
          Costos por unidad
        </h3>
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-auto">
        {isLoading ? (
          <div className="text-center py-3">
            <div className="text-xs text-[var(--muted-fg)]">Cargando costos...</div>
          </div>
        ) : materials.length === 0 && labor.length === 0 ? (
          <div className="text-center py-3">
            <div className="text-xs text-[var(--muted-fg)]">
              No hay costos definidos para esta tarea
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sección de Materiales */}
            {materials.length > 0 && (
              <div>
                <div className="flex items-center justify-between py-1 px-2 mb-2 bg-[var(--accent-2)] text-white rounded">
                  <span className="text-xs font-semibold">Material ({materials.length})</span>
                  <span className="text-xs font-semibold">
                    $ {materialsTotalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-1">
                  {materials.map((material) => {
                    const quantity = material.amount || 0;
                    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
                    const unitPrice = materialView?.avg_price || 0;
                    const subtotal = quantity * unitPrice;
                    const unitName = materialView?.unit_of_computation || 'UD';
                    const itemName = materialView?.name || 'Material sin nombre';
                    
                    return (
                      <div key={material.id} className="flex items-start justify-between py-1">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-xs font-semibold leading-tight text-[var(--card-fg)]">
                            {itemName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-fg)]">
                            <span>{quantity} {unitName}</span>
                            <span>x</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-right font-medium text-[var(--card-fg)] min-w-[60px]">
                          $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Sección de Mano de Obra */}
            {labor.length > 0 && (
              <div>
                <div className="flex items-center justify-between py-1 px-2 mb-2 bg-[var(--accent-2)] text-white rounded">
                  <span className="text-xs font-semibold">Mano de Obra ({labor.length})</span>
                  <span className="text-xs font-semibold">
                    $ {laborTotalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-1">
                  {labor.map((laborItem) => {
                    const quantity = laborItem.quantity || 0;
                    const laborView = laborItem.labor_view;
                    const unitPrice = laborView?.avg_price || 0;
                    const subtotal = quantity * unitPrice;
                    const unitName = laborView?.unit_name || 'UD';
                    const itemName = laborView?.labor_name || 'Mano de obra sin nombre';
                    
                    return (
                      <div key={laborItem.id} className="flex items-start justify-between py-1">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-xs font-semibold leading-tight text-[var(--card-fg)]">
                            {itemName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-fg)]">
                            <span>{quantity} {unitName}</span>
                            <span>x</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-right font-medium text-[var(--card-fg)] min-w-[60px]">
                          $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Solo se muestra si hay materiales o mano de obra */}
      {!isLoading && (materials.length > 0 || labor.length > 0) && (
        <div className="px-3 py-2 flex items-center justify-between border-t border-[var(--card-border)]">
          <span className="text-xs font-semibold uppercase text-[var(--card-fg)]">TOTAL POR UNIDAD:</span>
          <div className="text-xs font-semibold text-[var(--card-fg)]">
            $ {totalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Margin Editor Component
const InlineMarginEditor = ({ 
  taskId, 
  currentMargin,
  onMarginChange 
}: { 
  taskId: string;
  currentMargin: number;
  onMarginChange: (taskId: string, margin: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentMargin.toString());

  // Update input value when currentMargin changes
  useEffect(() => {
    setInputValue(currentMargin.toString());
  }, [currentMargin]);

  const handleSave = () => {
    const numValue = parseFloat(inputValue) || 0;
    if (!isNaN(numValue)) {
      onMarginChange(taskId, numValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(currentMargin.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1 
    }).format(value);
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-8 w-16 text-xs text-right border-[var(--accent-2)]"
        step="0.1"
        min="0"
        max="100"
        autoFocus
        onFocus={(e) => e.target.select()}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="h-8 px-2 text-xs font-medium text-[var(--accent-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer border-b border-dashed border-transparent hover:border-[var(--accent-2)]"
    >
      <div className="flex items-center justify-end gap-1">
        <span>{formatDisplayValue(currentMargin)}</span>
        <span className="text-muted-foreground">%</span>
      </div>
    </button>
  );
};

// Inline Description Editor Component
const InlineDescriptionEditor = ({ 
  taskId, 
  currentDescription,
  onDescriptionChange 
}: { 
  taskId: string;
  currentDescription?: string;
  onDescriptionChange: (taskId: string, description: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentDescription || '');

  // Update input value when currentDescription changes
  useEffect(() => {
    setInputValue(currentDescription || '');
  }, [currentDescription]);

  const handleSave = () => {
    onDescriptionChange(taskId, inputValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(currentDescription || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-6 text-xs border-[var(--accent-2)]"
        placeholder="Descripción de la tarea"
        autoFocus
        onFocus={(e) => e.target.select()}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-left w-full text-xs transition-colors cursor-pointer border-b border-dashed border-transparent hover:border-[var(--accent-2)]"
    >
      {currentDescription ? (
        <span className="text-muted-foreground">{currentDescription}</span>
      ) : (
        <span className="text-[var(--accent-2)]">Agregar descripción</span>
      )}
    </button>
  );
};

// Inline Cost Type Editor Component
const InlineCostTypeEditor = ({ 
  task,
  onCostScopeChange 
}: { 
  task: any;
  onCostScopeChange: (taskId: string, newCostScope: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper function to get cost scope display text
  const getCostScopeDisplayText = (costScope: string | undefined) => {
    switch (costScope) {
      case 'materials_only':
        return 'Materiales';
      case 'labor_only':
        return 'Mano de Obra';
      case 'materials_and_labor':
      default:
        return 'Ambos';
    }
  };

  const handleCostScopeChange = (newCostScope: string) => {
    onCostScopeChange(task.id, newCostScope);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="h-8 px-2 text-xs font-medium text-[var(--accent-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer border-b border-dashed border-transparent hover:border-[var(--accent-2)]"
          >
            {getCostScopeDisplayText(task.cost_scope)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--card-fg)]">Tipo de Costo</h4>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-scope-${task.id}`}
                  value="materials_and_labor"
                  checked={(task.cost_scope || 'materials_and_labor') === 'materials_and_labor'}
                  onChange={(e) => handleCostScopeChange(e.target.value)}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Ambos</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-scope-${task.id}`}
                  value="materials_only"
                  checked={task.cost_scope === 'materials_only'}
                  onChange={(e) => handleCostScopeChange(e.target.value)}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Materiales</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-scope-${task.id}`}
                  value="labor_only"
                  checked={task.cost_scope === 'labor_only'}
                  onChange={(e) => handleCostScopeChange(e.target.value)}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Mano de Obra</span>
              </label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Inline Unit Cost Editor Component
const InlineUnitCostEditor = ({ 
  task,
  onCostTypeChange 
}: { 
  task: any;
  onCostTypeChange?: (costType: 'task' | 'independent') => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [costType, setCostType] = useState<'task' | 'independent'>('task');
  const [customCost, setCustomCost] = useState<number>(0);

  // Get current unit cost from TaskMaterialsUnitCost component logic
  const { data: materials = [] } = useTaskMaterials(task.task_id || task.id);
  const { data: labor = [] } = useTaskLabor(task.task_id || task.id);

  const taskCost = useMemo(() => {
    const materialsCost = materials.reduce((sum, material) => {
      const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
      const unitPrice = materialView?.avg_price || 0;
      const quantity = material.amount || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    const laborCost = labor.reduce((sum, laborItem) => {
      const laborView = laborItem.labor_view;
      const unitPrice = laborView?.avg_price || 0;
      const quantity = laborItem.quantity || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    return materialsCost + laborCost;
  }, [materials, labor]);

  const displayCost = costType === 'task' ? taskCost : customCost;

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex items-center justify-end">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="h-8 px-2 text-xs font-medium text-[var(--accent-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer border-b border-dashed border-transparent hover:border-[var(--accent-2)]"
          >
            {formatCost(displayCost)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--card-fg)]">Tipo de Costo</h4>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-type-${task.id}`}
                  value="task"
                  checked={costType === 'task'}
                  onChange={(e) => {
                    const newType = e.target.value as 'task';
                    setCostType(newType);
                    onCostTypeChange?.(newType);
                  }}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Costo de Tarea</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-type-${task.id}`}
                  value="independent"
                  checked={costType === 'independent'}
                  onChange={(e) => {
                    const newType = e.target.value as 'independent';
                    setCostType(newType);
                    onCostTypeChange?.(newType);
                  }}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Costo Independiente</span>
              </label>
            </div>

            {costType === 'independent' && (
              <div className="mt-3">
                <label className="block text-xs text-[var(--muted-fg)] mb-1">
                  Costo personalizado:
                </label>
                <Input
                  type="number"
                  value={customCost === 0 ? '' : customCost}
                  onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="pt-2 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-fg)]">Costo actual:</span>
                <span className="font-medium text-[var(--card-fg)]">
                  {formatCost(displayCost)}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Inline Quantity Editor Component
const InlineQuantityEditor = ({ 
  taskId, 
  currentQuantity, 
  unit,
  onQuantityChange 
}: { 
  taskId: string;
  currentQuantity: number;
  unit?: string;
  onQuantityChange: (taskId: string, quantity: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentQuantity.toString());

  // Update input value when currentQuantity changes
  useEffect(() => {
    setInputValue(currentQuantity.toString());
  }, [currentQuantity]);

  const handleSave = () => {
    const numValue = parseFloat(inputValue) || 0;
    if (!isNaN(numValue)) {
      onQuantityChange(taskId, numValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(currentQuantity.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-8 w-20 text-xs text-right border-[var(--accent-2)]"
        step="0.01"
        min="0"
        autoFocus
        onFocus={(e) => e.target.select()}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="h-8 px-2 text-xs font-medium text-[var(--accent-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer border-b border-dashed border-transparent hover:border-[var(--accent-2)]"
    >
      <div className="flex items-center justify-end gap-1">
        <span>{formatDisplayValue(currentQuantity)}</span>
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </div>
    </button>
  );
};

// Sortable Item component for drag and drop
const SortableTaskItem = ({ 
  task, 
  onSubtotalChange,
  groupSubtotal,
  totalSubtotal,
  taskSubtotals,
  itemNumber,
  onDuplicateTask,
  onDeleteTask,
  handleLocalQuantityChange,
  localQuantities,
  isLastInGroup,
  handleDescriptionChange,
  handleMarginChange
}: { 
  task: BudgetTask;
  onSubtotalChange: (taskId: string, subtotal: number) => void;
  groupSubtotal: number;
  totalSubtotal: number;
  taskSubtotals: { [taskId: string]: number };
  itemNumber: string;
  onDuplicateTask?: (task: BudgetTask) => void;
  onDeleteTask?: (taskId: string) => void;
  handleLocalQuantityChange: (taskId: string, quantity: number) => void;
  localQuantities: { [taskId: string]: number };
  isLastInGroup?: boolean;
  handleDescriptionChange: (taskId: string, description: string) => void;
  handleMarginChange: (taskId: string, margin: number) => void;
}) => {
  const [isIndependentCost, setIsIndependentCost] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get task display name
  const getTaskName = (task: BudgetTask) => {
    const customName = task.custom_name || task.task?.display_name;
    return (customName && !customName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) 
      ? customName 
      : (task.task?.display_name || 'Sin nombre');
  };

  // Helper function to get cost scope value for the Select component
  const getCostScopeValue = (costScope: string | undefined) => {
    return costScope || 'materials_and_labor'; // default value
  };

  // Cost scope change handler
  const updateConstructionTask = useUpdateConstructionTask();
  
  const handleCostScopeChange = (taskId: string, newCostScope: string) => {
    updateConstructionTask.mutate({
      id: taskId,
      cost_scope: newCostScope,
      project_id: task.project_id,
      organization_id: task.organization_id
    });
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`group grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors ${!isLastInGroup ? 'border-b border-[var(--table-row-border)]' : ''}`} 
           style={{ gridTemplateColumns: "32px 60px 1fr 100px 100px 120px 120px 100px 120px 110px 80px" }}>
        
        {/* Drag handle */}
        <div 
          {...listeners} 
          className="cursor-grab hover:cursor-grabbing p-1 hover:bg-accent-2/20 rounded flex items-center"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Item number */}
        <div className="text-xs font-medium text-muted-foreground flex items-center">
          {itemNumber}
        </div>
        
        {/* Task content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-xs">
          {/* Task name */}
          <div className="font-bold text-foreground text-xs leading-tight">
            {getTaskName(task)}
          </div>
          
          {/* Task description - always shown */}
          <div className="mt-1">
            <InlineDescriptionEditor
              taskId={task.id}
              currentDescription={task.description}
              onDescriptionChange={handleDescriptionChange}
            />
          </div>
          
          {/* Phase badge only */}
          {task.phase_name && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                {task.phase_name}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Tipo column */}
        <div className="flex items-center text-xs">
          <InlineCostTypeEditor
            task={task}
            onCostScopeChange={handleCostScopeChange}
          />
        </div>
        
        {/* Quantity + Unit column - Inline editable */}
        <div className="text-right text-xs flex items-center justify-end">
          <InlineQuantityEditor
            taskId={task.id}
            currentQuantity={localQuantities[task.id] ?? task.quantity ?? 0}
            unit={task.unit}
            onQuantityChange={handleLocalQuantityChange}
          />
        </div>
        
        {/* Unit cost column */}
        <div className="text-right text-xs flex items-center justify-end gap-1">
          <InlineUnitCostEditor 
            task={task} 
            onCostTypeChange={(costType) => setIsIndependentCost(costType === 'independent')}
          />
          {/* Information icon with cost breakdown popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isIndependentCost}
                className={`h-4 w-4 p-0 ${
                  isIndependentCost 
                    ? 'text-muted-foreground cursor-not-allowed opacity-50' 
                    : 'text-[var(--accent-2)] hover:text-[var(--accent-2)] opacity-70 hover:opacity-100'
                }`}
              >
                <Info className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            {!isIndependentCost && (
              <PopoverContent className="w-80 p-0" align="end">
                <TaskCostBreakdown task={task} />
              </PopoverContent>
            )}
          </Popover>
        </div>
        
        {/* New Subtotal column (Cantidad x Costo Unitario) */}
        <div className="text-right text-xs flex items-center justify-end">
          <SubtotalDisplay task={task} quantity={localQuantities[task.id] ?? task.quantity ?? 0} />
        </div>
        
        {/* Margin column */}
        <div className="text-right text-xs flex items-center justify-end">
          <InlineMarginEditor
            taskId={task.id}
            currentMargin={task.margin || 0}
            onMarginChange={handleMarginChange}
          />
        </div>
        
        {/* Total column (antes era Subtotal) */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs font-medium [&>span]:!text-xs">
            <TaskTotalSubtotal task={task} onSubtotalChange={onSubtotalChange} />
          </div>
        </div>
        
        {/* % de Incidencia column */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs text-muted-foreground">
            {(() => {
              const currentTaskSubtotal = taskSubtotals[task.id] || 0;
              if (groupSubtotal > 0 && currentTaskSubtotal > 0) {
                const percentage = (currentTaskSubtotal / groupSubtotal) * 100;
                return `${percentage.toFixed(1)}%`;
              }
              return '–';
            })()}
          </div>
        </div>
        
        {/* Actions column */}
        <div className="flex items-center justify-center gap-2">
          {onDuplicateTask && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicateTask(task)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDeleteTask && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Group Header component  
const GroupHeader = ({ 
  groupName, 
  tasksCount, 
  groupTasks, 
  groupSubtotal, 
  totalSubtotal,
  groupIndex 
}: { 
  groupName: string; 
  tasksCount: number; 
  groupTasks: BudgetTask[];
  groupSubtotal: number;
  totalSubtotal: number;
  groupIndex: number;
}) => {
  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const groupPercentage = totalSubtotal > 0 ? ((groupSubtotal / totalSubtotal) * 100).toFixed(1) : '0.0';

  // Calculate group subtotal sum (Cantidad x Costo Unitario sin margen)
  const groupSubtotalSum = useMemo(() => {
    return groupTasks.reduce((sum, task) => {
      const quantity = task.quantity || 0;
      
      // Get materials cost per unit
      const materialsCost = task.materials?.reduce((matSum, material) => {
        const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
        const unitPrice = materialView?.avg_price || 0;
        const amount = material.amount || 0;
        return matSum + (amount * unitPrice);
      }, 0) || 0;

      // Get labor cost per unit  
      const laborCost = task.labor?.reduce((labSum, laborItem) => {
        const laborView = laborItem.labor_view;
        const unitPrice = laborView?.avg_price || 0;
        const amount = laborItem.quantity || 0;
        return labSum + (amount * unitPrice);
      }, 0) || 0;

      const costPerUnit = materialsCost + laborCost;
      const taskSubtotal = quantity * costPerUnit;
      
      return sum + taskSubtotal;
    }, 0);
  }, [groupTasks]);

  return (
    <div 
      className="grid gap-4 px-4 py-3 text-xs font-medium"
      style={{ 
        gridTemplateColumns: "32px 60px 1fr 100px 100px 120px 120px 100px 120px 110px 80px",
        backgroundColor: "var(--table-group-header-bg)",
        color: "white"
      }}
    >
      {/* Drag handle for group */}
      <div className="flex items-center justify-center">
        <GripVertical className="h-4 w-4 text-white/70" />
      </div>
      {/* Item number for group */}
      <div className="font-bold text-xs">
        {groupIndex}
      </div>
      <div className="col-span-3">
        {groupName} ({tasksCount} {tasksCount === 1 ? 'tarea' : 'tareas'})
      </div>
      {/* Empty columns for Unit Cost and Quantity */}
      <div></div>
      <div></div>
      {/* Subtotal sum column */}
      <div className="text-right">
        <span className="font-medium">{formatCost(groupSubtotalSum)}</span>
      </div>
      {/* Empty column for Margin */}
      <div></div>
      {/* Total column (antes era Subtotal) */}
      <div className="text-right">
        <span className="font-medium">{formatCost(groupSubtotal)}</span>
      </div>
      {/* % de Incidencia column */}
      <div className="text-right">
        <span className="font-medium">{groupPercentage}%</span>
      </div>
      {/* Empty space for actions column */}
      <div></div>
    </div>
  );
};

// Component to initialize cost_scope for existing records - no longer needed, can be removed
const CostScopeInitializer = ({ projectId, organizationId }: { projectId: string, organizationId: string }) => {
  return null; // Disabled - data transformation fixed the issue
};

export function BudgetTree({ 
  tasks, 
  onReorder, 
  onDuplicateTask,
  onDeleteTask,
  onQuantityChange,
  onAddTask 
}: BudgetTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskSubtotals, setTaskSubtotals] = useState<{ [taskId: string]: number }>({});
  const [localQuantities, setLocalQuantities] = useState<{ [taskId: string]: number }>({});
  const { data: userData } = useCurrentUser();
  const updateTaskMutation = useUpdateConstructionTask();

  // Initialize cost_scope for existing records
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;
  
  // Initialize local quantities from tasks
  useEffect(() => {
    const initialQuantities: { [taskId: string]: number } = {};
    tasks.forEach(task => {
      initialQuantities[task.id] = task.quantity || 0;
    });
    setLocalQuantities(initialQuantities);
  }, [tasks]);

  // Create save function for auto-save
  const saveQuantityChanges = useCallback(async (quantities: { [taskId: string]: number }) => {
    if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
      console.warn('No project or organization selected');
      return;
    }

    // Find changes that need to be saved
    const changedTasks = Object.entries(quantities).filter(([taskId, quantity]) => {
      const originalTask = tasks.find(task => task.id === taskId);
      return originalTask && originalTask.quantity !== quantity;
    });

    // Save each changed task
    for (const [taskId, quantity] of changedTasks) {
      try {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          quantity: quantity,
          project_id: userData.preferences.last_project_id,
          organization_id: userData.preferences.last_organization_id,
        });
        console.log('Quantity saved successfully for task:', taskId, 'quantity:', quantity);
      } catch (error) {
        console.error(`Error saving quantity for task ${taskId}:`, error);
        throw error; // Re-throw to let the auto-save hook handle it
      }
    }
  }, [tasks, userData, updateTaskMutation]);

  // Handle description changes
  const handleDescriptionChange = useCallback((taskId: string, description: string) => {
    if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
      console.warn('No project or organization selected');
      return;
    }
    
    updateTaskMutation.mutate({
      id: taskId,
      description: description,
      project_id: userData.preferences.last_project_id,
      organization_id: userData.preferences.last_organization_id,
    });
  }, [updateTaskMutation, userData]);

  // Handle margin changes
  const handleMarginChange = useCallback((taskId: string, margin: number) => {
    if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
      console.warn('No project or organization selected');
      return;
    }
    
    updateTaskMutation.mutate({
      id: taskId,
      markup_pct: margin,
      project_id: userData.preferences.last_project_id,
      organization_id: userData.preferences.last_organization_id,
    });
    console.log('Margin change saved:', taskId, margin);
  }, [updateTaskMutation, userData]);

  // Use auto-save for quantity changes
  const { isSaving } = useDebouncedAutoSave({
    data: localQuantities,
    saveFn: saveQuantityChanges,
    delay: 1000, // Wait 1 second after user stops typing
    enabled: true
  });

  // Handle local quantity changes
  const handleLocalQuantityChange = (taskId: string, quantity: number) => {
    console.log('Quantity change:', taskId, quantity);
    setLocalQuantities(prev => ({
      ...prev,
      [taskId]: quantity
    }));
    // Also call the external callback if provided
    onQuantityChange?.(taskId, quantity);
  };
  
  // Handle subtotal changes from individual tasks
  const handleSubtotalChange = useCallback((taskId: string, subtotal: number) => {
    setTaskSubtotals(prev => {
      // Only update if the value actually changed to prevent unnecessary re-renders
      if (prev[taskId] === subtotal) {
        return prev;
      }
      return {
        ...prev,
        [taskId]: subtotal
      };
    });
  }, []);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by division_name
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: BudgetTask[] } = {};
    
    tasks.forEach(task => {
      const groupKey = task.division_name || 'Sin categoría';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [tasks]);
  
  // Calculate group subtotals and total
  const { groupSubtotals, totalSubtotal } = useMemo(() => {
    const groupSums: { [groupName: string]: number } = {};
    let total = 0;
    
    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      const groupSum = groupTasks.reduce((sum, task) => {
        const taskSubtotal = taskSubtotals[task.id] || 0;
        return sum + taskSubtotal;
      }, 0);
      groupSums[groupName] = groupSum;
      total += groupSum;
    });
    
    return {
      groupSubtotals: groupSums,
      totalSubtotal: total
    };
  }, [groupedTasks, taskSubtotals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find which group the dragged and target tasks belong to
    const draggedTask = tasks.find(task => task.id === active.id);
    const targetTask = tasks.find(task => task.id === over.id);
    
    if (!draggedTask || !targetTask) return;
    
    // Only allow reordering within the same group
    if ((draggedTask.division_name || 'Sin categoría') !== (targetTask.division_name || 'Sin categoría')) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (oldIndex !== newIndex && onReorder) {
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(reorderedTasks);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="mb-4">No hay tareas para mostrar</p>
          {onAddTask && (
            <Button onClick={onAddTask} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tarea
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
        {/* Initialize cost_scope for existing records */}
        {projectId && organizationId && (
          <CostScopeInitializer projectId={projectId} organizationId={organizationId} />
        )}
        <div className="space-y-0">
          {/* Main Header - Column titles */}
        <div 
          className="grid gap-4 px-4 py-3 text-xs font-medium opacity-90 sticky top-0"
          style={{ 
            gridTemplateColumns: "32px 60px 1fr 100px 100px 120px 120px 100px 120px 110px 80px",
            backgroundColor: "var(--background)",
            borderBottom: "1px solid var(--border)",
            zIndex: 10
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div>Ítem</div>
          <div>Descripción</div>
          <div>Tipo</div>
          <div className="text-right">Cantidad</div>
          <div className="text-right">Costo Unitario</div>
          <div className="text-right">Subtotal</div>
          <div className="text-right">Margen</div>
          <div className="text-right">Total</div>
          <div className="text-right">% de Incidencia</div>
          <div className="text-center">Acciones</div>
        </div>

        {/* Groups */}
        {Object.entries(groupedTasks).map(([groupName, groupTasks], groupIndex) => (
          <div key={groupName}>
            {/* Group Header */}
            <GroupHeader 
              groupName={groupName} 
              tasksCount={groupTasks.length} 
              groupTasks={groupTasks}
              groupSubtotal={groupSubtotals[groupName] || 0}
              totalSubtotal={totalSubtotal}
              groupIndex={groupIndex + 1}
            />
            
            {/* Group Tasks */}
            <SortableContext items={groupTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {groupTasks.map((task, taskIndex) => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={task} 
                    onSubtotalChange={handleSubtotalChange}
                    groupSubtotal={groupSubtotals[groupName] || 0}
                    totalSubtotal={totalSubtotal}
                    taskSubtotals={taskSubtotals}
                    itemNumber={`${groupIndex + 1}.${taskIndex + 1}`}
                    onDuplicateTask={onDuplicateTask}
                    onDeleteTask={onDeleteTask}
                    handleLocalQuantityChange={handleLocalQuantityChange}
                    localQuantities={localQuantities}
                    isLastInGroup={taskIndex === groupTasks.length - 1}
                    handleDescriptionChange={handleDescriptionChange}
                    handleMarginChange={handleMarginChange}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
        </div>
      </div>
    </DndContext>
  );
}