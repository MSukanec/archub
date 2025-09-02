import React, { useState, useEffect } from 'react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Calculator } from 'lucide-react'
import { useIndirectCosts } from '@/hooks/use-indirect-costs'
import { useCurrentUser } from '@/hooks/use-current-user'

// Indirect item interface
export interface IndirectItem {
  indirect_id: string
  indirect_name: string
}

// Props interface
interface IndirectFieldsProps {
  selectedIndirects: IndirectItem[]
  onIndirectsChange: (indirectsList: IndirectItem[]) => void
  projectId?: string
}

export const IndirectFields: React.FC<IndirectFieldsProps> = ({
  selectedIndirects,
  onIndirectsChange,
  projectId
}) => {
  // Single indirect state for simplified interface
  const [indirectId, setIndirectId] = useState(
    selectedIndirects.length > 0 ? selectedIndirects[0].indirect_id : ''
  )
  
  // Get current user data to access organization info
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  // Get indirect costs for this organization
  const { data: indirectCosts = [], isLoading } = useIndirectCosts(organizationId)

  // Transform indirect costs data for ComboBox  
  const indirectsOptions = indirectCosts.map((indirect: any) => {
    return {
      value: indirect.id,
      label: indirect.name || 'Sin nombre'
    }
  })

  const handleIndirectChange = (value: string) => {
    setIndirectId(value)
    
    const selectedIndirect = indirectCosts.find(i => i.id === value)
    let indirectName = 'Sin nombre'
    
    if (selectedIndirect) {
      indirectName = selectedIndirect.name || 'Sin nombre'
    }

    if (value) {
      onIndirectsChange([{
        indirect_id: value,
        indirect_name: indirectName
      }])
    } else {
      onIndirectsChange([])
    }
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedIndirectId = selectedIndirects.length > 0 ? selectedIndirects[0].indirect_id : ''
    
    if (indirectId !== expectedIndirectId) {
      setIndirectId(expectedIndirectId)
    }
  }, [selectedIndirects, indirectId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <Calculator className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Costos Indirectos</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el costo indirecto asociado
          </p>
        </div>
      </div>
      {/* Indirect Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Costo Indirecto
        </label>
        <ComboBox
          value={indirectId}
          onValueChange={handleIndirectChange}
          options={indirectsOptions}
          placeholder="Seleccionar costo indirecto..."
          searchPlaceholder="Buscar costo indirecto..."
          emptyMessage={isLoading ? "Cargando..." : "No hay costos indirectos disponibles"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}