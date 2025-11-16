import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query'
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { ClientPaymentRow } from '@/components/ui/data-row'

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
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
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
  projects?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export default function ClientPaymentsTab({ projectId }: ClientPaymentsTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  const { toast } = useToast();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterHasSchedule, setFilterHasSchedule] = useState<string>('all');
  const [filterHasCommitment, setFilterHasCommitment] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Query to get client payments
  // If activeProjectId is null, fetch ALL payments from the organization
  const { data: paymentsResponse, isLoading } = useQuery<{ data: ClientPayment[] }>({
    queryKey: activeProjectId
      ? [`/api/projects/${activeProjectId}/client-payments?organization_id=${organizationId}`]
      : [`/api/organizations/${organizationId}/client-payments`],
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes - data is prefetched and cached
  });

  const allPayments = paymentsResponse?.data || [];

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const clients = new Set<string>();
    const units = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.name) wallets.add(payment.wallet.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.contact) {
        const clientName = payment.contact.company_name || 
                          payment.contact.full_name || 
                          `${payment.contact.first_name || ''} ${payment.contact.last_name || ''}`.trim();
        if (clientName) clients.add(clientName);
      }
      if (payment.project_client?.unit) units.add(payment.project_client.unit);
    });

    return {
      wallets: Array.from(wallets).sort(),
      currencies: Array.from(currencies).sort(),
      clients: Array.from(clients).sort(),
      units: Array.from(units).sort(),
    };
  }, [allPayments]);

  // Apply filters
  const clientPayments = useMemo(() => {
    return allPayments.filter(payment => {
      // Filter by wallet
      if (filterWallet !== 'all' && payment.wallet?.name !== filterWallet) return false;
      
      // Filter by currency
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      
      // Filter by has schedule
      if (filterHasSchedule === 'yes' && !payment.schedule_id) return false;
      if (filterHasSchedule === 'no' && payment.schedule_id) return false;
      
      // Filter by has commitment
      if (filterHasCommitment === 'yes' && !payment.commitment_id) return false;
      if (filterHasCommitment === 'no' && payment.commitment_id) return false;
      
      // Filter by client
      if (filterClient !== 'all') {
        const clientName = payment.contact?.company_name || 
                          payment.contact?.full_name || 
                          `${payment.contact?.first_name || ''} ${payment.contact?.last_name || ''}`.trim();
        if (clientName !== filterClient) return false;
      }
      
      // Filter by unit
      if (filterUnit !== 'all' && payment.project_client?.unit !== filterUnit) return false;
      
      // Filter by status
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterHasSchedule, filterHasCommitment, filterClient, filterUnit, filterStatus]);

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest('DELETE', `/api/projects/${activeProjectId}/client-payments/${paymentId}?organization_id=${organizationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProjectId}/client-payments?organization_id=${organizationId}`] });
      toast({
        title: "Pago eliminado",
        description: "El pago ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el pago",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (payment: ClientPayment) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleDeletePayment = (payment: ClientPayment) => {
    const clientName = payment.contact?.company_name || 
                      payment.contact?.full_name || 
                      `${payment.contact?.first_name || ''} ${payment.contact?.last_name || ''}`.trim();
    const symbol = payment.currency?.symbol || '$';
    const formattedAmount = `${symbol} ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const paymentLabel = `${clientName} - ${formattedAmount}`;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: "Eliminar pago",
      description: `¿Estás seguro de que querés eliminar este pago? Esta acción no se puede deshacer.`,
      itemName: paymentLabel,
      destructiveActionText: "Eliminar pago",
      onDelete: () => deletePaymentMutation.mutate(payment.id),
      isLoading: deletePaymentMutation.isPending
    });
  };

  const handleAddPayment = () => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
    });
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
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

  // Get status badge configuration
  const getStatusBadge = (status: 'confirmed' | 'pending' | 'rejected' | 'void') => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', className: 'bg-green-600 text-white hover:bg-green-600' },
      pending: { label: 'Pendiente', className: 'bg-orange-600 text-white hover:bg-orange-600' },
      rejected: { label: 'Rechazado', className: 'bg-red-600 text-white hover:bg-red-600' },
      void: { label: 'Anulado', className: 'bg-gray-600 text-white hover:bg-gray-600' },
    };
    return statusConfig[status];
  };

  // Table columns
  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPayment) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    // Project column - only shown when viewing organization-wide data
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      render: (payment: ClientPayment) => {
        if (!payment.projects) return '-';
        return (
          <Badge 
            className="font-medium"
            style={{ 
              backgroundColor: payment.projects.color,
              color: 'white'
            }}
          >
            {payment.projects.name}
          </Badge>
        );
      },
    }]),
    {
      key: 'contact',
      label: 'Cliente',
      sortable: true,
      width: '400px',
      render: (payment: ClientPayment) => {
        const avatarUrl = payment.contact?.linked_user?.avatar_url;
        const initials = payment.contact?.first_name?.[0] && payment.contact?.last_name?.[0]
          ? `${payment.contact.first_name[0]}${payment.contact.last_name[0]}`
          : payment.contact?.first_name?.[0] || '?';
        
        const displayName = payment.contact?.company_name || 
                           payment.contact?.full_name || 
                           `${payment.contact?.first_name || ''} ${payment.contact?.last_name || ''}`.trim();
        
        const unit = payment.project_client?.unit;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold">{displayName || '-'}</span>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: true,
      render: (payment: ClientPayment) => (
        <div className="max-w-md truncate" title={payment.notes || ''}>
          {payment.notes || '-'}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Referencia',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPayment) => payment.reference || '-',
    },
    {
      key: 'commitment_id',
      label: 'Compromiso',
      sortable: true,
      align: 'right' as const,
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
      align: 'right' as const,
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
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      align: 'right' as const,
      cellClassName: 'font-bold',
      render: (payment: ClientPayment) => payment.wallet?.name || '-',
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number' as const,
      render: (payment: ClientPayment) => (
        <div className="flex flex-col items-end">
          <span className="font-bold">{formatAmount(payment.amount, payment.currency?.symbol)}</span>
          <span className="text-xs text-muted-foreground" style={{ fontSize: '12px' }}>
            Cot. {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (payment: ClientPayment) => {
        const statusInfo = getStatusBadge(payment.status);
        return (
          <Badge className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'attachments',
      label: (<Paperclip className="h-4 w-4" />) as any,
      sortable: false,
      align: 'center' as const,
      width: '50px',
      render: (payment: ClientPayment) => {
        const attachmentCount = payment.file_url ? 1 : 0;
        return (
          <span className={attachmentCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
            {attachmentCount}
          </span>
        );
      },
    },
  ] as const;

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterHasSchedule !== 'all' || 
    filterHasCommitment !== 'all' || 
    filterClient !== 'all' || 
    filterUnit !== 'all' ||
    filterStatus !== 'all';

  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterHasSchedule('all');
    setFilterHasCommitment('all');
    setFilterClient('all');
    setFilterUnit('all');
    setFilterStatus('all');
  };

  const handleViewPayment = (payment: ClientPayment) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'view',
    });
  };

  return (
    <div className="space-y-6">
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
        topBar={{
          showFilter: true,
          isFilterActive,
          onClearFilters: handleClearFilters,
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Billetera</Label>
                <Select value={filterWallet} onValueChange={setFilterWallet}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las billeteras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las billeteras</SelectItem>
                    {filterOptions.wallets.map((wallet) => (
                      <SelectItem key={wallet} value={wallet}>
                        {wallet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Moneda</Label>
                <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las monedas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las monedas</SelectItem>
                    {filterOptions.currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Cuota</Label>
                <Select value={filterHasSchedule} onValueChange={setFilterHasSchedule}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="yes">Con cuota</SelectItem>
                    <SelectItem value="no">Sin cuota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Compromiso</Label>
                <Select value={filterHasCommitment} onValueChange={setFilterHasCommitment}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Con compromiso</SelectItem>
                    <SelectItem value="no">Sin compromiso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Cliente</Label>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {filterOptions.clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Unidad Funcional</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las unidades</SelectItem>
                    {filterOptions.units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                    <SelectItem value="void">Anulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
        }}
        primaryRowAction={(payment: ClientPayment) => ({
          label: 'Ver',
          onClick: () => handleViewPayment(payment),
        })}
        rowActions={(payment: ClientPayment) => [
          {
            label: 'Editar Pago',
            icon: Edit,
            onClick: () => handleEdit(payment),
          },
          {
            label: 'Eliminar Pago',
            icon: Trash2,
            onClick: () => handleDeletePayment(payment),
            variant: 'destructive' as const,
          },
        ]}
        renderCard={(payment: ClientPayment) => (
          <ClientPaymentRow
            payment={payment}
            onClick={() => handleViewPayment(payment)}
          />
        )}
      />
    </div>
  )
}
