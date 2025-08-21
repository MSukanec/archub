import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { Eye, X, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TaskMaterialDetailPopoverProps {
  task: any
  showCost?: boolean
}

export function TaskMaterialDetailPopover({ task, showCost = false }: TaskMaterialDetailPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Use task.id if available (for GeneratedTask), otherwise fallback to task.task_id (for construction tasks)
  const taskId = task.id || task.task_id
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
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Solo mostrar si hay materiales o si showCost es true
  const shouldShow = showCost || (materials && materials.length > 0);

  return (
    <>
      {showCost && totalPerUnit > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          {formatCost(totalPerUnit)}
        </span>
      )}
      {shouldShow && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className=" hover:bg-blue-50 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="center"
        side="left"
        sideOffset={10}
      >
        <div className="relative">
          {/* Header */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2 flex-1">
              <Package className="h-3 w-3 text-[var(--accent)]" />
              <h2 className="text-xs font-semibold text-[var(--card-fg)]">
                Materiales por unidad
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-3">
                <div className="text-xs text-muted-foreground">Cargando materiales...</div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-3">
                <div className="text-xs text-muted-foreground">
                  No hay materiales definidos para esta tarea
                </div>
              </div>
            ) : (
              <>
                {/* Lista de materiales con scroll si hay más de 5 */}
                <div className={`space-y-1 ${materials.length > 5 ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
                  {materials.map((material) => {
                    const quantity = material.amount || 0;
                    const materialView = Array.isArray(material.material_view) ? material.material_view[0] : material.material_view;
                    const unitPrice = materialView?.computed_unit_price || 0;
                    const subtotal = quantity * unitPrice;
                    const unitName = materialView?.unit_of_computation || 'UD';
                    
                    return (
                      <div key={material.id} className="flex items-start justify-between py-1 border-b border-gray-100 last:border-b-0">
                        {/* Información del material */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-xs font-semibold text-[var(--card-fg)] leading-tight">
                            {materialView?.name || 'Material sin nombre'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--muted-fg)] mt-0.5">
                            <span>{quantity} {unitName}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$${unitPrice.toLocaleString()}` : '–'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Precio total */}
                        <div className="text-xs text-[var(--card-fg)] flex-shrink-0 text-right" style={{ minWidth: '80px' }}>
                          {subtotal > 0 ? `$${subtotal.toLocaleString()}` : '–'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer - Solo se muestra si hay materiales */}
          {!isLoading && materials.length > 0 && (
            <div className="px-3 py-3 flex items-center justify-between border-t border-[var(--card-border)]">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-semibold text-[var(--card-fg)] uppercase">TOTAL POR UNIDAD:</span>
              </div>
              <div className="text-xs font-semibold text-[var(--card-fg)] text-right" style={{ minWidth: '80px' }}>
                ${totalPerUnit.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        </PopoverContent>
        </Popover>
      )}
    </>
  )
}