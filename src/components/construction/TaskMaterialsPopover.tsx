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
          {formatCost(totalPerUnit)}
        </span>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
          >
          </Button>
        </PopoverTrigger>
      <PopoverContent 
        align="center"
        side="left"
        sideOffset={10}
      >
          {/* Header - Con ícono, sin descripción */}
                Materiales por unidad
              </h2>
            </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
              </Button>
            </div>
          </div>

          {/* Content */}
            {isLoading ? (
              </div>
            ) : materials.length === 0 ? (
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
                        {/* Icono del material */}
                          </div>
                        </div>
                        
                        {/* Información del material */}
                            {material.material_view?.name || 'Material sin nombre'}
                          </div>
                            <span>{quantity} {unitName}</span>
                            <span>•</span>
                              {unitPrice > 0 ? `$${unitPrice.toLocaleString()}` : '–'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Precio total y botón */}
                              {subtotal > 0 ? `$${subtotal.toLocaleString()}` : '–'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplaceMaterial(material.id)}
                          >
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total - Misma altura que header */}
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