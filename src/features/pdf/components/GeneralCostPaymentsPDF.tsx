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
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  companyInfo: {
    marginLeft: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  documentInfo: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  summarySection: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  tableCellMuted: {
    fontSize: 8,
    color: '#6b7280',
  },
  colDate: { width: '12%'},
  colConcept: { width: '25%'},
  colNotes: { width: '20%'},
  colWallet: { width: '13%'},
  colAmount: { width: '18%', textAlign: 'right'},
  colStatus: { width: '12%'},
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusCancelled: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  statusTextConfirmed: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400e',
  },
  statusTextOverdue: {
    color: '#991b1b',
  },
  statusTextCancelled: {
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
    fontSize: 7,
    color: '#9ca3af',
  },
  footerPage: {
    fontSize: 7,
    color: '#9ca3af',
  },
  noData: {
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    paddingVertical: 20,
  },
});
export interface GeneralCostPaymentItem {
  id: string;
  payment_date: string;
  amount: number;
  exchange_rate?: number | null;
  status: 'confirmed'| 'pending'| 'overdue'| 'cancelled';
  reference?: string | null;
  notes?: string | null;
  currency_symbol?: string;
  currency_code?: string;
  wallet_name?: string | null;
  general_cost_name?: string;
  category_name?: string | null;
  creator_name?: string | null;
}
export interface GeneralCostPaymentsPDFData {
  organization_name?: string;
  organization_logo?: string | null;
  organization_address?: string | null;
  organization_email?: string | null;
  organization_phone?: string | null;
  payments: GeneralCostPaymentItem[];
  total_count: number;
  total_confirmed: number;
  total_confirmed_formatted: string;
  date_range?: string;
  generated_at?: string;
}
interface GeneralCostPaymentsPDFProps {
  data: GeneralCostPaymentsPDFData;
}
export function GeneralCostPaymentsPDF({ data }: GeneralCostPaymentsPDFProps) {
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'dd/MM/yy', { locale: es });
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
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; style: any; textStyle: any }> = {
      confirmed: { label: 'Confirmado', style: styles.statusConfirmed, textStyle: styles.statusTextConfirmed },
      pending: { label: 'Pendiente', style: styles.statusPending, textStyle: styles.statusTextPending },
      overdue: { label: 'Vencido', style: styles.statusOverdue, textStyle: styles.statusTextOverdue },
      cancelled: { label: 'Cancelado', style: styles.statusCancelled, textStyle: styles.statusTextCancelled },
    };
    return configs[status] || configs.pending;
  };
  const generatedDate = data.generated_at || new Date().toISOString();
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {data.organization_logo && (
              <Image src={data.organization_logo} style={styles.logo} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.organization_name || 'Mi Organización'}</Text>
              {data.organization_address && (
                <Text style={styles.companyDetail}>{data.organization_address}</Text>
              )}
              {data.organization_email && (
                <Text style={styles.companyDetail}>{data.organization_email}</Text>
              )}
            </View>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>REPORTE DE GASTOS GENERALES</Text>
            <Text style={styles.documentSubtitle}>
              Generado: {format(new Date(generatedDate), "d 'de'MMMM 'de'yyyy", { locale: es })}
            </Text>
            {data.date_range && (
              <Text style={styles.documentSubtitle}>{data.date_range}</Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL DE PAGOS</Text>
            <Text style={styles.summaryValue}>{data.total_count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PAGOS CONFIRMADOS</Text>
            <Text style={styles.summaryValue}>{data.total_confirmed}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL PAGADO</Text>
            <Text style={styles.summaryValue}>{data.total_confirmed_formatted}</Text>
          </View>
        </View>
        {/* Table */}
        {data.payments.length === 0 ? (
          <Text style={styles.noData}>No hay pagos para mostrar</Text>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Fecha</Text>
              <Text style={[styles.tableHeaderCell, styles.colConcept]}>Gasto General</Text>
              <Text style={[styles.tableHeaderCell, styles.colNotes]}>Notas</Text>
              <Text style={[styles.tableHeaderCell, styles.colWallet]}>Billetera</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>Monto</Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>Estado</Text>
            </View>
            {/* Table Rows */}
            {data.payments.map((payment, index) => {
              const statusConfig = getStatusConfig(payment.status);
              return (
                <View 
                  key={payment.id} 
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {formatDate(payment.payment_date)}
                  </Text>
                  <View style={styles.colConcept}>
                    <Text style={styles.tableCell}>{payment.general_cost_name || '-'}</Text>
                    {payment.category_name && (
                      <Text style={styles.tableCellMuted}>{payment.category_name}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCellMuted, styles.colNotes]}>
                    {payment.notes || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colWallet]}>
                    {payment.wallet_name || '-'}
                  </Text>
                  <View style={styles.colAmount}>
                    <Text style={[styles.tableCell, { textAlign: 'right'}]}>
                      {formatCurrency(payment.amount, payment.currency_symbol)}
                    </Text>
                    {payment.exchange_rate && payment.exchange_rate !== 1 && (
                      <Text style={[styles.tableCellMuted, { textAlign: 'right'}]}>
                        Cot. {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.colStatus}>
                    <View style={[styles.statusBadge, statusConfig.style]}>
                      <Text style={[styles.statusText, statusConfig.textStyle]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento generado por Seencel | {data.payments.length} pagos
          </Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}
