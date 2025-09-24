import { DollarSign, Plus, Package, Calculator, FolderOpen, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMemo } from 'react'
import { useMobile } from '@/hooks/use-mobile'

interface EstimateBudgetProps {
  tasks?: any[]
  isLoading?: boolean
  onEditTask?: (task: any) => void
  onAddTask?: () => void
  onDeleteTask?: (taskId: string) => void
  onDuplicateTask?: (task: any) => void
}

export function EstimateBudget({ 
  tasks = [], 
  isLoading = false, 
  onEditTask,
  onAddTask,
  onDeleteTask,
  onDuplicateTask
}: EstimateBudgetProps) {
  const isMobile = useMobile()

  // Calculate KPIs from tasks
  const kpiData = useMemo(() => {
    if (tasks.length === 0) return {
      totalTasks: 0,
      totalRubros: 0,
      totalEstimatedCost: 0,
      totalMarginValue: 0,
      totalFinalCost: 0
    };

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

    // For now, use placeholder calculations - these will be updated with real data later
    // TODO: Implement real calculations using task materials and labor data
    const totalEstimatedCost = tasks.reduce((sum, task) => {
      return sum + ((task.quantity || 0) * 1000); // placeholder base cost
    }, 0);

    const totalMarginValue = tasks.reduce((sum, task) => {
      const baseSubtotal = (task.quantity || 0) * 1000;
      const margin = task.margin || 0;
      return sum + (baseSubtotal * (margin / 100));
    }, 0);

    const totalFinalCost = totalEstimatedCost + totalMarginValue;

    return {
      totalTasks,
      totalRubros,
      totalEstimatedCost,
      totalMarginValue,
      totalFinalCost
    };
  }, [tasks]);

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