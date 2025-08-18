import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'

export interface ClientRow {
  client_id: string
  amount: string
}

export interface ClientItem {
  project_client_id: string
  client_name: string
  amount: number
}

export interface ClientsFormHandle {
  confirmClients: () => void
}

interface ClientsFormProps {
  onClose: () => void
  onConfirm: (clients: ClientItem[]) => void
  initialClients?: ClientItem[]
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

    // Initialize rows from initial clients or create one empty row
    const initializeRows = (): ClientRow[] => {
      if (initialClients.length > 0) {
        return initialClients.map(client => ({
          client_id: client.project_client_id,
          amount: client.amount.toString()
        }))
      }
      return [{ client_id: '', amount: '' }]
    }

    const [clientRows, setClientRows] = useState<ClientRow[]>(initializeRows())

    // Function to get client display name
    const getClientDisplayName = (projectClient: any): string => {
      if (!projectClient?.contact) return 'Cliente sin nombre'
      
      const { contact } = projectClient
      if (contact.company_name) {
        return contact.company_name
      } else if (contact.full_name) {
        return contact.full_name
      } else {
        return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente sin nombre'
      }
    }

    // Create options for ComboBox
    const clientOptions = projectClients.map(client => ({
      value: client.id,
      label: getClientDisplayName(client)
    }))

    // Handle client change
    const handleClientChange = (index: number, clientId: string) => {
      const newRows = [...clientRows]
      newRows[index] = { ...newRows[index], client_id: clientId }
      setClientRows(newRows)
    }

    // Handle amount change
    const handleAmountChange = (index: number, amount: string) => {
      const newRows = [...clientRows]
      newRows[index] = { ...newRows[index], amount }
      setClientRows(newRows)
    }

    // Add new row
    const addNewRow = () => {
      setClientRows([...clientRows, { client_id: '', amount: '' }])
    }

    // Remove row
    const removeRow = (index: number) => {
      if (clientRows.length > 1) {
        const newRows = clientRows.filter((_, i) => i !== index)
        setClientRows(newRows)
      }
    }

    // Handle confirm
    const handleConfirm = () => {
      const validClients = clientRows
        .filter(row => row.client_id && row.amount && parseFloat(row.amount) > 0)
        .map(row => {
          const projectClient = projectClients.find(pc => pc.id === row.client_id)
          return {
            project_client_id: row.client_id,
            client_name: projectClient ? getClientDisplayName(projectClient) : 'Cliente desconocido',
            amount: parseFloat(row.amount)
          }
        })

      if (onConfirm) {
        onConfirm(validClients)
      }
      onClose()
    }

    // Expose the confirmClients method via ref
    useImperativeHandle(ref, () => ({
      confirmClients: handleConfirm
    }))

    return (
      <div className="space-y-4">
        {/* Client Rows - Default two columns */}
        {clientRows.map((row, index) => (
          <div key={index} className="grid grid-cols-[3fr,1fr] gap-3 items-end">
            {/* Left Column - Client Selector */}
            <div>
              <ComboBox
                value={row.client_id}
                onValueChange={(value) => handleClientChange(index, value)}
                options={clientOptions}
                placeholder="Seleccionar cliente..."
                searchPlaceholder="Buscar cliente..."
                emptyMessage={isLoading ? "Cargando..." : "No hay clientes disponibles"}
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
              {clientRows.length > 1 && (
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
)

ClientsForm.displayName = 'ClientsForm'