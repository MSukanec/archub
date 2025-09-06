import { useState } from 'react'
import { Eye, Package, X, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'

export interface TaskCostPopoverProps {
  task: any
  showCost?: boolean
}

export const TaskCostPopover = ({ task, showCost = false }: TaskCostPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // For construction tasks, use task.task_id (the generated task ID), for other tasks use task.id
  const taskId = task.task_id || task.id
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(taskId)
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(taskId)

  const isLoading = materialsLoading || laborLoading

  // Calcular total de materiales por unidad
  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  // Calcular total de mano de obra por unidad
  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = Array.isArray(laborItem.labor_view) ? laborItem.labor_view[0] : laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const totalPerUnit = materialsTotalPerUnit + laborTotalPerUnit

  // Formatear el costo total
  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <>
      {showCost && totalPerUnit > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          {formatCost(totalPerUnit)}
        </span>
      )}
      
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      {/* Mobile popover with backdrop - same pattern as ActionBarMobile filter */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)',
              maxWidth: '400px',
              maxHeight: '70vh',
              zIndex: 60,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Header */}
              <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--menues-border)' }}>
                <div className="flex items-center gap-2 flex-1">
                  <Package className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                  <h2 className="text-xs font-semibold" style={{ color: 'var(--menues-fg)' }}>
                    Costos por unidad
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4" style={{ maxHeight: 'calc(70vh - 120px)', overflow: 'auto' }}>
                {isLoading ? (
                  <div className="text-center py-3">
                    <div className="text-xs" style={{ color: 'var(--muted-fg)' }}>Cargando costos...</div>
                  </div>
                ) : materials.length === 0 && labor.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      No hay costos definidos para esta tarea
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Sección de Materiales */}
                    {materials.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between py-1 px-2 mb-2" style={{ backgroundColor: '#2d3748', color: 'white' }}>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            <span className="text-xs font-semibold">Material ({materials.length} items)</span>
                          </div>
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
                            const categoryName = materialView?.category_name || 'Sin categoría';
                            
                            return (
                              <div key={material.id} className="flex items-start justify-between py-1">
                                {/* Información del item */}
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--menues-fg)' }}>
                                    {itemName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{categoryName}</div>
                                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                                    <span>{quantity} {unitName}</span>
                                    <span>x</span>
                                    <span className="font-mono">
                                      {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$ 0'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Precio total */}
                                <div className="text-xs flex-shrink-0 text-right font-medium" style={{ color: 'var(--menues-fg)', minWidth: '80px' }}>
                                  $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                        <div className="flex items-center justify-between py-1 px-2 mb-2" style={{ backgroundColor: '#2d3748', color: 'white' }}>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-3 w-3" />
                            <span className="text-xs font-semibold">Mano de Obra ({labor.length} items)</span>
                          </div>
                          <span className="text-xs font-semibold">
                            $ {laborTotalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {labor.map((laborItem) => {
                            const quantity = laborItem.quantity || 0;
                            const laborView = Array.isArray(laborItem.labor_view) ? laborItem.labor_view[0] : laborItem.labor_view;
                            const unitPrice = laborView?.avg_price || 0;
                            const subtotal = quantity * unitPrice;
                            const unitName = laborView?.unit_name || 'UD';
                            const itemName = laborView?.labor_name || 'Mano de obra sin nombre';
                            
                            return (
                              <div key={laborItem.id} className="flex items-start justify-between py-1">
                                {/* Información del item */}
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--menues-fg)' }}>
                                    {itemName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Mano de Obra</div>
                                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                                    <span>{quantity} {unitName}</span>
                                    <span>x</span>
                                    <span className="font-mono">
                                      {unitPrice > 0 ? `$ ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$ 0'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Precio total */}
                                <div className="text-xs flex-shrink-0 text-right font-medium" style={{ color: 'var(--menues-fg)', minWidth: '80px' }}>
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

              {/* Footer - Solo se muestra si hay materiales o mano de obra */}
              {!isLoading && (materials.length > 0 || labor.length > 0) && (
                <div className="px-3 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--menues-border)' }}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--menues-fg)' }}>TOTAL POR UNIDAD:</span>
                  </div>
                  <div className="text-xs font-semibold text-right" style={{ color: 'var(--menues-fg)', minWidth: '80px' }}>
                    $ {totalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}