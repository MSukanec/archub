import React, { useState, useEffect } from 'react'
import { Building } from 'lucide-react'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useProjectInstallments } from '@/hooks/use-project-installments'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'


export interface CommitmentItem {
  project_client_id: string
  client_name: string
  unit: string
  project_installment_id: string
  installment_display: string
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
    { enabled: !!projectId && !!organizationId }
  )

  const { data: projectInstallments = [], isLoading: installmentsLoading } = useProjectInstallments(
    projectId,
    { enabled: !!projectId && !!organizationId }
  )

  // Fetch payment plan information
  const { data: paymentPlan } = useQuery({
    queryKey: ['project-payment-plan', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return null
      
      const { data, error } = await supabase
        .from('project_payment_plans')
        .select(`
          *,
          payment_plans(
            id,
            name,
            description
          )
        `)
        .eq('project_id', projectId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        return null
      }

      return data
    },
    enabled: !!projectId
  })

  // Single row state for simplified interface
  const [commitmentId, setCommitmentId] = useState(
    selectedClients.length > 0 ? selectedClients[0].project_client_id : ''
  )
  const [installmentId, setInstallmentId] = useState(
    selectedClients.length > 0 ? (selectedClients[0].project_installment_id || '') : ''
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

  // Create options for installments - formatted as "Cuota 01 - 19/08/2025", etc.
  const installmentOptions = projectInstallments
    .sort((a, b) => a.number - b.number)
    .map(installment => {
      const formattedDate = installment.date 
        ? new Date(installment.date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Sin fecha'
      return {
        value: installment.id,
        label: `Cuota ${installment.number.toString().padStart(2, '0')} - ${formattedDate}`
      }
    })

  // Handle commitment change
  const handleCommitmentChange = (value: string) => {
    setCommitmentId(value)
    updateSelectedClients(value, installmentId)
  }

  // Handle installment change
  const handleInstallmentChange = (value: string) => {
    setInstallmentId(value)
    updateSelectedClients(commitmentId, value)
  }

  // Update selectedClients based on current values
  const updateSelectedClients = (currentCommitmentId: string, currentInstallmentId: string) => {
    if (!currentCommitmentId || (!currentInstallmentId && paymentPlan?.payment_plans)) {
      onClientsChange([])
      return
    }

    const projectClient = projectClients.find(pc => pc.id === currentCommitmentId)
    const installment = projectInstallments.find(pi => pi.id === currentInstallmentId)
    
    if (!projectClient?.contact) {
      const validCommitment = {
        project_client_id: currentCommitmentId,
        client_name: 'Cliente desconocido',
        unit: 'Sin unidad',
        project_installment_id: currentInstallmentId || '',
        installment_display: installment ? `Cuota ${installment.number.toString().padStart(2, '0')}` : (currentInstallmentId ? 'Cuota desconocida' : 'Sin cuota')
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
      unit: projectClient.unit || 'Sin unidad',
      project_installment_id: currentInstallmentId || '',
      installment_display: installment ? `Cuota ${installment.number.toString().padStart(2, '0')}` : (currentInstallmentId ? 'Cuota desconocida' : 'Sin cuota')
    }

    onClientsChange([validCommitment])
  }

  // Sync external changes with internal state
  useEffect(() => {
    const expectedCommitmentId = selectedClients.length > 0 ? selectedClients[0].project_client_id : ''
    const expectedInstallmentId = selectedClients.length > 0 ? (selectedClients[0].project_installment_id || '') : ''
    
    if (commitmentId !== expectedCommitmentId || installmentId !== expectedInstallmentId) {
      setCommitmentId(expectedCommitmentId)
      setInstallmentId(expectedInstallmentId)
    }
  }, [selectedClients, commitmentId, installmentId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <Building className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Clientes de Proyecto</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona compromisos y cuotas de clientes
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
      
      {/* Installment Field - Only show if payment plan exists */}
      {paymentPlan?.payment_plans && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Cuota
          </label>
          <ComboBox
            value={installmentId}
            onValueChange={handleInstallmentChange}
            options={installmentOptions}
            placeholder="Seleccionar cuota..."
            searchPlaceholder="Buscar cuota..."
            emptyMessage={installmentsLoading ? "Cargando..." : "No hay cuotas disponibles"}
            disabled={installmentsLoading || !commitmentId}
          />
        </div>
      )}
    </div>
  )
}