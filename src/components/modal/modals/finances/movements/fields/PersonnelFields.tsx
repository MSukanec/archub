import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Users } from 'lucide-react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { useProjectPersonnel } from '@/hooks/use-project-personnel'
import { useCurrentUser } from '@/hooks/use-current-user'

interface PersonnelFieldsProps {
  selectedPersonnel: Array<{personnel_id: string, contact_name: string, amount: number}>
  onPersonnelChange: (personnelList: Array<{personnel_id: string, contact_name: string, amount: number}>) => void
}

export function PersonnelFields({ selectedPersonnel, onPersonnelChange }: PersonnelFieldsProps) {
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id
  const { data: projectPersonnel = [], isLoading } = useProjectPersonnel(projectId)

  // Transform personnel data for ComboBox  
  const personnelOptions = projectPersonnel.map((person: any) => {
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
      const contact = Array.isArray(selectedPerson.contact) ? selectedPerson.contact[0] : selectedPerson.contact
      contactName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre'
    }

    const updatedPersonnel = selectedPersonnel.map((row, i) => 
      i === index 
        ? { ...row, personnel_id: personnelId, contact_name: contactName }
        : row
    )
    onPersonnelChange(updatedPersonnel)
  }

  const handleAmountChange = (index: number, amount: string) => {
    const updatedPersonnel = selectedPersonnel.map((row, i) => 
      i === index 
        ? { ...row, amount: parseFloat(amount) || 0 }
        : row
    )
    onPersonnelChange(updatedPersonnel)
  }

  const addPersonnelRow = () => {
    onPersonnelChange([...selectedPersonnel, { personnel_id: '', contact_name: '', amount: 0 }])
  }

  const removePersonnelRow = (index: number) => {
    if (selectedPersonnel.length > 1) {
      const updatedPersonnel = selectedPersonnel.filter((_, i) => i !== index)
      onPersonnelChange(updatedPersonnel)
    }
  }

  const totalAmount = selectedPersonnel.reduce((sum, person) => sum + (person.amount || 0), 0)

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <h3 className="font-medium text-sm">Gestión de Personal</h3>
      </div>
      
      {selectedPersonnel.map((person, index) => (
        <div key={index} className="grid grid-cols-[2fr,1fr,auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Personal
            </label>
            <ComboBox
              options={personnelOptions}
              value={person.personnel_id}
              onValueChange={(value) => handlePersonnelChange(index, value)}
              placeholder="Seleccionar personal..."
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Monto
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={person.amount || ''}
              onChange={(e) => handleAmountChange(index, e.target.value)}
            />
          </div>
          
          <div className="flex gap-1">
            {index === selectedPersonnel.length - 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={addPersonnelRow}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {selectedPersonnel.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => removePersonnelRow(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {totalAmount > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-sm font-medium">Total:</span>
          <span className="text-sm font-bold">${totalAmount.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}