import React, { useState, useEffect } from 'react'
import { Building } from 'lucide-react'
import { useProjectClients } from '@/features/clients'
import { useCurrentUser } from '@/features/users/hooks'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'


export interface CommitmentItem {
  project_client_id: string
  client_name: string
  unit: string
}

interface ClientsFieldsProps {
  selectedClients: CommitmentItem[]
  onClientsChange: (commitments: CommitmentItem[]) => void
  projectId?: string
}

export const ClientsFields: React.FC<ClientsFieldsProps> = ({
  selectedClients,
  onClientsChange,
  projectId
}) => {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  const { data: projectClients = [], isLoading: clientsLoading } = useProjectClients(
    projectId,
    organizationId
  )

  // Single row state for simplified interface
  const [commitmentId, setCommitmentId] = useState(
    selectedClients.length > 0 ? selectedClients[0].project_client_id : ''
  )


  // Function to get commitment display name (unit + client)
  const getCommitmentDisplayName = (projectClient: any): string => {
    if (!projectClient?.contact) return 'Cliente sin nombre'
    
    const { contact } = projectClient
    let clientName = ''
    
    if (contact.company_name) {
      clientName = contact.company_name
    } else if (contact.full_name) {
      clientName = contact.full_name
    } else {
      clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente sin nombre'
    }
    
    // Add unit information if available - UNIT FIRST, otherwise just client name
    if (projectClient.unit) {
      return `${projectClient.unit} - ${clientName}`
    }
    return clientName
  }

  // Create options for ComboBox - sorted by unit
  const commitmentOptions = projectClients
    .sort((a, b) => {
      const unitA = a.unit || 'ZZZ' // Put items without unit at the end
      const unitB = b.unit || 'ZZZ'
      return unitA.localeCompare(unitB)
    })
    .map(client => ({
      value: client.id,
      label: getCommitmentDisplayName(client)
    }))

  // Handle commitment change
  const handleCommitmentChange = (value: string) => {
    setCommitmentId(value)
    updateSelectedClients(value)
  }

  // Update selectedClients based on current values
  const updateSelectedClients = (currentCommitmentId: string) => {
    if (!currentCommitmentId) {
      onClientsChange([])
      return
    }

    const projectClient = projectClients.find(pc => pc.id === currentCommitmentId)
    
    if (!projectClient?.contact) {
      const validCommitment = {
        project_client_id: currentCommitmentId,
        client_name: 'Cliente desconocido',
        unit: 'Sin unidad'
      }
      onClientsChange([validCommitment])
      return
    }
    
    const { contact } = projectClient
    let clientName = ''
    
    if (contact.company_name) {
      clientName = contact.company_name
    } else if (contact.full_name) {
      clientName = contact.full_name
    } else {
      clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente sin nombre'
    }
    
    const validCommitment = {
      project_client_id: currentCommitmentId,
      client_name: clientName,
      unit: projectClient.unit || 'Sin unidad'
    }

    onClientsChange([validCommitment])
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedCommitmentId = selectedClients.length > 0 ? selectedClients[0].project_client_id : ''
    
    if (commitmentId !== expectedCommitmentId) {
      setCommitmentId(expectedCommitmentId)
    }
  }, [selectedClients, commitmentId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <Building className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Clientes de Proyecto</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el cliente del proyecto
          </p>
        </div>
      </div>
      {/* Client Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Cliente
        </label>
        <ComboBox
          value={commitmentId}
          onValueChange={handleCommitmentChange}
          options={commitmentOptions}
          placeholder="Seleccionar cliente..."
          searchPlaceholder="Buscar cliente..."
          emptyMessage={clientsLoading ? "Cargando..." : "No hay clientes disponibles"}
          disabled={clientsLoading}
        />
      </div>
    </div>
  )
}