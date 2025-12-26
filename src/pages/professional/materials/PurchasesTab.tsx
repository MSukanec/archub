import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, CheckCircle2, Clock, DollarSign, Paperclip } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';
import { Table, Column } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components';
import {
  useMaterialPurchases,
  useDeleteMaterialPurchase,
  type MaterialPurchase,
  getMaterialPurchaseStatusBadgeConfig,
  DOCUMENT_TYPES,
} from '@/features/materials/hooks/use-material-purchases';

interface PurchasesTabProps {
  projectId?: string;
  organizationId?: string;
}

interface PurchaseMetrics {
  total_count: number;
  count_pending: number;
  count_partially_paid: number;
  count_paid: number;
  count_cancelled: number;
  total_amount: number;
  total_pending_amount: number;
}

export default function PurchasesTab({ projectId, organizationId: propOrganizationId }: PurchasesTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  const { toast } = useToast();
  
  const organizationId = propOrganizationId || userData?.organization?.id;
  const activeProjectId = projectId || selectedProjectId;
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');

  const [selectedPurchases, setSelectedPurchases] = useState<MaterialPurchase[]>([]);

  const { data: purchasesData, isLoading } = useMaterialPurchases(activeProjectId || undefined, organizationId);

  const allPurchases = useMemo(() => {
    if (!purchasesData) return [];
    return purchasesData;
  }, [purchasesData]);

  const metricsData = useMemo<PurchaseMetrics>(() => {
    let countPending = 0;
    let countPartiallyPaid = 0;
    let countPaid = 0;
    let countCancelled = 0;
    let totalAmount = 0;
    let totalPendingAmount = 0;

    allPurchases.forEach(purchase => {
      const amount = Number(purchase.total_amount) || 0;
      
      if (purchase.status === 'pending') {
        countPending++;
        totalPendingAmount += amount;
      } else if (purchase.status === 'partially_paid') {
        countPartiallyPaid++;
        totalPendingAmount += amount * 0.5;
      } else if (purchase.status === 'paid') {
        countPaid++;
      } else if (purchase.status === 'cancelled') {
        countCancelled++;
      }

      if (purchase.status !== 'cancelled') {
        totalAmount += amount;
      }
    });

    return {
      total_count: allPurchases.length,
      count_pending: countPending,
      count_partially_paid: countPartiallyPaid,
      count_paid: countPaid,
      count_cancelled: countCancelled,
      total_amount: totalAmount,
      total_pending_amount: totalPendingAmount,
    };
  }, [allPurchases]);

  const filterOptions = useMemo(() => {
    const providers = new Set<string>();

    allPurchases.forEach(purchase => {
      const providerName = purchase.provider?.company_name || purchase.provider?.full_name || [purchase.provider?.first_name, purchase.provider?.last_name].filter(Boolean).join(' ');
      if (providerName) providers.add(providerName);
    });

    return {
      providers: Array.from(providers).sort(),
    };
  }, [allPurchases]);

  const filteredPurchases = useMemo(() => {
    return allPurchases.filter(purchase => {
      if (filterStatus !== 'all' && purchase.status !== filterStatus) return false;
      if (filterDocType !== 'all' && purchase.document_type !== filterDocType) return false;
      if (filterProvider !== 'all') {
        const providerName = purchase.provider?.company_name || purchase.provider?.full_name || [purchase.provider?.first_name, purchase.provider?.last_name].filter(Boolean).join(' ');
        if (providerName !== filterProvider) return false;
      }
      
      return true;
    });
  }, [allPurchases, filterStatus, filterProvider, filterDocType]);

  const deletePurchaseMutation = useDeleteMaterialPurchase();

  const handleEdit = (purchase: MaterialPurchase) => {
    openModal('material-purchase', {
      projectId: activeProjectId,
      organizationId: organizationId,
      purchaseId: purchase.id,
      mode: 'edit',
    });
  };

  const formatDate = (dateString: string | null, formatString: string = 'dd/MM/yyyy') => {
    if (!dateString) return '-';
    try {
      const date = parseLocalDate(dateString);
      return date ? format(date, formatString) : '-';
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number, currency?: { symbol: string } | null) => {
    const symbol = currency?.symbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDeletePurchase = (purchase: MaterialPurchase) => {
    if (!organizationId || !activeProjectId) return;

    const purchaseDate = formatDate(purchase.purchase_date, 'dd/MM/yyyy');
    const purchaseLabel = `Compra del ${purchaseDate}${purchase.invoice_number ? ` (#${purchase.invoice_number})` : ''}`;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: "Eliminar compra",
      description: `¿Estás seguro de que querés eliminar esta compra de materiales? Esta acción no se puede deshacer.`,
      itemName: purchaseLabel,
      destructiveActionText: "Eliminar compra",
      onDelete: () => deletePurchaseMutation.mutate({
        purchaseId: purchase.id,
        organizationId,
        projectId: activeProjectId,
      }),
      isLoading: deletePurchaseMutation.isPending
    });
  };

  const handleAddPurchase = () => {
    openModal('material-purchase', {
      projectId: activeProjectId,
      organizationId: organizationId,
      mode: 'create'
    });
  };

  const handleBulkDelete = () => {
    if (!organizationId || !activeProjectId || selectedPurchases.length === 0) return;

    const count = selectedPurchases.length;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${count} ${count === 1 ? 'compra' : 'compras'}`,
      description: `¿Estás seguro de que querés eliminar ${count === 1 ? 'esta compra' : `estas ${count} compras`}? Esta acción no se puede deshacer.`,
      itemName: `${count} ${count === 1 ? 'compra seleccionada' : 'compras seleccionadas'}`,
      destructiveActionText: `Eliminar ${count === 1 ? 'compra' : 'compras'}`,
      onDelete: async () => {
        let successCount = 0;
        let failCount = 0;
        
        for (const purchase of selectedPurchases) {
          try {
            await deletePurchaseMutation.mutateAsync({
              purchaseId: purchase.id,
              organizationId,
              projectId: activeProjectId,
            });
            successCount++;
          } catch (error) {
            console.error('Error deleting purchase:', error);
            failCount++;
          }
        }
        
        setSelectedPurchases([]);
        
        if (failCount > 0) {
          toast({
            title: 'Eliminación parcial',
            description: `Se eliminaron ${successCount} de ${count} compras. ${failCount} fallaron.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Compras eliminadas',
            description: `Se eliminaron ${successCount} compras correctamente.`,
          });
        }
      },
      isLoading: deletePurchaseMutation.isPending
    });
  };

  const columns: Column<MaterialPurchase>[] = [
    {
      key: 'purchase_date',
      label: 'Fecha',
      type: 'date',
      sortable: true,
      sortType: 'date',
      render: (purchase: MaterialPurchase) => formatDate(purchase.purchase_date, 'dd/MM/yyyy'),
    },
    {
      key: 'provider',
      label: 'Proveedor',
      type: 'long-text',
      sortable: true,
      render: (purchase: MaterialPurchase) => {
        if (!purchase.provider) return <span className="text-muted-foreground">Sin proveedor</span>;
        const p = purchase.provider as any;
        return p.company_name || p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '-';
      },
    },
    {
      key: 'document_type',
      label: 'Documento',
      type: 'medium-text',
      sortable: true,
      render: (purchase: MaterialPurchase) => {
        const docType = DOCUMENT_TYPES[purchase.document_type as keyof typeof DOCUMENT_TYPES];
        return (
          <span className="text-sm">
            {docType?.label || 'Factura'}
            {purchase.invoice_number && (
              <span className="text-muted-foreground ml-1">#{purchase.invoice_number}</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'total_amount',
      label: 'Total',
      type: 'amount',
      sortable: true,
      sortType: 'number',
      align: 'right',
      render: (purchase: MaterialPurchase) => {
        return (
          <span className="font-medium">
            {formatCurrency(Number(purchase.total_amount) || 0, purchase.currency)}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      sortable: true,
      render: (purchase: MaterialPurchase) => {
        const statusInfo = getMaterialPurchaseStatusBadgeConfig(purchase.status);
        return (
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
  ];

  const isFilterActive = 
    filterStatus !== 'all' || 
    filterProvider !== 'all' ||
    filterDocType !== 'all';

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterProvider('all');
    setFilterDocType('all');
  };

  const handleViewPurchase = (purchase: MaterialPurchase) => {
    openModal('material-purchase', {
      projectId: activeProjectId,
      organizationId: organizationId,
      purchaseId: purchase.id,
      mode: 'view',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard className="col-span-2" data-testid="stat-card-total-purchases">
          <StatCardTitle showArrow={false}>
            <ShoppingCart className="w-4 h-4 inline mr-1" />
            Total Compras
          </StatCardTitle>
          <StatCardValue>
            {metricsData.total_count}
          </StatCardValue>
          <StatCardMeta>
            {formatCurrency(metricsData.total_amount)} en compras activas
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-pending">
          <StatCardTitle showArrow={false}>
            <Clock className="w-4 h-4 inline mr-1" />
            Pendientes
          </StatCardTitle>
          <StatCardValue>
            {metricsData.count_pending + metricsData.count_partially_paid}
          </StatCardValue>
          <StatCardMeta>
            {metricsData.count_pending} pendientes, {metricsData.count_partially_paid} parciales
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-paid">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Pagadas
          </StatCardTitle>
          <StatCardValue>
            {metricsData.count_paid}
          </StatCardValue>
          <StatCardMeta>
            {metricsData.count_cancelled} canceladas
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={filteredPurchases}
        isLoading={isLoading}
        showDoubleHeader={false}
        selectable={true}
        selectedItems={selectedPurchases}
        onSelectionChange={setSelectedPurchases}
        getItemId={(purchase) => purchase.id}
        emptyStateConfig={{
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay compras registradas',
          description: 'Registra tus compras de materiales para llevar un control detallado.',
          action: (
            <Button
              onClick={handleAddPurchase}
              size="sm"
              data-testid="button-add-purchase-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
            </Button>
          ),
        }}
        topBar={{
          showFilter: true,
          isFilterActive,
          onClearFilters: handleClearFilters,
          bulkActions: {
            onDelete: handleBulkDelete,
          },
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Tipo de Documento</Label>
                <Select value={filterDocType} onValueChange={setFilterDocType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="invoice">Factura</SelectItem>
                    <SelectItem value="receipt">Recibo</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterOptions.providers.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Proveedor</Label>
                  <Select value={filterProvider} onValueChange={setFilterProvider}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proveedores</SelectItem>
                      {filterOptions.providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ),
        }}
        leadingRowAction={(purchase: MaterialPurchase) => 
          purchase.attachments && purchase.attachments.length > 0 ? {
            label: 'Ver Adjunto',
            icon: Paperclip,
            onClick: () => window.open(purchase.attachments![0].file_url, '_blank'),
          } : null
        }
        rowActions={(purchase) => [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => handleEdit(purchase),
            testId: `edit-purchase-${purchase.id}`,
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDeletePurchase(purchase),
            variant: 'destructive',
            testId: `delete-purchase-${purchase.id}`,
          },
        ]}
        onRowClick={handleViewPurchase}
      />
    </div>
  );
}
