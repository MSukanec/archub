import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useProjectInstallments } from '@/hooks/use-project-installments'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Calendar, DollarSign } from 'lucide-react'

export interface CommitmentRow {
  commitment_id: string
  installment_id: string
}

export interface CommitmentItem {
  project_client_id: string
  client_name: string
  unit: string
  project_installment_id: string
  installment_display: string
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
              description,
              frequency,
              installment_count
            )
          `)
          .eq('project_id', projectId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null
          }
          console.error('Error fetching payment plan:', error)
          return null
        }

        return data
      },
      enabled: !!projectId
    })

    // Get selected client information for displaying payment status
    const getSelectedClientInfo = (commitmentId: string) => {
      if (!commitmentId) return null
      const client = projectClients.find(pc => pc.id === commitmentId)
      return client
    }

    // Initialize rows from initial commitments or create one empty row
    const initializeRows = (): CommitmentRow[] => {
      if (initialClients.length > 0) {
        return initialClients.map(client => ({
          commitment_id: client.project_client_id,
          installment_id: client.project_installment_id || ''
        }))
      }
      return [{ commitment_id: '', installment_id: '' }]
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

    // Create options for installments - formatted as "Cuota 01", "Cuota 02", etc.
    const installmentOptions = projectInstallments
      .sort((a, b) => a.number - b.number)
      .map(installment => ({
        value: installment.id,
        label: `Cuota ${installment.number.toString().padStart(2, '0')}`
      }))

    // Handle commitment change
    const handleCommitmentChange = (index: number, commitmentId: string) => {
      const newRows = [...commitmentRows]
      newRows[index] = { ...newRows[index], commitment_id: commitmentId }
      setCommitmentRows(newRows)
    }

    // Handle installment change
    const handleInstallmentChange = (index: number, installmentId: string) => {
      const newRows = [...commitmentRows]
      newRows[index] = { ...newRows[index], installment_id: installmentId }
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
        .filter(row => row.commitment_id && row.installment_id)
        .map(row => {
          const projectClient = projectClients.find(pc => pc.id === row.commitment_id)
          const installment = projectInstallments.find(pi => pi.id === row.installment_id)
          
          if (!projectClient?.contact) {
            return {
              project_client_id: row.commitment_id,
              client_name: 'Cliente desconocido',
              unit: 'Sin unidad',
              project_installment_id: row.installment_id,
              installment_display: installment ? `Cuota ${installment.number.toString().padStart(2, '0')}` : 'Cuota desconocida'
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
            unit: projectClient.unit || 'Sin unidad',
            project_installment_id: row.installment_id,
            installment_display: installment ? `Cuota ${installment.number.toString().padStart(2, '0')}` : 'Cuota desconocida'
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
        {/* Payment Plan Information */}
        {paymentPlan?.payment_plans && (
          <Card className="p-4 bg-muted/30 border-muted">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Plan de Pagos: {paymentPlan.payment_plans.name}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {paymentPlan.payment_plans.frequency}
                  </Badge>
                </div>
                {paymentPlan.payment_plans.description && (
                  <p className="text-xs text-muted-foreground">
                    {paymentPlan.payment_plans.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {paymentPlan.payment_plans.installment_count 
                        ? `${paymentPlan.payment_plans.installment_count} cuotas` 
                        : 'Sin límite de cuotas'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Selecciona un cliente y cuota para el pago</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Commitment Rows - Two column layout: commitment and installment */}
        {commitmentRows.map((row, index) => {
          const selectedClient = getSelectedClientInfo(row.commitment_id)
          
          return (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Commitment Selector */}
              <div className="flex-1">
                <ComboBox
                  value={row.commitment_id}
                  onValueChange={(value) => handleCommitmentChange(index, value)}
                  options={commitmentOptions}
                  placeholder="Seleccionar compromiso..."
                  searchPlaceholder="Buscar compromiso..."
                  emptyMessage={clientsLoading ? "Cargando..." : "No hay compromisos disponibles"}
                  disabled={clientsLoading}
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
            
            {/* Installment Selector */}
            <div className="pl-0">
              <ComboBox
                value={row.installment_id}
                onValueChange={(value) => handleInstallmentChange(index, value)}
                options={installmentOptions}
                placeholder="Seleccionar cuota..."
                searchPlaceholder="Buscar cuota..."
                emptyMessage={installmentsLoading ? "Cargando..." : "No hay cuotas disponibles"}
                disabled={installmentsLoading || !row.commitment_id}
              />
            </div>

            {/* Client Payment Information */}
            {selectedClient && (
              <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-800 dark:text-green-200">
                        Compromiso Total: 
                      </span>
                      <span className="text-xs font-bold text-green-900 dark:text-green-100">
                        U$S {selectedClient.committed_amount?.toLocaleString('es-AR') || '0'}
                      </span>
                    </div>
                    {selectedClient.unit && (
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Unidad: {selectedClient.unit}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Activo
                  </Badge>
                </div>
              </Card>
            )}
          </div>
          )
        })}
        

      </div>
    )
  }
)

ClientsForm.displayName = 'ClientsForm'