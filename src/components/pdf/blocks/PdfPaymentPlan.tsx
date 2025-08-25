import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
  currencies?: { symbol: string }
}

interface HeatmapCellData {
  unitId: string
  installmentNumber: number
  updatedAmount: number
  installmentValue: number
  payment: number
  balance: number
  isPaid: boolean
  commitmentCurrency: {
    symbol: string
    exchangeRate: number
  }
}

interface PaymentPlanData {
  paymentPlan: {
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
  }
  installments: InstallmentData[]
  commitments?: ClientCommitment[]
  payments?: any[]
  clientsInfo?: any[]
  projectId: string
  organizationId: string
}

interface PdfPaymentPlanProps {
  data: PaymentPlanData
  config: any
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb'
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
    color: '#6b7280'
  },
  value: {
    fontSize: 10,
    flex: 1,
    color: '#111827'
  },
  table: {
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 6,
    borderTop: '2px solid #374151',
    borderBottom: '2px solid #374151',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    flex: 1,
    color: '#000000',
    textAlign: 'left'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  tableRowEven: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  tableRowOdd: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff'
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#1f2937'
  }
})

export function PdfPaymentPlan({ data, config }: PdfPaymentPlanProps) {
  const { paymentPlan, installments, commitments = [], payments = [], clientsInfo = [] } = data
  const { showPlanInfo = true, showSchedule = true, showDetailTable = true, oneUnitPerPage = true } = config || {}
  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensual'
      case 'biweekly': return 'Quincenal'
      case 'weekly': return 'Semanal'
      case 'quarterly': return 'Trimestral'
      case 'annual': return 'Anual'
      default: return frequency
    }
  }

  const getClientDisplayName = (commitment: ClientCommitment) => {
    const clientInfo = clientsInfo?.find((client: any) => client.id === commitment.client_id)
    if (!clientInfo) return 'Cliente'
    
    if (clientInfo.company_name) {
      return clientInfo.company_name
    }
    return `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim()
  }

  // Calculate heatmap data using the same logic as the component
  const generateHeatmapData = (): HeatmapCellData[][] => {
    const heatmapData: HeatmapCellData[][] = []
    const previousBalancesByUnit: { [unitId: string]: number } = {}
    
    installments.forEach((installment) => {
      const rowData: HeatmapCellData[] = []
      
      if (commitments?.length) {
        commitments.forEach((commitment) => {
          // Find payments for this specific client and installment number
          const installmentPayments = payments?.filter((payment: any) => 
            (commitment.unit ? payment.unit === commitment.unit : payment.client_id === commitment.client_id) &&
            payment.installment_number === installment.number
          ) || []
          
          // Convert payments to commitment currency
          const totalPaidInCommitmentCurrency = installmentPayments.reduce((sum: number, payment: any) => {
            let convertedAmount = payment.amount || 0
            
            if (payment.currency_id !== commitment.currency_id && payment.exchange_rate) {
              convertedAmount = convertedAmount * (payment.exchange_rate || 1)
            }
            
            return sum + convertedAmount
          }, 0)
          
          // Get commitment currency info
          const commitmentCurrency = commitment.currencies || { symbol: '$' }
          
          // Calculate updated amount (violeta)
          let updatedAmount: number
          
          if (installment.number === 1) {
            updatedAmount = Math.round(commitment.committed_amount || 0)
          } else {
            const previousBalance = previousBalancesByUnit[commitment.id] || 0
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

    return heatmapData
  }

  const heatmapData = generateHeatmapData()

  return (
    <View style={styles.container}>
      {/* Información del Plan */}
      {showPlanInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Plan</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>
            {paymentPlan.payment_plans?.name || 'Plan personalizado'}
          </Text>
        </View>
        
        {paymentPlan.payment_plans?.description && (
          <View style={styles.row}>
            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.value}>{paymentPlan.payment_plans.description}</Text>
          </View>
        )}
        
        <View style={styles.row}>
          <Text style={styles.label}>Cuotas:</Text>
          <Text style={styles.value}>{paymentPlan.installments_count}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Frecuencia:</Text>
          <Text style={styles.value}>{getFrequencyLabel(paymentPlan.frequency)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Fecha inicio:</Text>
          <Text style={styles.value}>{formatDate(paymentPlan.start_date)}</Text>
        </View>
      </View>
      )}

      {/* Tabla de Cuotas */}
      {showSchedule && installments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Cronograma de Cuotas</Text>
          
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Nº</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Fecha</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Índice</Text>
            </View>
            
            {/* Filas */}
            {installments.map((installment, index) => (
              <View key={installment.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>
                  {installment.number}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {formatDate(installment.date)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {installment.index_reference?.toFixed(2) || '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

    </View>
  )
}