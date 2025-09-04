import React, { useState, useEffect } from 'react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { CreditCard } from 'lucide-react'
import { useGeneralCosts } from '@/hooks/use-general-costs'
import { useCurrentUser } from '@/hooks/use-current-user'

// General cost item interface
export interface GeneralCostItem {
  general_cost_id: string
}

// Props interface
interface GeneralCostsFieldsProps {
  selectedGeneralCosts: GeneralCostItem[]
  onGeneralCostsChange: (generalCostsList: GeneralCostItem[]) => void
  projectId?: string
}

export const GeneralCostsFields: React.FC<GeneralCostsFieldsProps> = ({
  selectedGeneralCosts,
  onGeneralCostsChange,
  projectId
}) => {
  // Single general cost state for simplified interface
  const [generalCostId, setGeneralCostId] = useState(
    selectedGeneralCosts.length > 0 ? selectedGeneralCosts[0].general_cost_id : ''
  )
  
  // Get current user data to access organization info
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  // Get general costs for this organization
  const { data: generalCosts = [], isLoading } = useGeneralCosts(organizationId || null)

  // Transform general costs data for ComboBox  
  const generalCostsOptions = generalCosts.map((generalCost: any) => {
    return {
      value: generalCost.id,
      label: generalCost.name || 'Sin nombre'
    }
  })

  const handleGeneralCostChange = (value: string) => {
    setGeneralCostId(value)

    if (value) {
      onGeneralCostsChange([{
        general_cost_id: value
      }])
    } else {
      onGeneralCostsChange([])
    }
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedGeneralCostId = selectedGeneralCosts.length > 0 ? selectedGeneralCosts[0].general_cost_id : ''
    
    if (generalCostId !== expectedGeneralCostId) {
      setGeneralCostId(expectedGeneralCostId)
    }
  }, [selectedGeneralCosts, generalCostId, generalCosts])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <CreditCard className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Gastos Generales</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el gasto general asociado
          </p>
        </div>
      </div>
      {/* General Cost Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Gasto General
        </label>
        <ComboBox
          value={generalCostId}
          onValueChange={handleGeneralCostChange}
          options={generalCostsOptions}
          placeholder="Seleccionar gasto general..."
          searchPlaceholder="Buscar gasto general..."
          emptyMessage={isLoading ? "Cargando..." : "No hay gastos generales disponibles"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}