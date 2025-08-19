import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Edit, Trash2 } from 'lucide-react'

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

interface InstallmentHeatmapChartProps {
  projectId: string
  organizationId: string
  onEditInstallment?: (installment: InstallmentData) => void
  onDeleteInstallment?: (installment: InstallmentData) => void
}

export default function InstallmentHeatmapChart({ 
  projectId, 
  organizationId, 
  onEditInstallment, 
  onDeleteInstallment 
}: InstallmentHeatmapChartProps) {
  const { data: userData } = useCurrentUser()

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
        console.error('Error fetching installments:', error)
        throw error
      }

      console.log('FRESH installments from DB:', data)
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
        console.error('Error fetching commitments:', error)
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
        console.error('Error fetching contacts info:', error)
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
        console.error('Error fetching payments from view:', error)
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

  if (!installments?.length || !commitments?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {!installments?.length && "No hay cuotas definidas"}
            {!commitments?.length && "No hay unidades funcionales registradas"}
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
    
    // Create columns for each unit
    commitments.forEach((commitment) => {
      if (!commitment?.unit) return
      
      // Find payments for this specific functional unit and installment number
      const installmentPayments = payments?.filter(payment => 
        payment.unit === commitment.unit && 
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
        {/* Leyenda de colores inline */}
        <div className="mb-4 p-3 bg-muted/20 rounded-lg border">
          <div className="text-xs font-medium mb-2">Referencias de colores:</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-violet-600 rounded"></div>
              <span>Actualización</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-600 rounded"></div>
              <span>Valor de cuota</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded"></div>
              <span>Pago</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded"></div>
              <span>Saldo</span>
            </div>
          </div>
        </div>

        {/* Fixed left column + scrollable right area */}
        <div className="flex">
          {/* Fixed left column header */}
          <div className="w-32 bg-muted/50 border-b border-border">
            <div className="p-3 font-medium text-sm">
              Cuota / Unidad
            </div>
          </div>
          
          {/* Scrollable right area header */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: 'max-content' }}>
              {commitments.map((commitment) => commitment?.unit ? (
                <div
                  key={commitment.id}
                  className="w-40 p-3 bg-muted/50 text-sm text-center border-l border-border"
                >
                  <div className="font-bold text-xs mb-1">
                    {commitment.unit}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {getClientDisplayName(commitment)}
                  </div>
                  {formatCommittedAmount(commitment) && (
                    <div className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      {formatCommittedAmount(commitment)}
                    </div>
                  )}
                </div>
              ) : null)}
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
              <div className="group w-32 p-3 text-sm transition-colors relative bg-background">
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
                {(onEditInstallment || onDeleteInstallment) && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background border border-border rounded-md px-1 py-1 flex items-center gap-1 shadow-sm">
                      {onEditInstallment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditInstallment(installment);
                          }}
                          className="h-6 w-6 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {onDeleteInstallment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteInstallment(installment);
                          }}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Scrollable right area - unit data */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex" style={{ minWidth: 'max-content' }}>
                  {rowData.map((cellData, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="w-40 p-2 text-xs border-l border-border"
                    >
                      <div className="space-y-1">
                        {/* Actualización - Violeta */}
                        <div className="flex justify-between items-center">
                          <span className="text-violet-600 dark:text-violet-400 font-medium">A:</span>
                          <span className="text-violet-600 dark:text-violet-400 font-medium text-right">
                            {cellData.commitmentCurrency.symbol}{cellData.updatedAmount.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Valor de Cuota - Rojo */}
                        <div className="flex justify-between items-center">
                          <span className="text-red-600 dark:text-red-400">V.C:</span>
                          <span className="text-red-600 dark:text-red-400 text-right">
                            {cellData.commitmentCurrency.symbol}{cellData.installmentValue.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Pago - Verde */}
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 dark:text-green-400">P:</span>
                          <span className="text-green-600 dark:text-green-400 text-right">
                            {cellData.commitmentCurrency.symbol}{cellData.payment.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Saldo - Azul */}
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 dark:text-blue-400">S:</span>
                          <span className="text-blue-600 dark:text-blue-400 text-right">
                            {cellData.commitmentCurrency.symbol}{cellData.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}


      </CardContent>
    </Card>
  )
}