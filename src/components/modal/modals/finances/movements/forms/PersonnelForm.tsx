import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { useProjectPersonnel, ProjectPersonnel } from '@/hooks/use-project-personnel'
import { useCurrentUser } from '@/hooks/use-current-user'

// Personnel item interface
export interface PersonnelItem {
  personnel_id: string
  contact_name: string
  amount: number
}

// Props interface
interface PersonnelFormProps {
  onClose: () => void
  onConfirm?: (personnelList: PersonnelItem[]) => void
  initialPersonnel?: PersonnelItem[]
}

// Handle interface for ref
export interface PersonnelFormHandle {
  confirmPersonnel: () => void
}

export const PersonnelForm = forwardRef<PersonnelFormHandle, PersonnelFormProps>(
  ({ onClose, onConfirm, initialPersonnel }, ref) => {
    // Initialize with existing personnel or one empty row
    const [personnelRows, setPersonnelRows] = useState<PersonnelItem[]>(() => {
      if (initialPersonnel && initialPersonnel.length > 0) {
        return initialPersonnel
      }
      return [{ personnel_id: '', contact_name: '', amount: 0 }]
    })
    
    // Get current user data to access project info
    const { data: userData } = useCurrentUser()
    const projectId = userData?.preferences?.last_project_id

    // Get project personnel
    const { data: projectPersonnel = [], isLoading } = useProjectPersonnel(projectId)

    // Transform personnel data for ComboBox  
    const personnelOptions = projectPersonnel.map((person: any) => {
      // Handle both array and object contact structures
      const contact = Array.isArray(person.contact) ? person.contact[0] : person.contact
      return {
        value: person.id,
        label: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre'
      }
    })

    const handlePersonnelChange = (index: number, personnelId: string) => {
      const selectedPerson = projectPersonnel.find(p => p.id === personnelId)
      let contactName = 'Sin nombre'
      
      if (selectedPerson) {
        // Handle both array and object contact structures
        const contact = Array.isArray(selectedPerson.contact) ? selectedPerson.contact[0] : selectedPerson.contact
        contactName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre'
      }

      setPersonnelRows(rows => rows.map((row, i) => 
        i === index 
          ? { ...row, personnel_id: personnelId, contact_name: contactName }
          : row
      ))
    }

    const handleAmountChange = (index: number, amount: string) => {
      setPersonnelRows(rows => rows.map((row, i) => 
        i === index 
          ? { ...row, amount: parseFloat(amount) || 0 }
          : row
      ))
    }

    const addNewRow = () => {
      setPersonnelRows([...personnelRows, { personnel_id: '', contact_name: '', amount: 0 }])
    }

    const removeRow = (index: number) => {
      if (personnelRows.length > 1) {
        setPersonnelRows(rows => rows.filter((_, i) => i !== index))
      }
    }

    const handleConfirm = () => {
      // Filter out empty rows and send only valid personnel
      const validPersonnel = personnelRows.filter(row => row.personnel_id && row.amount > 0)
      if (onConfirm) {
        onConfirm(validPersonnel)
      }
      onClose()
    }

    // Expose the confirmPersonnel method via ref
    useImperativeHandle(ref, () => ({
      confirmPersonnel: handleConfirm
    }))

    return (
      <div className="space-y-4">
        {/* Personnel Rows - Default two columns */}
        {personnelRows.map((row, index) => (
          <div key={index} className="grid grid-cols-2 gap-3 items-end">
            {/* Left Column - Personnel Selector */}
            <div>
              <ComboBox
                value={row.personnel_id}
                onValueChange={(value) => handlePersonnelChange(index, value)}
                options={personnelOptions}
                placeholder="Seleccionar personal..."
                searchPlaceholder="Buscar personal..."
                emptyMessage={isLoading ? "Cargando..." : "No hay personal disponible"}
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
              {personnelRows.length > 1 && (
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
            Agregar Personal
          </Button>
        </div>
      </div>
    )
  }
)

PersonnelForm.displayName = 'PersonnelForm'