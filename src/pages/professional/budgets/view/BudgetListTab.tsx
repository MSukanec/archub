import { DollarSign, Plus, Package, Calculator, FolderOpen, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMemo, useState } from 'react'
import { useMobile } from '@/hooks/use-mobile'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'
import { useUpdateBudgetItem, useMoveBudgetItem } from '@/hooks/use-budget-items'

interface BudgetListTabProps {
  budget: any
  tasks?: any[]
  isLoading?: boolean
  onEditTask?: (task: any) => void
  onAddTask?: () => void
  onDeleteTask?: (taskId: string) => void
  onDuplicateTask?: (task: any) => void
}

// Function to calculate KPIs using REAL Supabase data
const calculateBudgetKPIs = (tasks: any[]) => {
  let totalSubtotals = 0;
  let totalMargins = 0;
  let totalTaxes = 0;
  let totalFinals = 0;

  for (const task of tasks) {
    // Usar datos REALES de Supabase - NO fallbacks hardcodeados
    const quantity = task.quantity || 0;
    const unitPrice = task.unit_price || 0;  // Usar unit_price de Supabase
    const markupPct = task.markup_pct || 0;  // Usar markup_pct de Supabase
    const taxPct = task.tax_pct || 0;        // Usar tax_pct de Supabase
    
    // Fórmula correcta según prompts/tables/tables-budgets.md:
    const subtotal = unitPrice * quantity;
    const marginAmount = subtotal * (markupPct / 100);
    const beforeTax = subtotal + marginAmount;
    const taxAmount = beforeTax * (taxPct / 100);
    const total = beforeTax + taxAmount;
    
    totalSubtotals += subtotal;
    totalMargins += marginAmount;
    totalTaxes += taxAmount;
    totalFinals += total;
  }

  return { totalSubtotals, totalMargins, totalTaxes, totalFinals };
};

export function BudgetListTab({ 
  budget,
  tasks = [], 
  isLoading = false, 
  onEditTask,
  onAddTask,
  onDeleteTask,
  onDuplicateTask
}: BudgetListTabProps) {
  const isMobile = useMobile()
  const updateBudgetItem = useUpdateBudgetItem()
  const moveBudgetItem = useMoveBudgetItem()
  
  // State to store real totals from BudgetTree
  const [realTotals, setRealTotals] = useState<{ totalSubtotals: number; totalFinals: number } | null>(null);

  // Handle totals change from BudgetTree
  const handleTotalsChange = (totalSubtotals: number, totalFinals: number) => {
    setRealTotals({ totalSubtotals, totalFinals });
  };

  // Calculate real KPIs using actual task data (fallback if real totals not available yet)
  const budgetCalculations = calculateBudgetKPIs(tasks);

  // Calculate basic metrics
  const kpiData = useMemo(() => {
    const totalTasks = tasks.length;
    
    // Group tasks by division/group (rubros)
    const rubros = tasks.reduce((acc, task) => {
      const rubro = task.division_name || 'Sin Rubro';
      if (!acc[rubro]) {
        acc[rubro] = [];
      }
      acc[rubro].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    
    const totalRubros = Object.keys(rubros).length;

    // Use real totals from BudgetTree if available, otherwise use corrected calculations
    const actualEstimatedCost = realTotals ? realTotals.totalSubtotals : budgetCalculations.totalSubtotals;
    const actualFinalCost = realTotals ? realTotals.totalFinals : budgetCalculations.totalFinals;
    const actualMarginValue = realTotals ? (actualFinalCost - actualEstimatedCost) : budgetCalculations.totalMargins; // Use calculated margins when available

    return {
      totalTasks,
      totalRubros,
      totalEstimatedCost: actualEstimatedCost,  // Sum of SUBTOTAL column (real from BudgetTree)
      totalMarginValue: actualMarginValue,      // Difference between final and estimated (real margins)
      totalFinalCost: actualFinalCost          // Sum of TOTAL column (real from BudgetTree)
    };
  }, [tasks, budgetCalculations, realTotals]);

  // Handle reorder tasks
  const handleReorder = async (sourceIndex: number, destinationIndex: number, draggedTask: any) => {
    if (!budget?.id || destinationIndex === sourceIndex) return;

    // Create the new array with the item moved
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(sourceIndex, 1);
    newTasks.splice(destinationIndex, 0, movedTask);

    // Calculate prev and next items
    const prevTask = newTasks[destinationIndex - 1] ?? null;
    const nextTask = newTasks[destinationIndex + 1] ?? null;

    const prev_item_id = prevTask?.id ?? null;
    const next_item_id = nextTask?.id ?? null;

    // Move the item using the RPC
    try {
      await moveBudgetItem.mutateAsync({
        budget_id: budget.id,
        item_id: draggedTask.id,
        prev_item_id,
        next_item_id,
      });
    } catch (error) {
      // The mutation hook will show a toast, but we can add additional logging here
    }
  }

  // Handle duplicate task
  const handleDuplicateTask = (task: any) => {
    if (onDuplicateTask) {
      onDuplicateTask(task)
    }
  }

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    if (onDeleteTask) {
      onDeleteTask(taskId)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (taskId: string, quantity: number) => {
    updateBudgetItem.mutate({
      id: taskId,
      quantity: quantity
    });
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando presupuesto...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full">
        <EmptyState
          icon={<DollarSign className="h-12 w-12 text-muted-foreground" />}
          title="Lista de Presupuesto"
          description="No hay tareas disponibles para el presupuesto"
          action={
            onAddTask && (
              <Button onClick={onAddTask} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Tarea
              </Button>
            )
          }
          className="h-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Total Tareas */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Tareas' : 'Total Tareas'}
                  </p>
                  <Package className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Valor principal con --accent alineado a la izquierda */}
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {kpiData.totalTasks}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.totalRubros} rubros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo Estimado */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Estimado' : 'Costo Estimado'}
                  </p>
                  <Calculator className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Valor principal con --accent alineado a la izquierda */}
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {formatCurrency(kpiData.totalEstimatedCost)}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    suma subtotales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suma de Beneficio */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Beneficio' : 'Suma de Beneficio'}
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Valor principal con --accent alineado a la izquierda */}
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {formatCurrency(kpiData.totalMarginValue)}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    suma márgenes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Final */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Total' : 'Presupuesto Final'}
                  </p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Valor principal con --accent alineado a la izquierda */}
                <div className={`flex items-center justify-start ${isMobile ? 'h-6' : 'h-8'}`}>
                  <p className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`} style={{ color: 'var(--accent)' }}>
                    {formatCurrency(kpiData.totalFinalCost)}
                  </p>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    suma totales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Tree */}
      <BudgetTree 
        tasks={tasks}
        onReorder={handleReorder}
        onDuplicateTask={handleDuplicateTask}
        onDeleteTask={handleDeleteTask}
        onQuantityChange={handleQuantityChange}
        onTotalsChange={handleTotalsChange}
      />
    </div>
  )
}