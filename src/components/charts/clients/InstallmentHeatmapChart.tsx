import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface InstallmentData {
  id: string
  project_id: string
  organization_id: string
  date: string
  number: number
  index: number
  created_at: string
}

interface ClientCommitment {
  id: string
  project_id: string
  client_id: string
  unit: string
  committed_amount: number
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
  amount: number | null
  isPaid: boolean
}

interface InstallmentHeatmapChartProps {
  projectId: string
  organizationId: string
}

export default function InstallmentHeatmapChart({ projectId, organizationId }: InstallmentHeatmapChartProps) {
  const { data: userData } = useCurrentUser()

  // Fetch installments
  const { data: installments, isLoading: installmentsLoading } = useQuery({
    queryKey: ['project-installments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_installments')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('number', { ascending: true })

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      return data as InstallmentData[]
    },
    enabled: !!projectId && !!organizationId
  })

  // Fetch client commitments
  const { data: commitments, isLoading: commitmentsLoading } = useQuery({
    queryKey: ['project-clients-units', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_clients')
        .select('*')
        .eq('project_id', projectId)
        .order('unit', { ascending: true })

      if (error) {
        console.error('Error fetching commitments:', error)
        throw error
      }

      return data as ClientCommitment[]
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

  // Fetch payments data (movements related to client payments)
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['client-payments-with-units', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          movement_clients (
            project_client_id,
            project_clients (
              unit
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .eq('subcategory_id', 'f3b96eda-15d5-4c96-ade7-6f53685115d3') // Subcategoría para Aportes de Terceros

      if (error) {
        console.error('Error fetching payments:', error)
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
  
  // Create rows for each installment
  installments.forEach((installment) => {
    const rowData: HeatmapCellData[] = []
    
    // Create columns for each unit
    commitments.forEach((commitment) => {
      if (!commitment?.unit) return
      
      // Find payments for this functional unit and installment
      const relatedPayments = payments?.filter(payment => 
        payment.movement_clients?.some((mc: any) => 
          mc.project_clients?.unit === commitment.unit
        )
      ) || []
      
      const totalPaid = relatedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      
      rowData.push({
        unitId: commitment.id,
        installmentNumber: installment.number,
        amount: totalPaid > 0 ? totalPaid : null,
        isPaid: totalPaid > 0
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div className="inline-block min-w-full">
            {/* Header row with units */}
            <div className="flex border-b border-border">
              <div className="w-32 p-3 bg-muted/50 font-medium text-sm">
                Cuota
              </div>
              {commitments.map((commitment) => commitment?.unit ? (
                <div
                  key={commitment.id}
                  className="w-32 p-3 bg-muted/50 text-sm text-center border-l border-border"
                >
                  <div className="font-bold text-xs mb-1">
                    {commitment.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getClientDisplayName(commitment)}
                  </div>
                </div>
              ) : null)}
            </div>

            {/* Data rows - each row is an installment */}
            {heatmapData.map((rowData, rowIndex) => {
              const installment = installments[rowIndex]
              if (!installment) return null
              
              return (
                <div key={installment.number} className="flex border-b border-border">
                  <div className="w-32 p-3 text-sm bg-background">
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
                      {installment.index ? installment.index.toFixed(2) : '0.00'}%
                    </div>
                  </div>
                  {rowData.map((cellData, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-32 p-3 text-center text-sm border-l border-border transition-colors ${
                        cellData.isPaid
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'bg-gray-50 dark:bg-gray-800 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cellData.amount ? (
                        <div className="font-medium">
                          ${cellData.amount.toLocaleString()}
                        </div>
                      ) : (
                        <div className="opacity-50">-</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded"></div>
            <span>Cuota pagada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"></div>
            <span>Cuota pendiente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}