import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { useProjectSubcontracts } from '@/hooks/use-project-subcontracts'
import { useCurrentUser } from '@/hooks/use-current-user'

// Subcontract item interface
export interface SubcontractItem {
  subcontract_id: string
  contact_name: string
  amount: number
}

// Props interface
interface SubcontractsFormProps {
  onClose: () => void
  onConfirm?: (subcontractsList: SubcontractItem[]) => void
  initialSubcontracts?: SubcontractItem[]
}

// Handle interface for ref
export interface SubcontractsFormHandle {
  confirmSubcontracts: () => void
}

export const SubcontractsForm = forwardRef<SubcontractsFormHandle, SubcontractsFormProps>(
  ({ onClose, onConfirm, initialSubcontracts }, ref) => {
    // Initialize with existing subcontracts or one empty row
    const [subcontractsRows, setSubcontractsRows] = useState<SubcontractItem[]>(() => {
      if (initialSubcontracts && initialSubcontracts.length > 0) {
        return initialSubcontracts
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

      setSubcontractsRows(rows => rows.map((row, i) => 
        i === index 
          ? { ...row, subcontract_id: subcontractId, contact_name: contactName }
          : row
      ))
    }

    const handleAmountChange = (index: number, amount: string) => {
      setSubcontractsRows(rows => rows.map((row, i) => 
        i === index 
          ? { ...row, amount: parseFloat(amount) || 0 }
          : row
      ))
    }

    const addNewRow = () => {
      setSubcontractsRows([...subcontractsRows, { subcontract_id: '', contact_name: '', amount: 0 }])
    }

    const removeRow = (index: number) => {
      if (subcontractsRows.length > 1) {
        setSubcontractsRows(rows => rows.filter((_, i) => i !== index))
      }
    }

    const handleConfirm = () => {
      // Filter out empty rows and send only valid subcontracts
      const validSubcontracts = subcontractsRows.filter(row => row.subcontract_id && row.amount > 0)
      if (onConfirm) {
        onConfirm(validSubcontracts)
      }
      onClose()
    }

    // Expose the confirmSubcontracts method via ref
    useImperativeHandle(ref, () => ({
      confirmSubcontracts: handleConfirm
    }))

    return (
      <div className="space-y-4">
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
            size="icon-sm"
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
)

SubcontractsForm.displayName = 'SubcontractsForm'