import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#666',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#2563eb',
  },
  invoiceNumber: {
    fontSize: 10,
    textAlign: 'right',
    color: '#666',
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    width: 120,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 8,
    width: 250,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    width: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  badge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 4,
  },
});

interface InvoicePDFProps {
  payment: {
    id: string;
    provider_payment_id: string | null;
    amount: number | null;
    currency: string;
    created_at: string;
    provider: string;
    payer_email: string | null;
  };
  subscription: {
    billing_period: string;
    plans: {
      name: string;
    };
  } | null;
  organization: {
    name: string;
    logo_url: string | null;
  };
}

export function InvoicePDF({ payment, subscription, organization }: InvoicePDFProps) {
  const invoiceNumber = payment.provider_payment_id?.slice(0, 12) || payment.id.slice(0, 12);
  const invoiceDate = format(new Date(payment.created_at), "d 'de' MMMM 'de' yyyy", { locale: es });
  const planName = subscription?.plans?.name || 'Plan Desconocido';
  const billingPeriod = subscription?.billing_period === 'monthly' ? 'Mensual' : 'Anual';
  const provider = payment.provider === 'paypal' ? 'PayPal' : 'MercadoPago';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Seencel</Text>
            <Text style={styles.companySubtitle}>Plataforma de Gestión de Construcción</Text>
            <Text style={styles.companySubtitle}>www.seencel.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Organización:</Text>
            <Text style={styles.value}>{organization.name}</Text>
          </View>
          {payment.payer_email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{payment.payer_email}</Text>
            </View>
          )}
        </View>

        {/* Invoice Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Factura</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Emisión:</Text>
            <Text style={styles.value}>{invoiceDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Método de Pago:</Text>
            <Text style={styles.value}>{provider}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <View>
              <Text style={styles.badge}>PAGADO</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Cantidad</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Precio</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              Suscripción {planName} - {billingPeriod}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>1</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
              {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
              {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>TOTAL:</Text>
            <Text style={[styles.totalValue, { fontSize: 14, color: '#2563eb' }]}>
              {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gracias por confiar en Seencel</Text>
          <Text>Para consultas, contáctenos en soporte@seencel.com</Text>
        </View>
      </Page>
    </Document>
  );
}
