import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { useProjectPersonnel, ProjectPersonnel } from '@/hooks/use-project-personnel'
import { useCurrentUser } from '@/hooks/use-current-user'

interface PersonnelItem {
  personnel_id: string
  contact_name: string
  amount: number
}

interface PersonnelFormProps {
  onClose: () => void
  onConfirm?: (personnelList: PersonnelItem[]) => void
}

export interface PersonnelFormHandle {
  confirmPersonnel: () => void
}

export const PersonnelForm = forwardRef<PersonnelFormHandle, PersonnelFormProps>(
  ({ onClose, onConfirm }, ref) => {
    const [selectedPersonnelId, setSelectedPersonnelId] = useState('')
    const [addedPersonnel, setAddedPersonnel] = useState<PersonnelItem[]>([])
    
    // Get current user data to access project info
    const { data: userData } = useCurrentUser()
    const projectId = userData?.preferences?.last_project_id

    // Get project personnel
    const { data: projectPersonnel = [], isLoading } = useProjectPersonnel(projectId)

    // Transform personnel data for ComboBox
    const personnelOptions = projectPersonnel.map((person: any) => ({
      value: person.id,
      label: `${person.contact?.[0]?.first_name || ''} ${person.contact?.[0]?.last_name || ''}`.trim() || 'Sin nombre'
    }))

    const handleAddPersonnel = () => {
      if (!selectedPersonnelId) return

      const selectedPerson = projectPersonnel.find(p => p.id === selectedPersonnelId)
      if (!selectedPerson) return

      // Check if person is already added
      if (addedPersonnel.some(p => p.personnel_id === selectedPersonnelId)) {
        return // Don't add duplicates
      }

      const contactName = `${selectedPerson.contact?.[0]?.first_name || ''} ${selectedPerson.contact?.[0]?.last_name || ''}`.trim() || 'Sin nombre'
    
    const newPersonnelItem: PersonnelItem = {
      personnel_id: selectedPersonnelId,
      contact_name: contactName,
      amount: 0 // Start with 0, user will input amount
    }

    setAddedPersonnel([...addedPersonnel, newPersonnelItem])
    setSelectedPersonnelId('')
  }

  const handleAmountChange = (personnelId: string, amount: string) => {
    setAddedPersonnel(addedPersonnel.map(person => 
      person.personnel_id === personnelId 
        ? { ...person, amount: parseFloat(amount) || 0 }
        : person
    ))
  }

  const handleRemovePersonnel = (personnelId: string) => {
    setAddedPersonnel(addedPersonnel.filter(p => p.personnel_id !== personnelId))
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(addedPersonnel)
    }
    onClose()
  }

  // Expose the confirmPersonnel method via ref
  useImperativeHandle(ref, () => ({
    confirmPersonnel: handleConfirm
  }))

  return (
    <div className="space-y-4">
      {/* Personnel Selection - Inline with Add Button */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Seleccionar Personal
          </label>
          <ComboBox
            value={selectedPersonnelId}
            onValueChange={setSelectedPersonnelId}
            options={personnelOptions}
            placeholder="Seleccionar personal..."
            searchPlaceholder="Buscar personal..."
            emptyMessage={isLoading ? "Cargando..." : "No hay personal disponible"}
            disabled={isLoading}
          />
        </div>
        <Button 
          type="button"
          variant="default" 
          onClick={handleAddPersonnel}
          className="flex items-center gap-2 h-10"
          disabled={!selectedPersonnelId}
        >
          <Plus className="h-4 w-4" />
          Agregar Personal
        </Button>
      </div>

      {/* Added Personnel List with editable amounts */}
      {addedPersonnel.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Personal Agregado:</h4>
          {addedPersonnel.map((person) => (
            <div 
              key={person.personnel_id} 
              className="grid grid-cols-[1fr,120px,40px] gap-3 p-3 bg-muted/30 rounded-md items-center"
            >
              {/* Name Column */}
              <div className="text-sm text-foreground truncate">
                {person.contact_name}
              </div>
              
              {/* Amount Input Column */}
              <div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={person.amount}
                  onChange={(e) => handleAmountChange(person.personnel_id, e.target.value)}
                  min="0"
                  step="0.01"
                  className="text-right text-sm h-8"
                />
              </div>
              
              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePersonnel(person.personnel_id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {/* Total */}
          <div className="grid grid-cols-[1fr,120px,40px] gap-3 p-3 border-t border-border items-center">
            <div className="text-sm font-medium text-foreground">
              Total:
            </div>
            <div className="text-sm font-bold text-foreground text-right pr-3">
              ${addedPersonnel.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  )
})