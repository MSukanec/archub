import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { Eye, X, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface TaskMaterialsPopoverProps {
  task: any
}

export function TaskMaterialsPopover({ task }: TaskMaterialsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id)

  const handleReplaceMaterial = (materialId: string) => {
    // TODO: Abrir modal de selección de producto
    console.log('Reemplazar material:', materialId)
  }

  // Calcular total por unidad (simplificado por ahora)
  const totalPerUnit = materials.reduce((sum, material) => {
    // Por ahora usamos un precio genérico, luego se conectará con precios reales
    return sum + (material.amount * 10) // $10 por defecto
  }, 0)

  return (
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
        className="w-80 p-0" 
        align="center"
        side="left"
        sideOffset={10}
      >
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">MATERIALES (por unidad)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Cargando materiales...</div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  No hay materiales definidos para esta tarea
                </div>
              </div>
            ) : (
              <>
                {materials.map((material) => (
                  <div key={material.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧱</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {material.materials?.name || 'Material sin nombre'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {material.amount} {material.materials?.units?.name || 'ud'} – $
                              {(material.amount * 10).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplaceMaterial(material.id)}
                      className="w-full h-7 text-xs"
                    >
                      Reemplazar
                    </Button>
                  </div>
                ))}

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-sm">💲 Total por unidad:</span>
                  <Badge variant="secondary" className="font-mono">
                    ${totalPerUnit.toFixed(0)}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}