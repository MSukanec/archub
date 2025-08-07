import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Eye, Calculator } from 'lucide-react'

interface CommercialCalculationPopoverProps {
  material: {
    name: string
    computed_quantity: number
    unit_name?: string
    commercial_unit_name?: string
    commercial_equivalence?: number
    commercial_quantity?: number
  }
}

export function CommercialCalculationPopover({ material }: CommercialCalculationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  // No mostrar el botón si no hay unidad comercial definida
  if (!material.commercial_unit_name || !material.commercial_equivalence || material.commercial_equivalence <= 0) {
    return null
  }

  const technicalQuantity = material.computed_quantity
  const equivalence = material.commercial_equivalence
  const commercialQuantity = material.commercial_quantity
  const unitName = material.unit_name || 'unidad'
  const commercialUnitName = material.commercial_unit_name

  // Calcular la división exacta para mostrar
  const exactDivision = technicalQuantity / equivalence
  const formattedDivision = exactDivision.toFixed(3)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
        >
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="left"
        sideOffset={10}
      >
          {/* Header */}
                Cálculo Comercial
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
            {/* Material name */}
                {material.name}
              </h3>
            </div>

            {/* Calculation steps */}
              {/* Step 1: Division */}
                  1. División:
                </div>
                  {technicalQuantity} {unitName} ÷ {equivalence} {unitName}/{commercialUnitName} = {formattedDivision}
                </div>
              </div>

              {/* Step 2: Rounding */}
                  2. Redondeo hacia arriba:
                </div>
                </div>
              </div>

              {/* Step 3: Explanation */}
                  <strong>¿Por qué redondear hacia arriba?</strong><br />
                  No se pueden comprar fracciones de {commercialUnitName.toLowerCase()}. 
                  Siempre se compra la cantidad entera superior.
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}