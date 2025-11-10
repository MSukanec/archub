import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface InstallmentData {
  id: string
  project_id: string
  organization_id: string
  date: string
  number: number
  index_reference: number
  created_at: string
}

interface ClientCommitment {
  id: string
  project_id: string
  client_id: string
  unit: string
  committed_amount: number | null
  currency_id: string | null
  exchange_rate: number | null
}

interface ClientInfo {
  id: string
  first_name: string
  last_name: string
  company_name?: string
}

interface HeatmapCellData {
  unitId: string
  installmentNumber: number
  updatedAmount: number // Monto actualizado (violeta)
  installmentValue: number // Valor de Cuota
  payment: number // Pago (actual)
  balance: number // Saldo
  isPaid: boolean
  commitmentCurrency: {
    symbol: string
    exchangeRate: number
  }
}

interface IndexedInstallmentPlanProps {
  projectId: string
  organizationId: string
  onEditInstallment?: (installment: InstallmentData) => void
  onDeleteInstallment?: (installment: InstallmentData) => void
  paymentPlan?: {
    id: string
    installments_count: number
    start_date: string
    frequency: string
    created_at: string
    payment_plans?: {
      id: string
      name: string
      description: string
    }
  } | null
}

export default function IndexedInstallmentPlan({ 
  projectId, 
  organizationId, 
  onEditInstallment, 
  onDeleteInstallment,
  paymentPlan
}: IndexedInstallmentPlanProps) {
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isMobile = useMobile()
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0)

  // Delete payment plan mutation
  const deletePaymentPlanMutation = useMutation({
    mutationFn: async (paymentPlanId: string) => {
      const { error } = await supabase
        .from('project_payment_plans')
        .delete()
        .eq('id', paymentPlanId)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all related queries with more aggressive cache clearing
      queryClient.removeQueries({ queryKey: ['project-payment-plan', projectId] })
      queryClient.removeQueries({ queryKey: ['project-installments', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-payment-plan'] })
      queryClient.invalidateQueries({ queryKey: ['project-installments'] })
      
      // Force a refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['project-payment-plan', projectId] })
      queryClient.refetchQueries({ queryKey: ['project-installments', projectId] })
      
      toast({
        title: "Plan eliminado",
        description: "El plan de pagos ha sido eliminado exitosamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan de pagos. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  })

  // Fetch installments - Force fresh data with specific column selection
  const { data: installments, isLoading: installmentsLoading } = useQuery({
    queryKey: ['project-installments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_installments')
        .select('id, project_id, organization_id, date, number, index_reference, created_at, updated_at')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('number', { ascending: true })

      if (error) {
        throw error
      }

      return data as InstallmentData[]
    },
    enabled: !!projectId && !!organizationId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0  // Don't cache
  })

  // Fetch client commitments with currency info
  const { data: commitments, isLoading: commitmentsLoading } = useQuery({
    queryKey: ['project-clients-units', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          currencies(
            id,
            name,
            symbol
          )
        `)
        .eq('project_id', projectId)
        .order('unit', { ascending: true })

      if (error) {
        throw error
      }

      return data as (ClientCommitment & { currencies?: { id: string; name: string; symbol: string } })[]
    },
    enabled: !!projectId
  })

  // Fetch client information separately
  const { data: clientsInfo, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-info', commitments?.map(c => c.client_id)],
    queryFn: async () => {
      if (!commitments?.length) return []
      
      const clientIds = commitments.map(c => c.client_id)
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company_name')
        .in('id', clientIds)
        .eq('organization_id', organizationId)

      if (error) {
        return []
      }

      return data as ClientInfo[]
    },
    enabled: !!commitments?.length
  })

  // Fetch payments data using the new MOVEMENT_PAYMENTS_VIEW
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['movement-payments-view', projectId, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movement_payments_view')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)

      if (error) {
        throw error
      }

      return data
    },
    enabled: !!projectId && !!organizationId
  })

  const isLoading = installmentsLoading || commitmentsLoading || paymentsLoading || clientsLoading

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando datos del plan de cuotas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!installments?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No hay cuotas definidas
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate heatmap data - rows = installments, columns = units
  const heatmapData: HeatmapCellData[][] = []
  
  // For sequential calculation, we need to store previous balances by unit
  const previousBalancesByUnit: { [unitId: string]: number } = {}
  
  // Create rows for each installment
  installments.forEach((installment) => {
    const rowData: HeatmapCellData[] = []
    
    // Process ALL commitments, regardless of whether they have units or not
    if (commitments?.length) {
      // Create columns for each commitment
      commitments.forEach((commitment) => {
        // Process ALL commitments, not just those with units
        
        // Find payments for this specific client and installment number
        const installmentPayments = payments?.filter(payment => 
          (commitment.unit ? payment.unit === commitment.unit : payment.client_id === commitment.client_id) &&
          payment.installment_number === installment.number
        ) || []
        
        // Convert payments to commitment currency using exchange rates
        const totalPaidInCommitmentCurrency = installmentPayments.reduce((sum, payment) => {
          let convertedAmount = payment.amount || 0
          
          if (payment.currency_id !== commitment.currency_id && payment.exchange_rate) {
            convertedAmount = convertedAmount * (payment.exchange_rate || 1)
          }
          
          return sum + convertedAmount
        }, 0)
        
        // Get commitment currency info
        const commitmentCurrency = commitment.currencies || { symbol: '$' }
        
        // Calculate updated amount (violeta) SECUENCIALMENTE:
        let updatedAmount: number
        
        if (installment.number === 1) {
          // Primera cuota = COMPROMISO TOTAL
          updatedAmount = Math.round(commitment.committed_amount || 0)
        } else {
          // Cuotas siguientes = SALDO AZUL de cuota anterior + porcentaje de aumento
          const previousBalance = previousBalancesByUnit[commitment.id] || 0
          // Usar el index_reference de la cuota como porcentaje de aumento
          const percentageIncrease = installment.index_reference || 0
          updatedAmount = Math.round(previousBalance * (1 + percentageIncrease / 100))
        }
        
        // Calculate installment value = MONTO VIOLETA / CUOTAS RESTANTES
        const totalInstallments = installments?.length || 1
        const remainingInstallments = totalInstallments - installment.number + 1
        const installmentValue = Math.round(updatedAmount / remainingInstallments)
        
        // Calculate balance = MONTO ACTUALIZADO (violeta) - PAGO (verde)
        const balance = updatedAmount - Math.round(totalPaidInCommitmentCurrency)
        
        // Store balance for next installment
        previousBalancesByUnit[commitment.id] = balance
        
        rowData.push({
          unitId: commitment.id,
          installmentNumber: installment.number,
          updatedAmount: updatedAmount,
          installmentValue: installmentValue,
          payment: Math.round(totalPaidInCommitmentCurrency),
          balance: balance,
          isPaid: totalPaidInCommitmentCurrency > 0,
          commitmentCurrency: {
            symbol: commitmentCurrency.symbol || '$',
            exchangeRate: commitment.exchange_rate || 1
          }
        })
      })
    }
    
    heatmapData.push(rowData)
  })

  const maxInstallmentNumber = Math.max(...installments.map(i => i.number))

  const getClientDisplayName = (commitment: ClientCommitment) => {
    const clientInfo = clientsInfo?.find(client => client.id === commitment.client_id)
    if (!clientInfo) return 'Cliente'
    
    if (clientInfo.company_name) {
      return clientInfo.company_name
    }
    return `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim()
  }

  const formatCommittedAmount = (commitment: ClientCommitment & { currencies?: { symbol: string } }) => {
    if (!commitment.committed_amount) return null
    
    const symbol = commitment.currencies?.symbol || '$'
    const amount = commitment.committed_amount
    
    // Format with thousands separator
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    
    return `${symbol}${formatted}`
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header del componente */}
        <div className="mb-6 flex items-start gap-3 pb-4 border-b border-border">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              Plan de Pagos
            </h2>
            <p className="text-sm text-muted-foreground">
              Visualización de cuotas indexadas con estado de pagos por unidad funcional
            </p>
          </div>
          {paymentPlan && (
            <div className="flex-shrink-0 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('pdf-exporter', {
                  blocks: [
                    {
                      type: 'header',
                      enabled: true,
                      data: { title: 'Plan de Pagos' },
                      config: {}
                    },
                    {
                      type: 'paymentPlan',
                      enabled: true,
                      data: { 
                        paymentPlan,
                        installments,
                        commitments,
                        payments,
                        clientsInfo,
                        projectId,
                        organizationId
                      },
                      config: {}
                    }
                  ],
                  filename: `plan-de-pagos-${paymentPlan.payment_plans?.name || 'plan'}-${new Date().toISOString().split('T')[0]}.pdf`
                })}
                className="text-muted-foreground hover:text-foreground"
              >
                <FileText className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('delete-confirmation', {
                  mode: 'dangerous',
                  title: 'Eliminar Plan de Pagos',
                  description: 'Esta acción eliminará permanentemente el plan de pagos y todas sus cuotas asociadas. Esta acción no se puede deshacer.',
                  itemName: paymentPlan.payment_plans?.name || 'Plan de cuotas indexadas',
                  destructiveActionText: 'Eliminar Plan',
                  onConfirm: () => deletePaymentPlanMutation.mutate(paymentPlan.id),
                  isLoading: deletePaymentPlanMutation.isPending
                })}
                className=" text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)]"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Header con información del plan */}
        <div className="mb-4">
          {/* Información del Plan de Pagos */}
          <div className="p-3 bg-muted/10 rounded-lg border">
            {paymentPlan ? (
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-medium">Tipo:</span> {paymentPlan.payment_plans?.name || 'Plan personalizado'}
                </div>
                {paymentPlan.payment_plans?.description && (
                  <div>
                    <span className="font-medium">Descripción:</span> {paymentPlan.payment_plans.description}
                  </div>
                )}
                <div>
                  <span className="font-medium">Cuotas:</span> {paymentPlan.installments_count}
                </div>
                <div>
                  <span className="font-medium">Frecuencia:</span> {
                    paymentPlan.frequency === 'monthly' ? 'Mensual' :
                    paymentPlan.frequency === 'biweekly' ? 'Quincenal' :
                    paymentPlan.frequency === 'weekly' ? 'Semanal' :
                    paymentPlan.frequency === 'quarterly' ? 'Trimestral' :
                    paymentPlan.frequency === 'annual' ? 'Anual' :
                    paymentPlan.frequency.charAt(0).toUpperCase() + paymentPlan.frequency.slice(1)
                  }
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Plan no configurado</div>
            )}
          </div>
        </div>

        {/* Mobile navigation controls */}
        {isMobile && commitments && commitments.length > 1 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/20 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileColumnIndex(Math.max(0, mobileColumnIndex - 1))}
              disabled={mobileColumnIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <div className="text-sm text-center">
              <div className="font-medium">
                {commitments[mobileColumnIndex]?.unit || 'Sin U.F.'}
              </div>
              <div className="text-xs text-muted-foreground">
                {mobileColumnIndex + 1} de {commitments.length}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileColumnIndex(Math.min(commitments.length - 1, mobileColumnIndex + 1))}
              disabled={mobileColumnIndex >= commitments.length - 1}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Fixed left column + scrollable right area */}
        <div className="flex">
          {/* Fixed left column header */}
          <div className="w-32 border-b border-border">
            <div className="p-3 font-medium text-sm">
              Cuota / Unidad
            </div>
          </div>
          
          {/* Scrollable right area header */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: 'max-content' }}>
              {commitments?.length ? (
                isMobile ? (
                  // Mobile: show only current column
                  <div
                    key={commitments[mobileColumnIndex].id}
                    className={`${isMobile ? 'flex-1' : 'w-60'} p-3 bg-muted/50 text-sm text-center border-l border-border`}
                  >
                    <div className="font-bold text-xs mb-1">
                      {commitments[mobileColumnIndex].unit || 'Sin U.F.'}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {getClientDisplayName(commitments[mobileColumnIndex])}
                    </div>
                    {formatCommittedAmount(commitments[mobileColumnIndex]) && (
                      <div className="text-xs font-medium text-foreground">
                        {formatCommittedAmount(commitments[mobileColumnIndex])}
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop: show all columns with wider width
                  commitments.map((commitment) => (
                    <div
                      key={commitment.id}
                      className="w-60 p-3 bg-muted/50 text-sm text-center border-l border-border"
                    >
                      <div className="font-bold text-xs mb-1">
                        {commitment.unit || 'Sin U.F.'}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {getClientDisplayName(commitment)}
                      </div>
                      {formatCommittedAmount(commitment) && (
                        <div className="text-xs font-medium text-foreground">
                          {formatCommittedAmount(commitment)}
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                <div className={`${isMobile ? 'flex-1' : 'w-60'} p-3 bg-muted/50 text-sm text-center border-l border-border`}>
                  <div className="text-xs text-muted-foreground">
                    No hay compromisos registrados
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data rows - each row is an installment */}
        {heatmapData.map((rowData, rowIndex) => {
          const installment = installments[rowIndex]
          if (!installment) return null
          
          return (
            <div key={installment.number} className="flex border-b border-border">
              {/* Fixed left column - installment info */}
              <div className="group w-32 p-3 text-sm transition-colors relative">
                <div className="font-bold mb-1">
                  Cuota {installment.number.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(installment.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {installment.index_reference !== undefined && installment.index_reference !== null ? installment.index_reference.toFixed(2) : '0.00'}%
                </div>
                
                {/* Action Buttons */}
                {onEditInstallment && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background border border-border rounded-md px-1 py-1 flex items-center gap-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditInstallment(installment);
                        }}
                        className=" hover:bg-[var(--button-ghost-hover-bg)]"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Scrollable right area - unit data */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex" style={{ minWidth: 'max-content' }}>
                  {rowData.length > 0 ? (
                    isMobile ? (
                      // Mobile: show only current column data
                      rowData[mobileColumnIndex] && (
                        <div
                          key={`${rowIndex}-${mobileColumnIndex}`}
                          className="flex-1 p-3 text-xs border-l border-border"
                        >
                          <div className="space-y-1">
                            {/* Actualización - Violeta */}
                            <div className="flex justify-between items-center">
                              <span className="text-foreground font-medium">Actualización:</span>
                              <span className="text-foreground font-medium text-right">
                                {rowData[mobileColumnIndex].commitmentCurrency.symbol}{rowData[mobileColumnIndex].updatedAmount.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Valor de Cuota - Rojo */}
                            <div className="flex justify-between items-center">
                              <span className="text-red-600 dark:text-red-400">Valor de Cuota:</span>
                              <span className="text-red-600 dark:text-red-400 text-right">
                                {rowData[mobileColumnIndex].commitmentCurrency.symbol}{rowData[mobileColumnIndex].installmentValue.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Pago - Verde */}
                            <div className="flex justify-between items-center">
                              <span className="text-green-600 dark:text-green-400">Pago:</span>
                              <span className="text-green-600 dark:text-green-400 text-right">
                                {rowData[mobileColumnIndex].commitmentCurrency.symbol}{rowData[mobileColumnIndex].payment.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Saldo - Azul */}
                            <div className="flex justify-between items-center">
                              <span className="text-foreground">Saldo:</span>
                              <span className="text-foreground text-right">
                                {rowData[mobileColumnIndex].commitmentCurrency.symbol}{rowData[mobileColumnIndex].balance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      // Desktop: show all columns with wider width
                      rowData.map((cellData, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-60 p-3 text-xs border-l border-border"
                        >
                          <div className="space-y-1">
                            {/* Actualización - Violeta */}
                            <div className="flex justify-between items-center">
                              <span className="text-foreground font-medium">Actualización:</span>
                              <span className="text-foreground font-medium text-right">
                                {cellData.commitmentCurrency.symbol}{cellData.updatedAmount.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Valor de Cuota - Rojo */}
                            <div className="flex justify-between items-center">
                              <span className="text-red-600 dark:text-red-400">Valor de Cuota:</span>
                              <span className="text-red-600 dark:text-red-400 text-right">
                                {cellData.commitmentCurrency.symbol}{cellData.installmentValue.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Pago - Verde */}
                            <div className="flex justify-between items-center">
                              <span className="text-green-600 dark:text-green-400">Pago:</span>
                              <span className="text-green-600 dark:text-green-400 text-right">
                                {cellData.commitmentCurrency.symbol}{cellData.payment.toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Saldo - Azul */}
                            <div className="flex justify-between items-center">
                              <span className="text-foreground">Saldo:</span>
                              <span className="text-foreground text-right">
                                {cellData.commitmentCurrency.symbol}{cellData.balance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    <div className={`${isMobile ? 'flex-1' : 'w-60'} p-3 text-xs border-l border-border`}>
                      <div className="text-center text-muted-foreground">
                        Sin datos
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}


      </CardContent>
    </Card>
  )
}