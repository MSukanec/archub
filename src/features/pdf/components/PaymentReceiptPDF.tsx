import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    marginLeft: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentInfo: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  documentNumber: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextConfirmed: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400e',
  },
  statusTextRejected: {
    color: '#991b1b',
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#1f2937',
  },
  amountSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 12,
    color: '#1f2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    alignItems: 'center',
    width: 180,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    width: '100%',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerPage: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

export interface PaymentReceiptData {
  id: string;
  payment_date: string;
  amount: number;
  currency_symbol: string;
  currency_code: string;
  exchange_rate?: number | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  reference?: string | null;
  notes?: string | null;
  wallet_name?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  project_name?: string | null;
  project_code?: string | null;
  organization_name?: string;
  organization_logo?: string | null;
  organization_address?: string | null;
  organization_email?: string | null;
  organization_phone?: string | null;
  commitment_total?: number | null;
  cumulative_paid?: number | null;
  cumulative_percentage?: number | null;
}

interface PaymentReceiptPDFProps {
  data: PaymentReceiptData;
}

export function PaymentReceiptPDF({ data }: PaymentReceiptPDFProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const receiptNumber = data.id.slice(0, 8).toUpperCase();
  
  const statusConfig = {
    confirmed: { label: 'CONFIRMADO', style: styles.statusConfirmed, textStyle: styles.statusTextConfirmed },
    pending: { label: 'PENDIENTE', style: styles.statusPending, textStyle: styles.statusTextPending },
    rejected: { label: 'RECHAZADO', style: styles.statusRejected, textStyle: styles.statusTextRejected },
    void: { label: 'ANULADO', style: styles.statusRejected, textStyle: styles.statusTextRejected },
  };

  const status = statusConfig[data.status] || statusConfig.pending;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {data.organization_logo && (
              <Image src={data.organization_logo} style={styles.logo} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.organization_name || 'Mi Empresa'}</Text>
              {data.organization_address && (
                <Text style={styles.companyDetail}>{data.organization_address}</Text>
              )}
              {data.organization_email && (
                <Text style={styles.companyDetail}>{data.organization_email}</Text>
              )}
              {data.organization_phone && (
                <Text style={styles.companyDetail}>{data.organization_phone}</Text>
              )}
            </View>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>RECIBO DE PAGO</Text>
            <Text style={styles.documentNumber}>N° {receiptNumber}</Text>
            <Text style={styles.documentDate}>Fecha: {formatDate(data.payment_date)}</Text>
            <View style={[styles.statusBadge, status.style]}>
              <Text style={[styles.statusText, status.textStyle]}>{status.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Client Info */}
        {data.client_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoValue}>{data.client_name}</Text>
              </View>
              {data.client_email && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{data.client_email}</Text>
                </View>
              )}
              {data.client_phone && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{data.client_phone}</Text>
                </View>
              )}
              {data.client_address && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Dirección</Text>
                  <Text style={styles.infoValue}>{data.client_address}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Project Info */}
        {data.project_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATOS DEL PROYECTO</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Proyecto</Text>
                <Text style={styles.infoValue}>{data.project_name}</Text>
              </View>
              {data.project_code && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Código</Text>
                  <Text style={styles.infoValue}>{data.project_code}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DEL PAGO</Text>
          <View style={styles.infoGrid}>
            {data.wallet_name && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Medio de Pago</Text>
                <Text style={styles.infoValue}>{data.wallet_name}</Text>
              </View>
            )}
            {data.reference && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Referencia</Text>
                <Text style={styles.infoValue}>{data.reference}</Text>
              </View>
            )}
            {data.exchange_rate && data.exchange_rate !== 1 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tipo de Cambio</Text>
                <Text style={styles.infoValue}>
                  1 {data.currency_code} = {data.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Monto del Pago</Text>
            <Text style={styles.amountValue}>{formatCurrency(data.amount, data.currency_symbol)}</Text>
          </View>
          
          {data.cumulative_paid !== undefined && data.cumulative_paid !== null && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Acumulado</Text>
              <Text style={styles.amountValue}>{formatCurrency(data.cumulative_paid, data.currency_symbol)}</Text>
            </View>
          )}
          
          {data.commitment_total !== undefined && data.commitment_total !== null && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Compromiso Total</Text>
              <Text style={styles.amountValue}>{formatCurrency(data.commitment_total, data.currency_symbol)}</Text>
            </View>
          )}
          
          {data.cumulative_percentage !== undefined && data.cumulative_percentage !== null && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Porcentaje Pagado</Text>
              <Text style={styles.amountValue}>{data.cumulative_percentage.toFixed(1)}%</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL RECIBIDO</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.amount, data.currency_symbol)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Observaciones</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del Emisor</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del Receptor</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado por Seencel | {formatDate(new Date().toISOString())}
          </Text>
          <Text style={styles.footerPage}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
