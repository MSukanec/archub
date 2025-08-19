import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'

export interface CommitmentRow {
  commitment_id: string
}

export interface CommitmentItem {
  project_client_id: string
  client_name: string
  unit: string
}

export interface ClientsFormHandle {
  confirmClients: () => void
}

interface ClientsFormProps {
  onClose: () => void
  onConfirm: (commitments: CommitmentItem[]) => void
  initialClients?: CommitmentItem[]
}

export const ClientsForm = forwardRef<ClientsFormHandle, ClientsFormProps>(
  ({ onClose, onConfirm, initialClients = [] }, ref) => {
    const { data: userData } = useCurrentUser()
    const projectId = userData?.preferences?.last_project_id
    const organizationId = userData?.organization?.id

    const { data: projectClients = [], isLoading } = useProjectClients(
      projectId,
      { enabled: !!projectId && !!organizationId }
    )

    // Initialize rows from initial commitments or create one empty row
    const initializeRows = (): CommitmentRow[] => {
      if (initialClients.length > 0) {
        return initialClients.map(client => ({
          commitment_id: client.project_client_id
        }))
      }
      return [{ commitment_id: '' }]
    }

    const [commitmentRows, setCommitmentRows] = useState<CommitmentRow[]>(initializeRows())

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
      
      // Add unit information if available - UNIT FIRST
      const unit = projectClient.unit || 'Sin unidad'
      return `${unit} - ${clientName}`
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
    const handleCommitmentChange = (index: number, commitmentId: string) => {
      const newRows = [...commitmentRows]
      newRows[index] = { ...newRows[index], commitment_id: commitmentId }
      setCommitmentRows(newRows)
    }



    // Remove row
    const removeRow = (index: number) => {
      if (commitmentRows.length > 1) {
        const newRows = commitmentRows.filter((_, i) => i !== index)
        setCommitmentRows(newRows)
      }
    }

    // Handle confirm
    const handleConfirm = () => {
      const validCommitments = commitmentRows
        .filter(row => row.commitment_id)
        .map(row => {
          const projectClient = projectClients.find(pc => pc.id === row.commitment_id)
          if (!projectClient?.contact) {
            return {
              project_client_id: row.commitment_id,
              client_name: 'Cliente desconocido',
              unit: 'Sin unidad'
            }
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
          
          return {
            project_client_id: row.commitment_id,
            client_name: clientName,
            unit: projectClient.unit || 'Sin unidad'
          }
        })

      if (onConfirm) {
        onConfirm(validCommitments)
      }
      onClose()
    }

    // Expose the confirmClients method via ref
    useImperativeHandle(ref, () => ({
      confirmClients: handleConfirm
    }))

    return (
      <div className="space-y-4">
        {/* Commitment Rows - Single column layout */}
        {commitmentRows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Commitment Selector */}
            <div className="flex-1">
              <ComboBox
                value={row.commitment_id}
                onValueChange={(value) => handleCommitmentChange(index, value)}
                options={commitmentOptions}
                placeholder="Seleccionar compromiso..."
                searchPlaceholder="Buscar compromiso..."
                emptyMessage={isLoading ? "Cargando..." : "No hay compromisos disponibles"}
                disabled={isLoading}
              />
            </div>
            
            {/* Remove Button */}
            {commitmentRows.length > 1 && (
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
        ))}
        

      </div>
    )
  }
)

ClientsForm.displayName = 'ClientsForm'