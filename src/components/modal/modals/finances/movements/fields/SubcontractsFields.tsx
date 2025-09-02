import React, { useState, useEffect } from 'react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { FileText } from 'lucide-react'
import { useProjectSubcontracts } from '@/hooks/use-project-subcontracts'
import { useCurrentUser } from '@/hooks/use-current-user'

// Subcontract item interface
export interface SubcontractItem {
  subcontract_id: string
  contact_name: string
}

// Props interface
interface SubcontractsFieldsProps {
  selectedSubcontracts: SubcontractItem[]
  onSubcontractsChange: (subcontractsList: SubcontractItem[]) => void
  projectId?: string
}

export const SubcontractsFields: React.FC<SubcontractsFieldsProps> = ({
  selectedSubcontracts,
  onSubcontractsChange,
  projectId
}) => {
  // Single subcontract state for simplified interface
  const [subcontractId, setSubcontractId] = useState(
    selectedSubcontracts.length > 0 ? selectedSubcontracts[0].subcontract_id : ''
  )
  
  // Get current user data to access project info
  const { data: userData } = useCurrentUser()

  // Get project subcontracts
  const { data: projectSubcontracts = [], isLoading } = useProjectSubcontracts(projectId)

  // Transform subcontracts data for ComboBox  
  const subcontractsOptions = projectSubcontracts.map((subcontract: any) => {
    // Handle both array and object contact structures
    const contact = Array.isArray(subcontract.contact) ? subcontract.contact[0] : subcontract.contact
    const contactName = contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || contact?.company_name || 'Sin nombre'
    return {
      value: subcontract.id,
      label: subcontract.title || contactName
    }
  })

  const handleSubcontractChange = (value: string) => {
    setSubcontractId(value)
    
    const selectedSubcontract = projectSubcontracts.find(s => s.id === value)
    let contactName = 'Sin nombre'
    
    if (selectedSubcontract) {
      // Handle both array and object contact structures
      const contact = Array.isArray(selectedSubcontract.contact) ? selectedSubcontract.contact[0] : selectedSubcontract.contact
      const fullContactName = contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || contact?.company_name || 'Sin nombre'
      contactName = selectedSubcontract.title || fullContactName
    }

    if (value) {
      onSubcontractsChange([{
        subcontract_id: value,
        contact_name: contactName
      }])
    } else {
      onSubcontractsChange([])
    }
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedSubcontractId = selectedSubcontracts.length > 0 ? selectedSubcontracts[0].subcontract_id : ''
    
    if (subcontractId !== expectedSubcontractId) {
      setSubcontractId(expectedSubcontractId)
    }
  }, [selectedSubcontracts, subcontractId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <FileText className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Subcontratos</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el contratista asociado
          </p>
        </div>
      </div>
      {/* Subcontract Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Contratista
        </label>
        <ComboBox
          value={subcontractId}
          onValueChange={handleSubcontractChange}
          options={subcontractsOptions}
          placeholder="Seleccionar contratista..."
          searchPlaceholder="Buscar contratista..."
          emptyMessage={isLoading ? "Cargando..." : "No hay contratistas disponibles"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}