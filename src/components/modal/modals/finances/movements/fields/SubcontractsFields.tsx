import React, { useState, useEffect } from 'react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, FileText } from 'lucide-react'
import { useProjectSubcontracts } from '@/hooks/use-project-subcontracts'
import { useCurrentUser } from '@/hooks/use-current-user'

// Subcontract item interface
export interface SubcontractItem {
  subcontract_id: string
  contact_name: string
  amount: number
}

// Props interface
interface SubcontractsFieldsProps {
  selectedSubcontracts: SubcontractItem[]
  onSubcontractsChange: (subcontractsList: SubcontractItem[]) => void
}

export const SubcontractsFields: React.FC<SubcontractsFieldsProps> = ({
  selectedSubcontracts,
  onSubcontractsChange
}) => {
  // Initialize with existing subcontracts or one empty row
  const [subcontractsRows, setSubcontractsRows] = useState<SubcontractItem[]>(() => {
    if (selectedSubcontracts && selectedSubcontracts.length > 0) {
      return selectedSubcontracts
    }
    return [{ subcontract_id: '', contact_name: '', amount: 0 }]
  })
  
  // Get current user data to access project info
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id

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

  const handleSubcontractChange = (index: number, subcontractId: string) => {
    const selectedSubcontract = projectSubcontracts.find(s => s.id === subcontractId)
    let contactName = 'Sin nombre'
    
    if (selectedSubcontract) {
      // Handle both array and object contact structures
      const contact = Array.isArray(selectedSubcontract.contact) ? selectedSubcontract.contact[0] : selectedSubcontract.contact
      const fullContactName = contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || contact?.company_name || 'Sin nombre'
      contactName = selectedSubcontract.title || fullContactName
    }

    const newRows = subcontractsRows.map((row, i) => 
      i === index 
        ? { ...row, subcontract_id: subcontractId, contact_name: contactName }
        : row
    )
    setSubcontractsRows(newRows)
    onSubcontractsChange(newRows)
  }

  const handleAmountChange = (index: number, amount: string) => {
    const newRows = subcontractsRows.map((row, i) => 
      i === index 
        ? { ...row, amount: parseFloat(amount) || 0 }
        : row
    )
    setSubcontractsRows(newRows)
    onSubcontractsChange(newRows)
  }

  const addNewRow = () => {
    const newRows = [...subcontractsRows, { subcontract_id: '', contact_name: '', amount: 0 }]
    setSubcontractsRows(newRows)
    onSubcontractsChange(newRows)
  }

  const removeRow = (index: number) => {
    if (subcontractsRows.length > 1) {
      const newRows = subcontractsRows.filter((_, i) => i !== index)
      setSubcontractsRows(newRows)
      onSubcontractsChange(newRows)
    }
  }

  // Sync external changes with internal state
  useEffect(() => {
    if (selectedSubcontracts !== subcontractsRows) {
      setSubcontractsRows(selectedSubcontracts.length > 0 ? selectedSubcontracts : [{ subcontract_id: '', contact_name: '', amount: 0 }])
    }
  }, [selectedSubcontracts])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <FileText className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Subcontratos</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Especifica los subcontratos y montos correspondientes
          </p>
        </div>
      </div>
      {/* Subcontracts Rows - Default two columns */}
      {subcontractsRows.map((row, index) => (
        <div key={index} className="grid grid-cols-[3fr,1fr] gap-3 items-end">
          {/* Left Column - Subcontract Selector */}
          <div>
            <ComboBox
              value={row.subcontract_id}
              onValueChange={(value) => handleSubcontractChange(index, value)}
              options={subcontractsOptions}
              placeholder="Seleccionar subcontrato..."
              searchPlaceholder="Buscar subcontrato..."
              emptyMessage={isLoading ? "Cargando..." : "No hay subcontratos disponibles"}
              disabled={isLoading}
            />
          </div>
          
          {/* Right Column - Amount */}
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={row.amount}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-right pl-8"
              />
            </div>
            {subcontractsRows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={() => removeRow(index)}
                className="h-10 w-10 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {/* Add New Row Button */}
      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={addNewRow}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Otro
        </Button>
      </div>
    </div>
  )
}