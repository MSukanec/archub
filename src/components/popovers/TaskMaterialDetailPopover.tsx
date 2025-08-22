import { useState } from 'react'
import { Eye, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'

export interface TaskMaterialDetailPopoverProps {
  task: any
  showCost?: boolean
}

export const TaskMaterialDetailPopover = ({ task, showCost = false }: TaskMaterialDetailPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // For construction tasks, use task.task_id (the generated task ID), for other tasks use task.id
  const taskId = task.task_id || task.id
  const { data: materials = [], isLoading } = useTaskMaterials(taskId)

  // Calcular total por unidad usando material_view.computed_unit_price
  const totalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.material_view) ? material.material_view[0] : material.material_view;
    const unitPrice = materialView?.computed_unit_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

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
                    Materiales por unidad
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
                    <div className="text-xs" style={{ color: 'var(--muted-fg)' }}>Cargando materiales...</div>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      No hay materiales definidos para esta tarea
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {materials.map((material) => {
                      const quantity = material.amount || 0;
                      const materialView = Array.isArray(material.material_view) ? material.material_view[0] : material.material_view;
                      const unitPrice = materialView?.computed_unit_price || 0;
                      const subtotal = quantity * unitPrice;
                      const unitName = materialView?.unit_of_computation || 'UD';
                      
                      return (
                        <div key={material.id} className="flex items-start justify-between py-1 border-b last:border-b-0" style={{ borderColor: 'var(--menues-border)' }}>
                          {/* Información del material */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--menues-fg)' }}>
                              {materialView?.name || 'Material sin nombre'}
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                              <span>{quantity} {unitName}</span>
                              <span>•</span>
                              <span className="font-mono">
                                {unitPrice > 0 ? `$${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '–'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Precio total */}
                          <div className="text-xs flex-shrink-0 text-right" style={{ color: 'var(--menues-fg)', minWidth: '80px' }}>
                            {subtotal > 0 ? `$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '–'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer - Solo se muestra si hay materiales */}
              {!isLoading && materials.length > 0 && (
                <div className="px-3 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--menues-border)' }}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--menues-fg)' }}>TOTAL POR UNIDAD:</span>
                  </div>
                  <div className="text-xs font-semibold text-right" style={{ color: 'var(--menues-fg)', minWidth: '80px' }}>
                    ${totalPerUnit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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