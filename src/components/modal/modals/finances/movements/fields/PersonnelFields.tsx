import React, { useState, useEffect } from 'react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Users } from 'lucide-react'
import { useProjectPersonnel, ProjectPersonnel } from '@/hooks/use-project-personnel'
import { useCurrentUser } from '@/hooks/use-current-user'

// Personnel item interface
export interface PersonnelItem {
  personnel_id: string
  contact_name: string
}

// Props interface
interface PersonnelFieldsProps {
  selectedPersonnel: PersonnelItem[]
  onPersonnelChange: (personnelList: PersonnelItem[]) => void
}

export const PersonnelFields: React.FC<PersonnelFieldsProps> = ({
  selectedPersonnel,
  onPersonnelChange
}) => {
  // Single personnel state for simplified interface
  const [personnelId, setPersonnelId] = useState(
    selectedPersonnel.length > 0 ? selectedPersonnel[0].personnel_id : ''
  )
  
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

  const handlePersonnelChange = (value: string) => {
    setPersonnelId(value)
    
    const selectedPerson = projectPersonnel.find(p => p.id === value)
    let contactName = 'Sin nombre'
    
    if (selectedPerson) {
      // Handle both array and object contact structures
      const contact = Array.isArray(selectedPerson.contact) ? selectedPerson.contact[0] : selectedPerson.contact
      contactName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre'
    }

    if (value) {
      onPersonnelChange([{
        personnel_id: value,
        contact_name: contactName
      }])
    } else {
      onPersonnelChange([])
    }
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedPersonnelId = selectedPersonnel.length > 0 ? selectedPersonnel[0].personnel_id : ''
    
    if (personnelId !== expectedPersonnelId) {
      setPersonnelId(expectedPersonnelId)
    }
  }, [selectedPersonnel, personnelId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <Users className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Personal</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el personal asociado
          </p>
        </div>
      </div>
      {/* Personnel Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Personal
        </label>
        <ComboBox
          value={personnelId}
          onValueChange={handlePersonnelChange}
          options={personnelOptions}
          placeholder="Seleccionar personal..."
          searchPlaceholder="Buscar personal..."
          emptyMessage={isLoading ? "Cargando..." : "No hay personal disponible"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}