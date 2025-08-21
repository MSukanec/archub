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
          className=" ml-1 opacity-60 hover:opacity-100"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg rounded-lg"
        side="left"
        sideOffset={10}
      >
        <div className="relative">
          {/* Header */}
          <div className="px-3 py-3 flex items-center justify-between border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2 flex-1">
              <Calculator className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-medium text-[var(--card-fg)]">
                Cálculo Comercial
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className=""
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Material name */}
            <div className="mb-3">
              <h3 className="text-sm font-medium text-[var(--card-fg)] leading-tight">
                {material.name}
              </h3>
            </div>

            {/* Calculation steps */}
            <div className="space-y-3 text-sm">
              {/* Step 1: Division */}
              <div className="bg-[var(--muted-bg)] rounded-lg p-3">
                <div className="font-medium text-[var(--card-fg)] mb-1">
                  1. División:
                </div>
                <div className="text-[var(--muted-fg)] font-mono">
                  {technicalQuantity} {unitName} ÷ {equivalence} {unitName}/{commercialUnitName} = {formattedDivision}
                </div>
              </div>

              {/* Step 2: Rounding */}
              <div className="bg-[var(--muted-bg)] rounded-lg p-3">
                <div className="font-medium text-[var(--card-fg)] mb-1">
                  2. Redondeo hacia arriba:
                </div>
                <div className="text-[var(--muted-fg)]">
                  {formattedDivision} → redondeado a <span className="font-semibold text-[var(--card-fg)]">{commercialQuantity} {commercialUnitName}</span>
                </div>
              </div>

              {/* Step 3: Explanation */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-800 dark:text-blue-200">
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