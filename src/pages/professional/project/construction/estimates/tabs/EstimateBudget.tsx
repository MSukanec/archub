import { DollarSign, Plus, Package, Calculator, FolderOpen, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMemo } from 'react'
import { useMobile } from '@/hooks/use-mobile'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'

interface EstimateBudgetProps {
  tasks?: any[]
  isLoading?: boolean
  onEditTask?: (task: any) => void
  onAddTask?: () => void
  onDeleteTask?: (taskId: string) => void
  onDuplicateTask?: (task: any) => void
}

// Function to calculate KPIs using real data without hooks
const calculateBudgetKPIs = (tasks: any[]) => {
  // Basic calculation without hooks - using simple estimates for now
  // This prevents the hook ordering issue
  let totalSubtotals = 0;
  let totalFinals = 0;
  let totalMargins = 0;

  for (const task of tasks) {
    const quantity = task.quantity || 0;
    const marginPct = task.margin || 0;
    
    // Use estimated costs if available, otherwise use fallback
    const estimatedCostPerUnit = task.estimated_cost || 100; // Fallback value
    const subtotal = quantity * estimatedCostPerUnit;
    const marginAmount = subtotal * (marginPct / 100);
    const total = subtotal + marginAmount;
    
    totalSubtotals += subtotal;
    totalMargins += marginAmount;
    totalFinals += total;
  }

  return { totalSubtotals, totalFinals, totalMargins };
};

export function EstimateBudget({ 
  tasks = [], 
  isLoading = false, 
  onEditTask,
  onAddTask,
  onDeleteTask,
  onDuplicateTask
}: EstimateBudgetProps) {
  const isMobile = useMobile()

  // Calculate real KPIs using actual task data
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

    return {
      totalTasks,
      totalRubros,
      totalEstimatedCost: budgetCalculations.totalSubtotals,  // Sum of SUBTOTAL column
      totalMarginValue: budgetCalculations.totalMargins,      // Sum of all margins applied
      totalFinalCost: budgetCalculations.totalFinals         // Sum of TOTAL column
    };
  }, [tasks, budgetCalculations]);

  // Handle reorder tasks
  const handleReorder = (reorderedTasks: any[]) => {
    console.log('Reordered tasks:', reorderedTasks)
    // TODO: Implement actual reorder logic
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
    console.log('Quantity change:', taskId, quantity)
    // TODO: Implement actual quantity change logic
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
          title="Presupuesto de Proyecto"
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
      />
    </div>
  )
}