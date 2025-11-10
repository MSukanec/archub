import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useUpdateBudgetItem } from '@/hooks/use-budget-items';
import { useDebouncedAutoSave } from '@/components/save';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GripVertical, Calculator, FileText, Copy, Trash2, Info, Plus, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons';
import TaskMaterialsUnitCost from '@/components/construction/TaskMaterialsUnitCost';
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal';
import { useTaskMaterials } from '@/hooks/use-generated-tasks';
import { useTaskLabor } from '@/hooks/use-task-labor';
import { useOrganizationTaskPrice } from '@/hooks/use-organization-task-prices';
import { useBudgets, useUpdateBudget } from '@/hooks/use-budgets';

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
  task_id?: string;
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

// Shared grid column template for consistent alignment
const GRID_COLUMNS = "32px 60px 1fr 100px 100px 120px 120px 100px 120px 110px 80px";

interface BudgetTreeProps {
  tasks: BudgetTask[];
  budgetId?: string;
  projectId?: string;
  onReorder?: (sourceIndex: number, destinationIndex: number, draggedTask: BudgetTask) => void;
  onDuplicateTask?: (task: BudgetTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onQuantityChange?: (taskId: string, quantity: number) => void;
  onAddTask?: () => void;
  onTotalsChange?: (totalSubtotals: number, totalFinals: number) => void;
}

// Component for subtotal calculation (Cantidad x Costo Unitario)
const SubtotalDisplay = ({ task, quantity, archubCost, onPureSubtotalChange }: { 
  task: any; 
  quantity: number; 
  archubCost: number;
  onPureSubtotalChange?: (taskId: string, pureSubtotal: number) => void; 
}) => {
  // Use saved unit_price if available and greater than 0, otherwise fallback to Archub cost
  const unitPrice = task.unit_price !== null && task.unit_price !== undefined && task.unit_price > 0 ? task.unit_price : archubCost;
  
  // Calculate subtotal (quantity × unit_price)
  const subtotal = quantity * unitPrice;

  // Report pure subtotal change
  useEffect(() => {
    if (onPureSubtotalChange && subtotal >= 0) {
      const taskId = task.id; // Use task.id (same as taskSubtotals) instead of task.task_id
      onPureSubtotalChange(taskId, subtotal);
    }
  }, [onPureSubtotalChange, subtotal, task]);

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

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

// Task Action Buttons Component for Budget
const TaskActionButtons = ({ 
  task, 
  onDuplicateTask, 
  onDeleteTask 
}: { 
  task: BudgetTask; 
  onDuplicateTask?: (task: BudgetTask) => void; 
  onDeleteTask?: (taskId: string) => void; 
}) => {
  const [, navigate] = useLocation();

  // Handle view task navigation with source tracking
  const handleViewTask = () => {
    // Ensure we have a task_id to navigate to
    if (!task.task_id) {
      return;
    }
    
    // Set source and budget_id in localStorage so TaskView knows where we came from
    localStorage.setItem('taskViewSource', 'budgets');
    if (task.budget_id) {
      localStorage.setItem('taskViewSourceBudgetId', task.budget_id);
    }
    // Navigate to task view using the correct route
    navigate(`/analysis/${task.task_id}`);
  };

  // Eye button for viewing task details - only show if task_id exists
  const viewButton = task.task_id ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleViewTask}
      className="h-8 w-8 p-0"
      title="Ver detalles de la tarea"
    >
      <Eye className="h-4 w-4" />
    </Button>
  ) : null;

  return (
    <TableActionButtons
      onEdit={onDuplicateTask ? () => onDuplicateTask(task) : undefined}
      onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
      editLabel="Duplicar"
      deleteLabel="Eliminar"
      additionalButtons={[viewButton]}
    />
  );
};

