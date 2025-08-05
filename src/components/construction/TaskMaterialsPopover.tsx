import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { Eye, X, Package, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface TaskMaterialsPopoverProps {
  task: any
  showCost?: boolean
}

export function TaskMaterialsPopover({ task, showCost = false }: TaskMaterialsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id)

  const handleReplaceMaterial = (materialId: string) => {
    // TODO: Abrir modal de selección de producto
    console.log('Reemplazar material:', materialId)
  }

  // Calcular total por unidad usando material_view.computed_unit_price
  const totalPerUnit = materials.reduce((sum, material) => {
    const unitPrice = material.material_view?.computed_unit_price || 0;
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

  return (
    <>
      {showCost && totalPerUnit > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          {formatCost(totalPerUnit)}
        </span>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
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
          {/* Header - Sin ícono, texto en doble fila */}
          <div className="px-3 py-3 flex items-start justify-between border-b border-[var(--card-border)]">
            <div className="flex-1 pr-2">
              <h2 className="text-sm font-medium text-[var(--card-fg)] leading-tight">
                Materiales por unidad
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                Detalle y costos de materiales
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-3">
                <div className="text-sm text-muted-foreground">Cargando materiales...</div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-3">
                <div className="text-sm text-muted-foreground">
                  No hay materiales definidos para esta tarea
                </div>
              </div>
            ) : (
              <>
                {/* Lista de materiales con scroll si hay más de 5 */}
                <div className={`space-y-3 ${materials.length > 5 ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
                  {materials.map((material) => {
                    const quantity = material.amount || 0;
                    const unitPrice = material.material_view?.computed_unit_price || 0;
                    const subtotal = quantity * unitPrice;
                    const unitName = material.material_view?.unit_of_computation || 'UD';
                    
                    return (
                      <div key={material.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                        {/* Icono del material */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        
                        {/* Información del material */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate text-gray-900">
                            {material.material_view?.name || 'Material sin nombre'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{quantity} {unitName}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {unitPrice > 0 ? `$${unitPrice.toLocaleString()}` : '–'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Precio total y botón */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {subtotal > 0 ? `$${subtotal.toLocaleString()}` : '–'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplaceMaterial(material.id)}
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                            title="Reemplazar por producto real"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-3" />

                {/* Total */}
                <div className="flex items-center justify-between py-2">
                  <span className="font-semibold text-sm text-gray-900">Total por unidad:</span>
                  <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                    ${totalPerUnit.toLocaleString()}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </>
  )
}