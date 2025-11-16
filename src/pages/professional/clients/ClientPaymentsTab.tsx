import React from 'react';
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Plus, Edit } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { format } from 'date-fns'

interface ClientPaymentsTabProps {
  projectId?: string;
}

interface ClientPayment {
  id: string;
  project_id: string;
  commitment_id: string | null;
  schedule_id: string | null;
  contact_id: string;
  organization_id: string;
  client_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  project_client: {
    id: string;
    unit: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
    id: string;
    name: string | null;
  } | null;
  commitment: {
    id: string;
    amount: number;
  } | null;
  schedule: {
    id: string;
    due_date: string;
    amount: number;
  } | null;
}

export default function ClientPaymentsTab({ projectId }: ClientPaymentsTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Query to get client payments for the project
  const { data: paymentsResponse, isLoading } = useQuery<{ data: ClientPayment[] }>({
    queryKey: [`/api/projects/${activeProjectId}/client-payments?organization_id=${organizationId}`],
    enabled: !!activeProjectId && !!organizationId
  });

  const clientPayments = paymentsResponse?.data || [];

  const handleEdit = (payment: ClientPayment) => {
    openModal('installment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleAddPayment = () => {
    openModal('installment', {
      projectId: activeProjectId,
      organizationId: organizationId,
    });
  };

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    )
  }

  // Format date helper
  const formatDate = (dateString: string, formatString: string) => {
    try {
      return format(new Date(dateString), formatString);
    } catch {
      return '-';
    }
  };

  // Format amount with currency
  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Table columns in EXACT ORDER specified
  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      render: (payment: ClientPayment) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    {
      key: 'created_at',
      label: 'Fecha de Registro',
      sortable: true,
      render: (payment: ClientPayment) => formatDate(payment.created_at, 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'contact',
      label: 'Cliente',
      sortable: true,
      render: (payment: ClientPayment) => {
        const avatarUrl = payment.contact?.linked_user?.avatar_url;
        const initials = payment.contact?.first_name?.[0] && payment.contact?.last_name?.[0]
          ? `${payment.contact.first_name[0]}${payment.contact.last_name[0]}`
          : payment.contact?.first_name?.[0] || '?';
        
        const displayName = payment.contact?.company_name || 
                           payment.contact?.full_name || 
                           `${payment.contact?.first_name || ''} ${payment.contact?.last_name || ''}`.trim();
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span>{displayName || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'unit',
      label: 'Unidad Funcional',
      sortable: true,
      render: (payment: ClientPayment) => payment.project_client?.unit || '-',
    },
    {
      key: 'currency',
      label: 'Moneda',
      sortable: true,
      render: (payment: ClientPayment) => payment.currency?.code || '-',
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      render: (payment: ClientPayment) => payment.wallet?.name || '-',
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: true,
      render: (payment: ClientPayment) => (
        <div className="max-w-xs truncate" title={payment.notes || ''}>
          {payment.notes || '-'}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Referencia',
      sortable: true,
      render: (payment: ClientPayment) => payment.reference || '-',
    },
    {
      key: 'commitment_id',
      label: 'Compromiso',
      sortable: true,
      render: (payment: ClientPayment) => {
        if (!payment.commitment) return '-';
        return (
          <span className="text-xs text-muted-foreground">
            {formatAmount(payment.commitment.amount, payment.currency?.symbol)}
          </span>
        );
      },
    },
    {
      key: 'schedule_id',
      label: 'Cuota',
      sortable: true,
      render: (payment: ClientPayment) => {
        if (!payment.schedule) return '-';
        return (
          <span className="text-xs text-muted-foreground">
            Vcto: {formatDate(payment.schedule.due_date, 'dd/MM/yyyy')}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      cellClassName: 'font-semibold',
      render: (payment: ClientPayment) => formatAmount(payment.amount, payment.currency?.symbol),
    },
  ];

  return (
    <div className="space-y-6">
      {clientPayments.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleAddPayment}
            data-testid="button-add-payment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Pago
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        data={clientPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay pagos registrados',
          description: 'Agrega pagos de clientes para llevar un registro de los ingresos del proyecto.',
          action: (
            <Button
              onClick={handleAddPayment}
              size="sm"
              data-testid="button-add-payment-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pago
            </Button>
          ),
        }}
        rowActions={(payment: ClientPayment) => [
          {
            label: 'Editar Pago',
            icon: Edit,
            onClick: () => handleEdit(payment),
          },
        ]}
      />
    </div>
  )
}
