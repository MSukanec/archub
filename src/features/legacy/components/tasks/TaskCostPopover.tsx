import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'

export interface TaskCostPopoverProps {
  task: any
  showCost?: boolean
  cost_scope?: string
}

const TaskCostBreakdown = ({ task, cost_scope }: { task: any; cost_scope?: string }) => {
  const taskId = task.task_id || task.id
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(taskId)
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(taskId)

  const isLoading = materialsLoading || laborLoading

  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const effectiveCostScope = cost_scope || task.cost_scope || 'materials_and_labor'
  
  const getTotalPerUnit = () => {
    switch (effectiveCostScope) {
      case 'materials_only':
        return materialsTotalPerUnit
      case 'labor_only':
        return laborTotalPerUnit
      case 'materials_and_labor':
      default:
        return materialsTotalPerUnit + laborTotalPerUnit
    }
  }
  
  const totalPerUnit = getTotalPerUnit()

  return (
    <div className="w-full">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[var(--card-border)]">
        <Info className="h-3 w-3 text-[var(--accent-2)]" />
        <h3 className="text-xs font-semibold text-[var(--card-fg)]">
          Costos por unidad
        </h3>
      </div>

      <div className="p-3" style={{ maxHeight: '400px', overflow: 'auto' }}>
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
            {materials.length > 0 && (effectiveCostScope === 'materials_only' || effectiveCostScope === 'materials_and_labor') && (
              <div>
                <div className="flex items-center justify-between py-1 px-2 mb-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  <span className="text-xs font-semibold">Material ({materials.length})</span>
                  <span className="text-xs font-semibold">
                    $ {materialsTotalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                          <div className="text-xs font-semibold leading-tight text-left text-[var(--card-fg)]">
                            {itemName}
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-0.5 text-[var(--muted-fg)]">
                            <span>{quantity} {unitName}</span>
                            <span>x</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$ 0'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs flex-shrink-0 text-right font-medium text-[var(--card-fg)]" style={{ minWidth: '80px' }}>
                          $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {labor.length > 0 && (effectiveCostScope === 'labor_only' || effectiveCostScope === 'materials_and_labor') && (
              <div>
                <div className="flex items-center justify-between py-1 px-2 mb-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  <span className="text-xs font-semibold">Mano de Obra ({labor.length})</span>
                  <span className="text-xs font-semibold">
                    $ {laborTotalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                          <div className="text-xs font-semibold leading-tight text-left text-[var(--card-fg)]">
                            {itemName}
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-0.5 text-[var(--muted-fg)]">
                            <span>{quantity} {unitName}</span>
                            <span>x</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$ 0'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs flex-shrink-0 text-right font-medium text-[var(--card-fg)]" style={{ minWidth: '80px' }}>
                          $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

      {!isLoading && (
        (effectiveCostScope === 'materials_only' && materials.length > 0) ||
        (effectiveCostScope === 'labor_only' && labor.length > 0) ||
        (effectiveCostScope === 'materials_and_labor' && (materials.length > 0 || labor.length > 0))
      ) && (
        <div className="px-3 py-3 flex items-center justify-between border-t border-[var(--card-border)]">
          <span className="text-xs font-semibold uppercase text-[var(--card-fg)]">TOTAL POR UNIDAD:</span>
          <div className="text-xs font-semibold text-right text-[var(--card-fg)]" style={{ minWidth: '80px' }}>
            $ {totalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      )}
    </div>
  )
}

export const TaskCostPopover = ({ task, showCost = false, cost_scope }: TaskCostPopoverProps) => {
  const taskId = task.task_id || task.id
  const { data: materials = [] } = useTaskMaterials(taskId)
  const { data: labor = [] } = useTaskLabor(taskId)

  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const effectiveCostScope = cost_scope || task.cost_scope || 'materials_and_labor'
  
  const getTotalPerUnit = () => {
    switch (effectiveCostScope) {
      case 'materials_only':
        return materialsTotalPerUnit
      case 'labor_only':
        return laborTotalPerUnit
      case 'materials_and_labor':
      default:
        return materialsTotalPerUnit + laborTotalPerUnit
    }
  }
  
  const totalPerUnit = getTotalPerUnit()

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="flex items-center gap-2">
      {showCost && totalPerUnit > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          {formatCost(totalPerUnit)}
        </span>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 text-[var(--accent-2)] hover:text-[var(--accent-2)] opacity-70 hover:opacity-100"
          >
            <Info className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <TaskCostBreakdown task={task} cost_scope={cost_scope} />
        </PopoverContent>
      </Popover>
    </div>
  )
}