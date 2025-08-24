import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
  installments: any[]
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
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1px solid #d1d5db',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    color: '#374151'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    color: '#6b7280'
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
  const { paymentPlan, installments } = data

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan de Pagos</Text>
      
      {/* Información del Plan */}
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

      {/* Tabla de Cuotas */}
      {installments.length > 0 && (
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