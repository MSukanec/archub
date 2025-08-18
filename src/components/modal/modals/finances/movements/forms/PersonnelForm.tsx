import React, { useState } from 'react'
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

export function PersonnelForm({ onClose, onConfirm }: PersonnelFormProps) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [addedPersonnel, setAddedPersonnel] = useState<PersonnelItem[]>([])
  
  // Get current user data to access project info
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id

  // Get project personnel
  const { data: projectPersonnel = [], isLoading } = useProjectPersonnel(projectId)

  // Transform personnel data for ComboBox
  const personnelOptions = projectPersonnel.map((person: any) => ({
    value: person.id,
    label: `${person.contact?.first_name || ''} ${person.contact?.last_name || ''}`.trim() || 'Sin nombre'
  }))

  const handleAddPersonnel = () => {
    if (!selectedPersonnelId || !amount) return

    const selectedPerson = projectPersonnel.find(p => p.id === selectedPersonnelId)
    if (!selectedPerson) return

    const contactName = `${selectedPerson.contact?.first_name || ''} ${selectedPerson.contact?.last_name || ''}`.trim() || 'Sin nombre'
    
    const newPersonnelItem: PersonnelItem = {
      personnel_id: selectedPersonnelId,
      contact_name: contactName,
      amount: parseFloat(amount)
    }

    // Check if person is already added
    if (addedPersonnel.some(p => p.personnel_id === selectedPersonnelId)) {
      return // Don't add duplicates
    }

    setAddedPersonnel([...addedPersonnel, newPersonnelItem])
    setSelectedPersonnelId('')
    setAmount('')
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

  return (
    <div className="space-y-4">
      {/* ComboBox for Personnel Selection */}
      <div>
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

      {/* Amount Input */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Monto
        </label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>

      {/* Add Personnel Button */}
      <Button 
        type="button"
        variant="default" 
        onClick={handleAddPersonnel}
        className="w-full flex items-center gap-2"
        disabled={!selectedPersonnelId || !amount}
      >
        <Plus className="h-4 w-4" />
        Agregar Personal
      </Button>

      {/* Added Personnel List */}
      {addedPersonnel.length > 0 && (
        <div className="space-y-2">
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
              
              {/* Amount Column */}
              <div className="text-sm text-foreground font-medium text-right">
                ${person.amount.toFixed(2)}
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
            <div className="text-sm font-bold text-foreground text-right">
              ${addedPersonnel.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div></div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <Button 
        type="button"
        variant="default" 
        onClick={handleConfirm}
        className="w-full"
      >
        Confirmar Personal
      </Button>
    </div>
  )
}