// Budget Summary Row Component
const BudgetSummaryRow = ({ 
  totalSubtotals, 
  totalFinals,
  budgetId,
  initialDiscountPct = 0,
  initialDiscountAmount = 0,
  initialTaxPct = 21,
  onBudgetUpdate
}: { 
  totalSubtotals: number; 
  totalFinals: number;
  budgetId?: string;
  initialDiscountPct?: number;
  initialDiscountAmount?: number;
  initialTaxPct?: number;
  onBudgetUpdate?: (updates: { discount_pct?: number; tax_pct?: number }) => void;
}) => {
  const [discountPct, setDiscountPct] = useState(initialDiscountPct);
  const [discountAmount, setDiscountAmount] = useState(initialDiscountAmount);
  const [taxPct, setTaxPct] = useState(initialTaxPct);
  const [localDiscountPct, setLocalDiscountPct] = useState(initialDiscountPct.toString());
  const [localTaxPct, setLocalTaxPct] = useState(initialTaxPct.toString());
  
  // Update local state when props change (budget data loads)
  useEffect(() => {
    setDiscountPct(initialDiscountPct);
    setDiscountAmount(initialDiscountAmount);
    setTaxPct(initialTaxPct);
    setLocalDiscountPct(initialDiscountPct.toString());
    setLocalTaxPct(initialTaxPct.toString());
  }, [initialDiscountPct, initialDiscountAmount, initialTaxPct]);
  const [editingField, setEditingField] = useState<string | null>(null);

  // State for tracking changes to save
  const [budgetUpdates, setBudgetUpdates] = useState<{ discount_pct?: number; tax_pct?: number }>({});

  // Debounced save function
  const { isSaving } = useDebouncedAutoSave({
    data: budgetUpdates,
    saveFn: useCallback(async (updates: { discount_pct?: number; tax_pct?: number }) => {
      if (onBudgetUpdate && Object.keys(updates).length > 0) {
        onBudgetUpdate(updates);
      }
    }, [onBudgetUpdate]),
    delay: 500,
    enabled: true
  });

  // Calculate discount amount based on percentage
  const calculateDiscountAmount = (percentage: number) => {
    return (totalFinals * percentage) / 100;
  };

  // Calculate final totals
  const discountValue = discountPct > 0 ? calculateDiscountAmount(discountPct) : discountAmount;
  const totalAfterDiscount = totalFinals - discountValue;
  const taxAmount = (totalAfterDiscount * taxPct) / 100;
  const grandTotal = totalAfterDiscount + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1 
    }).format(value);
  };

  // Handle discount percentage change
  const handleDiscountPctChange = (value: string) => {
    setLocalDiscountPct(value);
    const numValue = parseFloat(value) || 0;
    setDiscountPct(numValue);
    setDiscountAmount(0); // Reset fixed amount when using percentage
    setBudgetUpdates({ discount_pct: numValue });
  };

  // Handle Tax percentage change
  const handleTaxPctChange = (value: string) => {
    setLocalTaxPct(value);
    const numValue = parseFloat(value) || 0;
    setTaxPct(numValue);
    setBudgetUpdates(prev => ({ ...prev, tax_pct: numValue }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      setEditingField(null);
    } else if (e.key === 'Escape') {
      // Reset to previous values
      if (field === 'discount') {
        setLocalDiscountPct(discountPct.toString());
      } else if (field === 'tax') {
        setLocalTaxPct(taxPct.toString());
      }
      setEditingField(null);
    }
  };

  // Percentage of total (always 100% for summary)
  const percentageOfTotal = 100;

  return (
    <div>
      {/* Summary Title Row - Separador */}
      <div 
        className="grid gap-4 px-4 py-3 text-xs font-bold"
        style={{ 
          gridTemplateColumns: GRID_COLUMNS,
          backgroundColor: "var(--table-group-header-bg)",
          color: "white"
        }}
      >
        <div></div> {/* Empty space for drag handle column */}
        <div></div> {/* Empty space for item number column */}
        <div></div> {/* Empty space for description column */}
        <div></div> {/* Empty space for type column */}
        <div></div> {/* Empty space for quantity column */}
        <div></div> {/* Empty space for unit cost column */}
        <div className="flex items-center font-bold">RESUMEN</div> {/* SUBTOTAL column */}
        <div></div> {/* Empty space for margin column */}
        <div></div> {/* Empty space for total column */}
        <div></div> {/* Empty space for percentage column */}
        <div></div> {/* Empty space for actions column */}
      </div>

      {/* Subtotal General Row */}
      <div className="relative">
        <div 
          className="grid gap-4 px-4 py-3 text-xs"
          style={{ 
            gridTemplateColumns: GRID_COLUMNS,
            backgroundColor: "var(--table-row-bg)"
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div></div> {/* Empty space for item number column */}
          <div></div> {/* Empty space for description column */}
          <div></div> {/* Empty space for type column */}
          <div></div> {/* Empty space for quantity column */}
          <div></div> {/* Empty space for unit cost column */}
          <div className="flex items-center font-medium" style={{ color: "var(--table-row-fg)" }}>
            Subtotal General
          </div> {/* SUBTOTAL column */}
          <div></div> {/* Margin column */}
          <div className="flex items-center justify-end font-semibold" style={{ color: "var(--table-row-fg)" }}>
            {formatCurrency(totalFinals)}
          </div> {/* TOTAL column */}
          <div></div> {/* Empty space for percentage column */}
          <div></div> {/* Empty space for actions column */}
        </div>
        {/* Continuous line from SUBTOTAL to TOTAL */}
        <div 
          className="absolute bottom-0 h-px"
          style={{ 
            backgroundColor: "var(--table-row-border)",
            left: "60%", /* Approximate start at SUBTOTAL column */
            right: "18%" /* Approximate end after TOTAL column */
          }}
        />
      </div>

      {/* Discount Row */}
      <div className="relative">
        <div 
          className="grid gap-4 px-4 py-3 text-xs"
          style={{ 
            gridTemplateColumns: GRID_COLUMNS,
            backgroundColor: "var(--table-row-bg)"
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div></div> {/* Empty space for item number column */}
          <div></div> {/* Empty space for description column */}
          <div></div> {/* Empty space for type column */}
          <div></div> {/* Empty space for quantity column */}
          <div></div> {/* Empty space for unit cost column */}
          <div className="flex items-center font-medium" style={{ color: "var(--table-row-fg)" }}> {/* SUBTOTAL column with editable percentage */}
            <span className="mr-1">Descuento</span>
            <span className="text-gray-600">(</span>
            {editingField === 'discount' ? (
              <Input
                type="number"
                value={localDiscountPct}
                onChange={(e) => handleDiscountPctChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'discount')}
                onBlur={() => setEditingField(null)}
                className="h-6 w-12 text-xs text-center bg-white text-black mx-1"
                step="0.1"
                min="0"
                max="100"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <button
                onClick={() => setEditingField('discount')}
                className="text-xs font-medium transition-colors cursor-pointer border-b border-dashed mx-1"
                style={{ 
                  color: "var(--accent-2)",
                  borderBottomColor: "var(--accent-2)"
                }}
              >
                {formatPercentage(discountPct)}
              </button>
            )}
            <span className="text-gray-600">%)</span>
          </div>
          <div></div> {/* Margin column */}
          <div className="flex items-center justify-end font-semibold" style={{ color: "var(--table-row-fg)" }}>
            {formatCurrency(discountValue)}
          </div> {/* TOTAL column - clean value without - */}
          <div></div> {/* Empty space for percentage column */}
          <div></div> {/* Empty space for actions column */}
        </div>
        {/* Continuous line from SUBTOTAL to TOTAL */}
        <div 
          className="absolute bottom-0 h-px"
          style={{ 
            backgroundColor: "var(--table-row-border)",
            left: "60%", /* Approximate start at SUBTOTAL column */
            right: "18%" /* Approximate end after TOTAL column */
          }}
        />
      </div>

      {/* Base para IVA Row */}
      <div className="relative">
        <div 
          className="grid gap-4 px-4 py-3 text-xs"
          style={{ 
            gridTemplateColumns: GRID_COLUMNS,
            backgroundColor: "var(--table-row-bg)"
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div></div> {/* Empty space for item number column */}
          <div></div> {/* Empty space for description column */}
          <div></div> {/* Empty space for type column */}
          <div></div> {/* Empty space for quantity column */}
          <div></div> {/* Empty space for unit cost column */}
          <div className="flex items-center font-medium" style={{ color: "var(--table-row-fg)" }}>
            Base para IVA
          </div> {/* SUBTOTAL column */}
          <div></div> {/* Margin column */}
          <div className="flex items-center justify-end font-semibold" style={{ color: "var(--table-row-fg)" }}>
            {formatCurrency(totalAfterDiscount)}
          </div> {/* TOTAL column */}
          <div></div> {/* Empty space for percentage column */}
          <div></div> {/* Empty space for actions column */}
        </div>
        {/* Continuous line from SUBTOTAL to TOTAL */}
        <div 
          className="absolute bottom-0 h-px"
          style={{ 
            backgroundColor: "var(--table-row-border)",
            left: "60%", /* Approximate start at SUBTOTAL column */
            right: "18%" /* Approximate end after TOTAL column */
          }}
        />
      </div>

      {/* IVA Row */}
      <div className="relative">
        <div 
          className="grid gap-4 px-4 py-3 text-xs"
          style={{ 
            gridTemplateColumns: GRID_COLUMNS,
            backgroundColor: "var(--table-row-bg)"
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div></div> {/* Empty space for item number column */}
          <div></div> {/* Empty space for description column */}
          <div></div> {/* Empty space for type column */}
          <div></div> {/* Empty space for quantity column */}
          <div></div> {/* Empty space for unit cost column */}
          <div className="flex items-center font-medium" style={{ color: "var(--table-row-fg)" }}> {/* SUBTOTAL column with editable percentage */}
            <span className="mr-1">IVA</span>
            <span className="text-gray-600">(</span>
            {editingField === 'tax' ? (
              <Input
                type="number"
                value={localTaxPct}
                onChange={(e) => handleTaxPctChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'tax')}
                onBlur={() => setEditingField(null)}
                className="h-6 w-12 text-xs text-center bg-white text-black mx-1"
                step="0.1"
                min="0"
                max="30"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <button
                onClick={() => setEditingField('tax')}
                className="text-xs font-medium transition-colors cursor-pointer border-b border-dashed mx-1"
                style={{ 
                  color: "var(--accent-2)",
                  borderBottomColor: "var(--accent-2)"
                }}
              >
                {formatPercentage(taxPct)}
              </button>
            )}
            <span className="text-gray-600">%)</span>
          </div>
          <div></div> {/* Margin column */}
          <div className="flex items-center justify-end font-semibold" style={{ color: "var(--table-row-fg)" }}>
            {formatCurrency(taxAmount)}
          </div> {/* TOTAL column - clean value without + */}
          <div></div> {/* Empty space for percentage column */}
          <div></div> {/* Empty space for actions column */}
        </div>
        {/* Continuous line from SUBTOTAL to TOTAL */}
        <div 
          className="absolute bottom-0 h-px"
          style={{ 
            backgroundColor: "var(--table-row-border)",
            left: "60%", /* Approximate start at SUBTOTAL column */
            right: "18%" /* Approximate end after TOTAL column */
          }}
        />
      </div>

      {/* Total Final Row */}
      <div 
        className="grid gap-4 px-4 py-3 text-sm font-bold"
        style={{ 
          gridTemplateColumns: GRID_COLUMNS,
          backgroundColor: "var(--table-group-header-bg)",
          color: "white"
        }}
      >
        <div></div> {/* Empty space for drag handle column */}
        <div></div> {/* Empty space for item number column */}
        <div></div> {/* Empty space for description column */}
        <div></div> {/* Empty space for type column */}
        <div></div> {/* Empty space for quantity column */}
        <div></div> {/* Empty space for unit cost column */}
        <div className="flex items-center font-bold text-sm">TOTAL FINAL</div> {/* SUBTOTAL column - larger text */}
        <div></div> {/* Empty space for margin column */}
        <div className="flex items-center justify-end font-bold text-sm">{formatCurrency(grandTotal)}</div> {/* TOTAL column - larger text */}
        <div></div> {/* Empty space for percentage column */}
        <div></div> {/* Empty space for actions column */}
      </div>
    </div>
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
  archubCost,
  organizationCost,
  onCostTypeChange 
}: { 
  task: any;
  archubCost: number;
  organizationCost: number;
  onCostTypeChange?: (costType: 'archub' | 'organization' | 'independent') => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [costType, setCostType] = useState<'archub' | 'organization' | 'independent'>('archub');
  const [customCost, setCustomCost] = useState<number>(task.unit_price || 0);
  
  const updateBudgetItem = useUpdateBudgetItem();

  const displayCost = costType === 'archub' ? archubCost : 
                    costType === 'organization' ? organizationCost : 
                    customCost;

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Function to save unit price to database
  const saveUnitPrice = async (newCostType: 'archub' | 'organization' | 'independent', newCustomCost?: number) => {
    let unitPrice = 0;
    
    switch (newCostType) {
      case 'archub':
        unitPrice = archubCost;
        break;
      case 'organization':
        unitPrice = organizationCost;
        break;
      case 'independent':
        unitPrice = newCustomCost || customCost;
        break;
    }
    
    try {
      await updateBudgetItem.mutateAsync({
        id: task.id,
        unit_price: unitPrice
      });
    } catch (error) {
    }
  };

  // Handle cost type change
  const handleCostTypeChange = async (newType: 'archub' | 'organization' | 'independent') => {
    setCostType(newType);
    onCostTypeChange?.(newType);
    await saveUnitPrice(newType);
  };

  // Handle custom cost save
  const handleCustomCostSave = async () => {
    await saveUnitPrice('independent', customCost);
    setIsOpen(false);
  };

  // Handle Enter key on custom cost input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomCostSave();
    }
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
                  value="archub"
                  checked={costType === 'archub'}
                  onChange={(e) => {
                    const newType = e.target.value as 'archub';
                    handleCostTypeChange(newType);
                  }}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Costo Archub</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-type-${task.id}`}
                  value="organization"
                  checked={costType === 'organization'}
                  onChange={(e) => {
                    const newType = e.target.value as 'organization';
                    handleCostTypeChange(newType);
                  }}
                  className="accent-[var(--accent-2)]"
                  disabled={organizationCost === 0}
                />
                <span className="text-xs text-[var(--card-fg)]">Costo de Organización</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`cost-type-${task.id}`}
                  value="independent"
                  checked={costType === 'independent'}
                  onChange={(e) => {
                    const newType = e.target.value as 'independent';
                    handleCostTypeChange(newType);
                  }}
                  className="accent-[var(--accent-2)]"
                />
                <span className="text-xs text-[var(--card-fg)]">Costo Independiente</span>
              </label>
            </div>

            {costType === 'independent' && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-[var(--muted-fg)] mb-1">
                  Costo personalizado:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={customCost === 0 ? '' : customCost}
                    onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-xs flex-1"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomCostSave}
                    disabled={updateBudgetItem.isPending}
                    className="h-8 px-3 text-xs"
                  >
                    {updateBudgetItem.isPending ? '...' : 'OK'}
                  </Button>
                </div>
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
  handleMarginChange,
  handlePureSubtotalChange,
  handleCostScopeChange,
  localCostScopes,
  localMargins
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
  handlePureSubtotalChange: (taskId: string, pureSubtotal: number) => void;
  handleCostScopeChange: (taskId: string, costScope: string) => void;
  localCostScopes: { [taskId: string]: string };
  localMargins: { [taskId: string]: number };
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

  // Calculate costs once per task to avoid duplicate queries
  const { data: materials = [] } = useTaskMaterials(task.task_id || task.id);
  const { data: labor = [] } = useTaskLabor(task.task_id || task.id);
  const { data: organizationTaskPrice } = useOrganizationTaskPrice(task.task_id || task.id);

  const archubCost = useMemo(() => {
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

    // Calculate cost based on LOCAL cost_scope for immediate recalculation
    const costScope = localCostScopes[task.id] || task.cost_scope || 'materials_and_labor';
    switch (costScope) {
      case 'materials_only':
        return materialsCost;
      case 'labor_only':
        return laborCost;
      case 'materials_and_labor':
      default:
        return materialsCost + laborCost;
    }
  }, [materials, labor, task.cost_scope, localCostScopes, task.id]);

  const organizationCost = organizationTaskPrice?.total_unit_cost || 0;

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


  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`group grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors ${!isLastInGroup ? 'border-b border-[var(--table-row-border)]' : ''}`} 
           style={{ gridTemplateColumns: GRID_COLUMNS }}>
        
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
            archubCost={archubCost}
            organizationCost={organizationCost}
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
          <SubtotalDisplay 
            task={task} 
            quantity={localQuantities[task.id] ?? task.quantity ?? 0}
            archubCost={archubCost}
            onPureSubtotalChange={handlePureSubtotalChange}
          />
        </div>
        
        {/* Margin column */}
        <div className="text-right text-xs flex items-center justify-end">
          <InlineMarginEditor
            taskId={task.id}
            currentMargin={task.markup_pct || 0}
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
        <div className="flex items-center justify-center">
          <TaskActionButtons 
            task={task}
            onDuplicateTask={onDuplicateTask}
            onDeleteTask={onDeleteTask}
          />
        </div>
      </div>
    </div>
  );
};

// Function to calculate group subtotal sum using real taskSubtotals
const calculateGroupSubtotalSum = (groupTasks: BudgetTask[], taskSubtotals: { [taskId: string]: number }) => {
  // Sum the real subtotals from taskSubtotals
  return groupTasks.reduce((sum, task) => {
    const taskSubtotal = taskSubtotals[task.id] || 0;
    return sum + taskSubtotal;
  }, 0);
};

// Function to calculate group pure subtotal sum using pureSubtotals (without margins)
const calculateGroupPureSubtotalSum = (groupTasks: BudgetTask[], pureSubtotals: { [taskId: string]: number }) => {
  // Sum the pure subtotals from pureSubtotals (without margins)
  return groupTasks.reduce((sum, task) => {
    const taskId = task.id; // Use task.id (same as taskSubtotals and SubtotalDisplay)
    const pureSubtotal = pureSubtotals[taskId] || 0;
    return sum + pureSubtotal;
  }, 0);
};

// Group Header component  
const GroupHeader = ({ 
  groupName, 
  tasksCount, 
  groupTasks, 
  groupSubtotal, 
  totalSubtotal,
  groupIndex,
  pureSubtotals 
}: { 
  groupName: string; 
  tasksCount: number; 
  groupTasks: BudgetTask[];
  groupSubtotal: number;
  totalSubtotal: number;
  groupIndex: number;
  pureSubtotals: { [taskId: string]: number };
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

  // Use the calculateGroupPureSubtotalSum function with pure subtotals (without margins)
  const groupPureSubtotalSum = calculateGroupPureSubtotalSum(groupTasks, pureSubtotals);

  return (
    <div 
      className="grid gap-4 px-4 py-3 text-xs font-medium"
      style={{ 
        gridTemplateColumns: GRID_COLUMNS,
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
      {/* Group name - spans Description, Type, Quantity columns */}
      <div className="col-span-3">
        {groupName} ({tasksCount} {tasksCount === 1 ? 'tarea' : 'tareas'})
      </div>
      {/* Empty Unit Cost column */}
      <div></div>
      {/* Subtotal sum column */}
      <div className="text-right">
        <span className="font-medium">{formatCost(groupPureSubtotalSum)}</span>
      </div>
      {/* Empty Margin column */}
      <div></div>
      {/* Total column */}
      <div className="text-right">
        <span className="font-medium">{formatCost(groupSubtotal)}</span>
      </div>
      {/* % de Incidencia column */}
      <div className="text-right">
        <span className="font-medium">{groupPercentage}%</span>
      </div>
      {/* Empty actions column */}
      <div></div>
    </div>
  );
};


export function BudgetTree({ 
  tasks, 
  budgetId,
  projectId,
  onReorder, 
  onDuplicateTask,
  onDeleteTask,
  onQuantityChange,
  onAddTask,
  onTotalsChange 
}: BudgetTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskSubtotals, setTaskSubtotals] = useState<{ [taskId: string]: number }>({});
  
  // Get current budget data for discount/VAT values
  const { data: budgets = [] } = useBudgets(projectId);
  const currentBudget = budgets.find(budget => budget.id === (budgetId || tasks[0]?.budget_id));
  
  // Budget update mutation
  const updateBudgetMutation = useUpdateBudget();
  const [pureSubtotals, setPureSubtotals] = useState<{ [taskId: string]: number }>({});
  const [localQuantities, setLocalQuantities] = useState<{ [taskId: string]: number }>({});
  const [localMargins, setLocalMargins] = useState<{ [taskId: string]: number }>({});
  const [localCostScopes, setLocalCostScopes] = useState<{ [taskId: string]: string }>({});
  const { data: userData } = useCurrentUser();
  const updateBudgetItemMutation = useUpdateBudgetItem();

  
  // Initialize local quantities, margins, and cost scopes from tasks
  useEffect(() => {
    const initialQuantities: { [taskId: string]: number } = {};
    const initialMargins: { [taskId: string]: number } = {};
    const initialCostScopes: { [taskId: string]: string } = {};
    
    tasks.forEach(task => {
      initialQuantities[task.id] = task.quantity || 0;
      initialMargins[task.id] = task.markup_pct || 0;
      initialCostScopes[task.id] = task.cost_scope || 'materials_and_labor';
    });
    
    setLocalQuantities(initialQuantities);
    setLocalMargins(initialMargins);
    setLocalCostScopes(initialCostScopes);
  }, [tasks]);

  // Create save function for auto-save
  const saveQuantityChanges = useCallback(async (quantities: { [taskId: string]: number }) => {
    // Find changes that need to be saved
    const changedTasks = Object.entries(quantities).filter(([taskId, quantity]) => {
      const originalTask = tasks.find(task => task.id === taskId);
      return originalTask && originalTask.quantity !== quantity;
    });

    // Save each changed task
    for (const [taskId, quantity] of changedTasks) {
      try {
        await updateBudgetItemMutation.mutateAsync({
          id: taskId,
          quantity: quantity,
        });
      } catch (error) {
        throw error; // Re-throw to let the auto-save hook handle it
      }
    }
  }, [tasks, updateBudgetItemMutation]);

  // Create save function for margin changes
  const saveMarginChanges = useCallback(async (margins: { [taskId: string]: number }) => {
    const changedTasks = Object.entries(margins).filter(([taskId, margin]) => {
      const originalTask = tasks.find(task => task.id === taskId);
      return originalTask && (originalTask.markup_pct || 0) !== margin;
    });

    for (const [taskId, margin] of changedTasks) {
      try {
        await updateBudgetItemMutation.mutateAsync({
          id: taskId,
          markup_pct: margin,
        });
      } catch (error) {
        throw error;
      }
    }
  }, [tasks, updateBudgetItemMutation]);

  // Create save function for cost scope changes
  const saveCostScopeChanges = useCallback(async (costScopes: { [taskId: string]: string }) => {
    const changedTasks = Object.entries(costScopes).filter(([taskId, costScope]) => {
      const originalTask = tasks.find(task => task.id === taskId);
      return originalTask && (originalTask.cost_scope || 'materials_and_labor') !== costScope;
    });

    for (const [taskId, costScope] of changedTasks) {
      try {
        await updateBudgetItemMutation.mutateAsync({
          id: taskId,
          cost_scope: costScope as 'materials_and_labor' | 'materials_only' | 'labor_only',
          unit_price: 0 // Reset to 0 so the new archubCost based on cost_scope is used
        });
      } catch (error) {
        throw error;
      }
    }
  }, [tasks, updateBudgetItemMutation]);

  // Handle description changes
  const handleDescriptionChange = useCallback((taskId: string, description: string) => {
    updateBudgetItemMutation.mutate({
      id: taskId,
      description: description,
    });
  }, [updateBudgetItemMutation]);

  // Handle local margin changes
  const handleMarginChange = useCallback((taskId: string, margin: number) => {
    setLocalMargins(prev => ({
      ...prev,
      [taskId]: margin
    }));
  }, []);

  // Handle local cost scope changes
  const handleCostScopeChange = useCallback((taskId: string, costScope: string) => {
    setLocalCostScopes(prev => ({
      ...prev,
      [taskId]: costScope
    }));
  }, []);

  // Use auto-save for quantity changes
  const { isSaving: isSavingQuantities } = useDebouncedAutoSave({
    data: localQuantities,
    saveFn: saveQuantityChanges,
    delay: 1000, // Wait 1 second after user stops typing
    enabled: true
  });

  // Use auto-save for margin changes
  const { isSaving: isSavingMargins } = useDebouncedAutoSave({
    data: localMargins,
    saveFn: saveMarginChanges,
    delay: 750, // Wait 750ms after user stops typing
    enabled: true
  });

  // Use auto-save for cost scope changes
  const { isSaving: isSavingCostScopes } = useDebouncedAutoSave({
    data: localCostScopes,
    saveFn: saveCostScopeChanges,
    delay: 500, // Wait 500ms after user stops typing (faster for scope changes)
    enabled: true
  });

  // Handle local quantity changes
  const handleLocalQuantityChange = (taskId: string, quantity: number) => {
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
  
  const handlePureSubtotalChange = useCallback((taskId: string, pureSubtotal: number) => {
    setPureSubtotals(prev => {
      if (prev[taskId] === pureSubtotal) {
        return prev;
      }
      return {
        ...prev,
        [taskId]: pureSubtotal
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
  
  // Calculate group subtotals and total (with margins)
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
  
  // Calculate pure subtotals for group headers (without margins)
  const { groupPureSubtotals } = useMemo(() => {
    const groupSums: { [groupName: string]: number } = {};
    
    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      const groupSum = groupTasks.reduce((sum, task) => {
        const pureSubtotal = pureSubtotals[task.id] || 0;
        return sum + pureSubtotal;
      }, 0);
      groupSums[groupName] = groupSum;
    });
    
    return {
      groupPureSubtotals: groupSums
    };
  }, [groupedTasks, pureSubtotals]);

  // Calculate total subtotals and finals across all groups and report to parent
  const lastTotalsRef = useRef<{ totalSubtotals: number; totalFinals: number } | null>(null);

  useEffect(() => {
    if (onTotalsChange && Object.keys(pureSubtotals).length > 0 && Object.keys(taskSubtotals).length > 0) {
      // Filter pureSubtotals to only include tasks that are also in taskSubtotals (active tasks)
      const activePureSubtotals = Object.keys(taskSubtotals).reduce((acc, taskId) => {
        if (pureSubtotals[taskId] !== undefined) {
          acc[taskId] = pureSubtotals[taskId];
        }
        return acc;
      }, {} as { [taskId: string]: number });
      
      const totalSubtotals = Object.values(activePureSubtotals).reduce((sum, value) => sum + value, 0);
      const totalFinals = Object.values(taskSubtotals).reduce((sum, value) => sum + value, 0);
      
      // Only call onTotalsChange if values have actually changed
      if (!lastTotalsRef.current || 
          lastTotalsRef.current.totalSubtotals !== totalSubtotals || 
          lastTotalsRef.current.totalFinals !== totalFinals) {
        
        lastTotalsRef.current = { totalSubtotals, totalFinals };
        onTotalsChange(totalSubtotals, totalFinals);
      }
    }
  }, [pureSubtotals, taskSubtotals, onTotalsChange]);

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

    const sourceIndex = tasks.findIndex((task) => task.id === active.id);
    const destinationIndex = tasks.findIndex((task) => task.id === over.id);

    if (sourceIndex !== destinationIndex && onReorder) {
      // Call onReorder with the new pattern: sourceIndex, destinationIndex, draggedTask
      onReorder(sourceIndex, destinationIndex, draggedTask);
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
        <div className="space-y-0">
          {/* Main Header - Column titles */}
        <div 
          className="grid gap-4 px-4 py-3 text-xs font-medium opacity-90 sticky top-0"
          style={{ 
            gridTemplateColumns: GRID_COLUMNS,
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
              pureSubtotals={pureSubtotals}
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
                    handlePureSubtotalChange={handlePureSubtotalChange}
                    handleCostScopeChange={handleCostScopeChange}
                    localCostScopes={localCostScopes}
                    localMargins={localMargins}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}

        {/* Budget Summary Row */}
        <BudgetSummaryRow 
          totalSubtotals={totalSubtotal}
          totalFinals={Object.values(taskSubtotals).reduce((sum, value) => sum + value, 0)}
          budgetId={budgetId || tasks[0]?.budget_id}
          // Pass current budget values as initial values
          initialDiscountPct={currentBudget?.discount_pct || 0}
          initialDiscountAmount={0}
          initialTaxPct={currentBudget?.tax_pct || 21}
          onBudgetUpdate={(updates) => {
            const targetBudgetId = budgetId || tasks[0]?.budget_id;
            if (targetBudgetId) {
              updateBudgetMutation.mutate({
                id: targetBudgetId,
                ...updates
              });
            }
          }}
        />
        </div>
      </div>
    </DndContext>
  );
}