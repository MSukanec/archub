import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Calendar, FileText } from 'lucide-react';

interface ClientPaymentsListTabProps {
  projectId?: string;
}

interface ClientPayment {
  id: string;
  project_id: string;
  contact_id: string;
  client_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
}

interface PaymentsResponse {
  payments: ClientPayment[];
  total: number;
}

export default function ClientPaymentsListTab({ projectId }: ClientPaymentsListTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();

  const organizationId = userData?.organization?.id;
  const activeProjectId = projectId || selectedProjectId;

  const { data: paymentsResponse, isLoading, error } = useQuery<PaymentsResponse>({
    queryKey: [`/api/projects/${activeProjectId}/clients/payments?organization_id=${organizationId}`],
    enabled: !!activeProjectId && !!organizationId
  });

  const payments = paymentsResponse?.payments || [];
  const total = paymentsResponse?.total || 0;

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Error al cargar pagos</p>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      render: (payment: ClientPayment) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {payment.payment_date
              ? format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: es })
              : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      render: (payment: ClientPayment) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold">
            ${Number(payment.amount).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Referencia',
      sortable: false,
      render: (payment: ClientPayment) => (
        <span className="text-sm">{payment.reference || '-'}</span>
      ),
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: false,
      render: (payment: ClientPayment) => (
        <div className="flex items-center gap-2">
          {payment.notes && <FileText className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {payment.notes || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Registrado',
      sortable: true,
      render: (payment: ClientPayment) => (
        <span className="text-sm text-muted-foreground">
          {payment.created_at
            ? format(new Date(payment.created_at), 'dd MMM yyyy', { locale: es })
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pagos de Clientes</h2>
          <p className="text-muted-foreground">
            {total > 0 ? `${total} pago${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'No hay pagos registrados'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Cargando...
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Cargando pagos...</p>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12">
          <div className="text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay pagos registrados</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Todavía no se han registrado pagos para este proyecto.
            </p>
          </div>
        </div>
      ) : (
        <Table
          data={payments}
          columns={columns}
        />
      )}
    </div>
  );
}
