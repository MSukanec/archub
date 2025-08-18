import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus } from 'lucide-react'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useCurrentUser } from '@/hooks/use-current-user'

export interface ClientItem {
  project_client_id: string
  client_name: string
  amount: number
}

export interface ClientsFormHandle {
  getSelectedClients: () => ClientItem[]
  setSelectedClients: (clients: ClientItem[]) => void
  getTotalAmount: () => number
  validate: () => boolean
}

interface ClientsFormProps {
  organizationId: string
  projectId: string
  initialClients?: ClientItem[]
}

export const ClientsForm = forwardRef<ClientsFormHandle, ClientsFormProps>(
  ({ organizationId, projectId, initialClients = [] }, ref) => {
    console.log('🏗️ ClientsForm initialized with:', { organizationId, projectId, initialClientsCount: initialClients.length })

    const { data: userData } = useCurrentUser()
    const { data: projectClients = [], isLoading: isLoadingClients } = useProjectClients(
      projectId,
      { enabled: !!projectId && !!organizationId }
    )
    
    const [selectedClients, setSelectedClientsState] = useState<ClientItem[]>(initialClients)
    const [newClientId, setNewClientId] = useState<string>('')
    const [newAmount, setNewAmount] = useState<string>('')

    console.log('📋 ClientsForm state:', {
      selectedClientsCount: selectedClients.length,
      projectClientsCount: projectClients.length,
      newClientId,
      newAmount,
      isLoadingClients
    })

    // Función para obtener el nombre del cliente basado en el contact
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

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      getSelectedClients: () => {
        console.log('🔍 ClientsForm: getSelectedClients called, returning:', selectedClients.length, 'clients')
        return selectedClients
      },
      setSelectedClients: (clients: ClientItem[]) => {
        console.log('📝 ClientsForm: setSelectedClients called with:', clients.length, 'clients')
        setSelectedClientsState(clients)
      },
      getTotalAmount: () => {
        const total = selectedClients.reduce((sum, client) => sum + client.amount, 0)
        console.log('🧮 ClientsForm: getTotalAmount called, returning:', total)
        return total
      },
      validate: () => {
        const isValid = selectedClients.length > 0 && selectedClients.every(client => client.amount > 0)
        console.log('✅ ClientsForm: validate called, result:', isValid)
        return isValid
      }
    }), [selectedClients])

    // Función para agregar un cliente
    const addClient = () => {
      if (!newClientId || !newAmount) {
        console.log('❌ ClientsForm: Cannot add client - missing data')
        return
      }

      const amount = parseFloat(newAmount)
      if (isNaN(amount) || amount <= 0) {
        console.log('❌ ClientsForm: Cannot add client - invalid amount')
        return
      }

      // Verificar que el cliente no esté ya seleccionado
      if (selectedClients.some(client => client.project_client_id === newClientId)) {
        console.log('❌ ClientsForm: Cannot add client - already selected')
        return
      }

      // Encontrar el cliente en la lista
      const projectClient = projectClients.find(pc => pc.id === newClientId)
      if (!projectClient) {
        console.log('❌ ClientsForm: Cannot add client - not found in project clients')
        return
      }

      const clientName = getClientDisplayName(projectClient)

      const newClient: ClientItem = {
        project_client_id: newClientId,
        client_name: clientName,
        amount
      }

      console.log('➕ ClientsForm: Adding client:', newClient)
      
      setSelectedClientsState(prev => [...prev, newClient])
      setNewClientId('')
      setNewAmount('')
    }

    // Función para eliminar un cliente
    const removeClient = (projectClientId: string) => {
      console.log('🗑️ ClientsForm: Removing client:', projectClientId)
      setSelectedClientsState(prev => prev.filter(client => client.project_client_id !== projectClientId))
    }

    // Función para actualizar el monto de un cliente
    const updateClientAmount = (projectClientId: string, newAmount: number) => {
      console.log('💰 ClientsForm: Updating client amount:', projectClientId, newAmount)
      setSelectedClientsState(prev => prev.map(client =>
        client.project_client_id === projectClientId
          ? { ...client, amount: newAmount }
          : client
      ))
    }

    // Obtener clientes disponibles para seleccionar
    const availableClients = projectClients.filter(pc => 
      !selectedClients.some(sc => sc.project_client_id === pc.id)
    )

    console.log('📊 ClientsForm render data:', {
      availableClientsCount: availableClients.length,
      selectedClientsCount: selectedClients.length
    })

    if (isLoadingClients) {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-xs text-gray-600">Cargando clientes...</span>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Clientes seleccionados */}
        {selectedClients.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Clientes Asignados</Label>
            {selectedClients.map((client, index) => (
              <div key={`${client.project_client_id}-${index}`} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {client.client_name}
                  </span>
                </div>
                <Input
                  type="number"
                  value={client.amount}
                  onChange={(e) => updateClientAmount(client.project_client_id, parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 text-xs"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeClient(client.project_client_id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Separador si hay clientes seleccionados */}
        {selectedClients.length > 0 && availableClients.length > 0 && (
          <Separator className="my-4" />
        )}

        {/* Agregar nuevo cliente */}
        {availableClients.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Agregar Cliente</Label>
            <div className="flex flex-col space-y-2">
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="text-xs">{getClientDisplayName(client)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Monto"
                  className="flex-1 h-9 text-xs"
                  min="0"
                  step="0.01"
                />
                <Button
                  type="button"
                  onClick={addClient}
                  disabled={!newClientId || !newAmount}
                  size="sm"
                  className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje si no hay clientes disponibles */}
        {availableClients.length === 0 && selectedClients.length === 0 && (
          <div className="text-center py-4">
            <span className="text-xs text-gray-500">
              No hay clientes disponibles en este proyecto
            </span>
          </div>
        )}

        {/* Total */}
        {selectedClients.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-xs font-bold">
                {selectedClients.reduce((sum, client) => sum + client.amount, 0).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ClientsForm.displayName = 'ClientsForm'