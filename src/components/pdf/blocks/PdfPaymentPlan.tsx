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
    backgroundColor: '#374151',
    padding: 12,
    borderBottom: '1px solid #374151',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    color: '#ffffff',
    textAlign: 'center'
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
  const { showPlanInfo = true, showSchedule = true, showDetailTable = true } = config || {}
  

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
      <Text style={styles.title}>Plan de Pagos</Text>
      
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

      {/* Tabla Detallada de Cuotas por Unidad */}
      {showDetailTable && heatmapData.length > 0 && commitments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Detalle de Cuotas por Unidad Funcional</Text>
          
          <View style={styles.table}>
            {/* Header con unidades */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>Cuota / Unidad</Text>
              {commitments.map((commitment) => (
                <Text key={commitment.id} style={[styles.tableHeaderCell, { width: 120 }]}>
                  {commitment.unit || getClientDisplayName(commitment)}
                </Text>
              ))}
            </View>
            
            {/* Subheader con nombres/montos */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 80 }]}></Text>
              {commitments.map((commitment) => (
                <View key={`header-${commitment.id}`} style={{ width: 120, padding: 2 }}>
                  <Text style={[styles.tableCell, { fontSize: 8, textAlign: 'center' }]}>
                    {getClientDisplayName(commitment)}
                  </Text>
                  <Text style={[styles.tableCell, { fontSize: 8, textAlign: 'center', fontWeight: 'bold' }]}>
                    {commitment.currencies?.symbol || '$'}{(commitment.committed_amount || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Generar páginas separadas - una por unidad funcional */}
            {commitments.map((commitment, commitmentIndex) => (
              <View key={commitment.id} break={commitmentIndex > 0}>
                
                {/* Header de Unidad Funcional - Optimizado */}
                <View style={{ marginBottom: 20 }}>
                  {/* Línea superior */}
                  <View style={{ borderTopWidth: 2, borderTopColor: '#374151', marginBottom: 15 }} />
                  
                  {/* Header principal */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    {/* Lado izquierdo - Título y detalles */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                        DETALLE DE CUOTAS
                      </Text>
                      
                      {/* Lista de información */}
                      <View style={{ gap: 3 }}>
                        <Text style={{ fontSize: 9, color: '#1f2937' }}>
                          <Text style={{ fontWeight: 'bold' }}>Unidad Funcional:</Text> {commitment.unit || `UF${commitmentIndex + 1}`}
                        </Text>
                        <Text style={{ fontSize: 9, color: '#1f2937' }}>
                          <Text style={{ fontWeight: 'bold' }}>Cliente:</Text> {getClientDisplayName(commitment)}
                        </Text>
                        <Text style={{ fontSize: 9, color: '#1f2937' }}>
                          <Text style={{ fontWeight: 'bold' }}>Monto Inicial de Obra:</Text> {commitment.currencies?.symbol || '$'}{(commitment.committed_amount || 0).toLocaleString()}
                        </Text>
                        {commitment.exchange_rate && commitment.exchange_rate !== 1 && (
                          <Text style={{ fontSize: 9, color: '#1f2937' }}>
                            <Text style={{ fontWeight: 'bold' }}>Cotización de dólar inicial:</Text> ${commitment.exchange_rate}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Lado derecho - Código de unidad GRANDE */}
                    <View style={{ flex: 0, alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#1f2937', letterSpacing: 1 }}>
                        {commitment.unit || `UF${commitmentIndex + 1}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tabla de Cuotas para esta Unidad */}
                <View style={{ marginTop: 10 }}>
                  
                  <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Cuota</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Fecha</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Índice</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Detalle</Text>
                    </View>
                    
                    {/* Filas de cuotas para esta unidad específica */}
                    {heatmapData.map((rowData, rowIndex) => {
                      const installment = installments[rowIndex]
                      const cellData = rowData[commitmentIndex] // Solo los datos de esta unidad
                      if (!installment || !cellData) return null
                      
                      // Alternar colores de fila
                      const rowStyle = rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                      
                      return (
                        <View key={installment.id} style={rowStyle}>
                          {/* Información de la cuota */}
                          <View style={[styles.tableCell, { flex: 0.8 }]}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                              Cuota Nº {installment.number.toString().padStart(2, '0')}
                            </Text>
                          </View>
                          
                          <View style={[styles.tableCell, { flex: 1.2 }]}>
                            <Text style={{ fontSize: 8 }}>
                              {formatDate(installment.date)}
                            </Text>
                          </View>
                          
                          <View style={[styles.tableCell, { flex: 0.8 }]}>
                            <Text style={{ fontSize: 8 }}>
                              {installment.index_reference?.toFixed(2) || '0.00'}%
                            </Text>
                          </View>
                          
                          {/* Detalles financieros */}
                          <View style={[styles.tableCell, { flex: 1.2 }]}>
                            {/* Actualización - Negro */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Text style={{ fontSize: 7, color: '#1f2937' }}>Actualización:</Text>
                              <Text style={{ fontSize: 7, color: '#1f2937', fontWeight: 'bold' }}>
                                {cellData.commitmentCurrency.symbol}{cellData.updatedAmount.toLocaleString()}
                              </Text>
                            </View>
                            
                            {/* Valor de Cuota - Rojo */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Text style={{ fontSize: 7, color: '#dc2626' }}>Valor de Cuota:</Text>
                              <Text style={{ fontSize: 7, color: '#dc2626' }}>
                                {cellData.commitmentCurrency.symbol}{cellData.installmentValue.toLocaleString()}
                              </Text>
                            </View>
                            
                            {/* Pago - Verde */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Text style={{ fontSize: 7, color: '#16a34a' }}>Pago:</Text>
                              <Text style={{ fontSize: 7, color: '#16a34a' }}>
                                {cellData.commitmentCurrency.symbol}{cellData.payment.toLocaleString()}
                              </Text>
                            </View>
                            
                            {/* Saldo - Negro */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 7, color: '#1f2937' }}>Saldo:</Text>
                              <Text style={{ fontSize: 7, color: '#1f2937' }}>
                                {cellData.commitmentCurrency.symbol}{cellData.balance.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
                
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}