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
import { Info, Calendar, DollarSign, Clock } from 'lucide-react'

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
              description
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

    // Get selected client information for displaying payment status
    const getSelectedClientInfo = (commitmentId: string) => {
      if (!commitmentId) return null
      const client = projectClients.find(pc => pc.id === commitmentId)
      return client
    }

    // Fetch payment information for selected clients
    const { data: clientPayments = [] } = useQuery({
      queryKey: ['client-payments', projectId, organizationId, commitmentRows.map(r => r.commitment_id).filter(Boolean)],
      queryFn: async () => {
        if (!supabase || !projectId || !organizationId) return []
        
        const validCommitmentIds = commitmentRows.map(r => r.commitment_id).filter(Boolean)
        if (validCommitmentIds.length === 0) return []
        
        const { data, error } = await supabase
          .from('movement_payments_view')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .in('project_client_id', validCommitmentIds)
          .order('movement_date', { ascending: false })

        if (error) {
          console.error('Error fetching client payments:', error)
          return []
        }

        return data || []
      },
      enabled: !!projectId && !!organizationId && commitmentRows.some(r => r.commitment_id)
    })

    // Calculate payment summary for each client
    const getClientPaymentSummary = (commitmentId: string) => {
      if (!commitmentId) return null
      
      const client = projectClients.find(pc => pc.id === commitmentId)
      const payments = clientPayments.filter(p => p.project_client_id === commitmentId)
      
      const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      const lastPaymentDate = payments.length > 0 ? payments[0].movement_date : null
      const remainingAmount = (client?.committed_amount || 0) - totalPaid
      
      return {
        client,
        totalPaid,
        lastPaymentDate,
        remainingAmount,
        paymentsCount: payments.length
      }
    }

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
          <div className="space-y-3 p-4 bg-muted/30 rounded-md border">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-foreground">
                Plan de Pagos Activo: {paymentPlan.payment_plans.name}
              </h4>
            </div>
            {paymentPlan.payment_plans.description && (
              <p className="text-xs text-muted-foreground pl-6">
                {paymentPlan.payment_plans.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground pl-6">
              Asigna clientes de proyecto y montos para este movimiento financiero.
            </p>
          </div>
        )}

        {/* Commitment Rows - Two column layout: commitment and installment */}
        {commitmentRows.map((row, index) => {
          const paymentSummary = getClientPaymentSummary(row.commitment_id)
          
          return (
          <div key={index} className="space-y-3">
            {/* Field Labels and Inputs */}
            <div className="space-y-3">
              {/* Commitment Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Compromiso
                  </label>
                  {commitmentRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
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
              
              {/* Installment Selector */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Cuota
                </label>
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
            </div>

            {/* Client Payment Summary */}
            {paymentSummary?.client && (
              <div className="space-y-2 text-xs text-muted-foreground pl-4 border-l-2 border-muted">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">Compromiso Total</span>
                    </div>
                    <div className="font-bold text-foreground">
                      U$S {paymentSummary.client.committed_amount?.toLocaleString('es-AR') || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">Pagado a la fecha</span>
                    </div>
                    <div className="font-bold text-green-600">
                      U$S {paymentSummary.totalPaid.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">Saldo pendiente</span>
                    </div>
                    <div className="font-bold text-orange-600">
                      U$S {paymentSummary.remainingAmount.toLocaleString('es-AR')}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Último pago</span>
                    </div>
                    <div className="font-medium">
                      {paymentSummary.lastPaymentDate 
                        ? new Date(paymentSummary.lastPaymentDate).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'Sin pagos'
                      }
                    </div>
                  </div>
                </div>
                {paymentSummary.client.unit && (
                  <div className="pt-1 border-t border-muted">
                    <span className="font-medium">Unidad: </span>
                    <span>{paymentSummary.client.unit}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Separator between rows */}
            {index < commitmentRows.length - 1 && (
              <div className="border-t border-muted mt-4 pt-4"></div>
            )}
          </div>
          )
        })}
        

      </div>
    )
  }
)

ClientsForm.displayName = 'ClientsForm'