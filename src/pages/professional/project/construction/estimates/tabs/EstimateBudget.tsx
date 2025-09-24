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
    if (tasks.length === 0) return null;

    const totalTasks = tasks.length;
    
    // Group tasks by division/group
    const divisions = tasks.reduce((acc, task) => {
      const division = task.division_name || 'Sin División';
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    
    const totalDivisions = Object.keys(divisions).length;

    // Calculate total estimated cost (base cost without margin)
    const totalEstimatedCost = tasks.reduce((sum, task) => {
      const quantity = task.quantity || 0;
      // Estimate basic cost per unit (placeholder - in real scenario would use materials + labor)
      const baseCostPerUnit = 1000; // placeholder value
      return sum + (quantity * baseCostPerUnit);
    }, 0);

    // Calculate total cost with margins
    const totalCostWithMargin = tasks.reduce((sum, task) => {
      const quantity = task.quantity || 0;
      const baseCostPerUnit = 1000; // placeholder value
      const margin = task.margin || 0;
      const baseSubtotal = quantity * baseCostPerUnit;
      const marginAmount = baseSubtotal * (margin / 100);
      return sum + baseSubtotal + marginAmount;
    }, 0);

    // Calculate average margin
    const tasksWithMargin = tasks.filter(task => task.margin && task.margin > 0);
    const averageMargin = tasksWithMargin.length > 0 
      ? tasksWithMargin.reduce((sum, task) => sum + (task.margin || 0), 0) / tasksWithMargin.length
      : 0;

    return {
      totalTasks,
      totalDivisions,
      totalEstimatedCost,
      totalCostWithMargin,
      averageMargin,
      marginValue: totalCostWithMargin - totalEstimatedCost
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
                
                {/* Mini gráfico de barras */}
                <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm flex-1"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${Math.max(30, Math.random() * 100)}%`,
                        opacity: i < Math.min(kpiData.totalTasks, 6) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalTasks}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.totalDivisions} divisiones
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
                
                {/* Gráfico de línea de tendencia */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <svg className="w-full h-full" viewBox="0 0 100 32">
                    <path
                      d="M 0,24 Q 25,20 50,12 T 100,8"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      fill="none"
                      className="opacity-80"
                    />
                    <circle cx="100" cy="8" r="2" fill="var(--accent)" />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.totalEstimatedCost)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    sin margen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total con Margen */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Total' : 'Total con Margen'}
                  </p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Indicador de progreso */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} bg-muted/20 rounded-full relative overflow-hidden`}>
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      width: `${Math.min(100, (kpiData.marginValue / kpiData.totalEstimatedCost) * 100 + 60)}%` 
                    }}
                  />
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.totalCostWithMargin)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    +{formatCurrency(kpiData.marginValue)} margen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margen Promedio */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Margen' : 'Margen Promedio'}
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Círculo de progreso */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center justify-center`}>
                  <div className="relative">
                    <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeDasharray={`${Math.min(kpiData.averageMargin * 2, 100)}, 100`}
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {kpiData.averageMargin.toFixed(1)}%
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.totalDivisions} divisiones
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