import React, { useState } from 'react'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProjectPersonnel, ProjectPersonnel } from '@/hooks/use-project-personnel'
import { useCurrentUser } from '@/hooks/use-current-user'

interface PersonnelFormProps {
  onClose: () => void
}

export function PersonnelForm({ onClose }: PersonnelFormProps) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('')
  
  // Get current user data to access project info
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id

  // Get project personnel
  const { data: projectPersonnel = [], isLoading } = useProjectPersonnel(projectId)

  // Transform personnel data for ComboBox
  const personnelOptions = projectPersonnel.map((person: ProjectPersonnel) => ({
    value: person.id,
    label: `${person.contact?.first_name || ''} ${person.contact?.last_name || ''}`.trim() || 'Sin nombre'
  }))

  const handleAddPersonnel = () => {
    console.log('Agregar Personal clicked')
    // TODO: Implementar lógica para agregar nuevo personal
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

      {/* Add Personnel Button */}
      <Button 
        type="button"
        variant="default" 
        onClick={handleAddPersonnel}
        className="w-full flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar Personal
      </Button>
    </div>
  )
}