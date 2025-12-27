import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useCurrentUser } from '@/features/users/hooks';
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
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { useToast } from '@/hooks/use-toast';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components';
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  type PurchaseOrder,
  getPurchaseOrderStatusBadgeConfig,
} from '@/features/materials/hooks/use-purchase-orders';

interface PurchaseOrdersTabProps {
  projectId?: string;
  organizationId?: string;
}

interface OrderMetrics {
  total_count: number;
  count_draft: number;
  count_sent: number;
  count_quoted: number;
  count_approved: number;
  count_rejected: number;
  count_converted: number;
  latest_order_date: string | null;
  total_items: number;
}

export default function PurchaseOrdersTab({ projectId, organizationId: propOrganizationId }: PurchaseOrdersTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  const { toast } = useToast();
  
  const organizationId = propOrganizationId || userData?.organization?.id;
  const activeProjectId = projectId || selectedProjectId;
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  const [selectedOrders, setSelectedOrders] = useState<PurchaseOrder[]>([]);

  const { data: ordersData, isLoading } = usePurchaseOrders(activeProjectId || undefined, organizationId);

  const allOrders = useMemo(() => {
    if (!ordersData) return [];
    return ordersData;
  }, [ordersData]);

  const metricsData = useMemo<OrderMetrics>(() => {
    let countDraft = 0;
    let countSent = 0;
    let countQuoted = 0;
    let countApproved = 0;
    let countRejected = 0;
    let countConverted = 0;
    let latestOrderDate: string | null = null;
    let totalItems = 0;

    allOrders.forEach(order => {
      if (order.status === 'draft') countDraft++;
      else if (order.status === 'sent') countSent++;
      else if (order.status === 'quoted') countQuoted++;
      else if (order.status === 'approved') countApproved++;
      else if (order.status === 'rejected') countRejected++;
      else if (order.status === 'converted') countConverted++;

      if (!latestOrderDate || order.order_date > latestOrderDate) {
        latestOrderDate = order.order_date;
      }

      totalItems += order.items?.length || 0;
    });

    return {
      total_count: allOrders.length,
      count_draft: countDraft,
      count_sent: countSent,
      count_quoted: countQuoted,
      count_approved: countApproved,
      count_rejected: countRejected,
      count_converted: countConverted,
      latest_order_date: latestOrderDate,
      total_items: totalItems,
    };
  }, [allOrders]);

  const filterOptions = useMemo(() => {
    const providers = new Set<string>();

    allOrders.forEach(order => {
      const providerName = order.provider?.company_name || order.provider?.full_name;
      if (providerName) providers.add(providerName);
    });

    return {
      providers: Array.from(providers).sort(),
    };
  }, [allOrders]);

  const purchaseOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterProvider !== 'all') {
        const providerName = order.provider?.company_name || order.provider?.full_name;
        if (providerName !== filterProvider) return false;
      }
      
      return true;
    });
  }, [allOrders, filterStatus, filterProvider]);

  const deleteOrderMutation = useDeletePurchaseOrder();

  const handleEdit = (order: PurchaseOrder) => {
    openModal('purchase-order', {
      projectId: activeProjectId,
      organizationId: organizationId,
      orderId: order.id,
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

  const handleDeleteOrder = (order: PurchaseOrder) => {
    if (!organizationId || !activeProjectId) return;

    const orderDate = formatDate(order.order_date, 'dd/MM/yyyy');
    const itemCount = order.items?.length || 0;
    const orderLabel = `Orden del ${orderDate} (${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'})`;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: "Eliminar orden de compra",
      description: `¿Estás seguro de que querés eliminar esta orden de compra? Esta acción no se puede deshacer.`,
      itemName: orderLabel,
      destructiveActionText: "Eliminar orden",
      onDelete: () => deleteOrderMutation.mutate({
        orderId: order.id,
        organizationId,
        projectId: activeProjectId,
      }),
      isLoading: deleteOrderMutation.isPending
    });
  };

  const handleAddOrder = () => {
    openModal('purchase-order', {
      projectId: activeProjectId,
      organizationId: organizationId,
      mode: 'create'
    });
  };

  const handleBulkDelete = () => {
    if (!organizationId || !activeProjectId || selectedOrders.length === 0) return;

    const count = selectedOrders.length;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${count} ${count === 1 ? 'orden' : 'órdenes'}`,
      description: `¿Estás seguro de que querés eliminar ${count === 1 ? 'esta orden de compra' : `estas ${count} órdenes de compra`}? Esta acción no se puede deshacer.`,
      itemName: `${count} ${count === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}`,
      destructiveActionText: `Eliminar ${count === 1 ? 'orden' : 'órdenes'}`,
      onDelete: async () => {
        let successCount = 0;
        let failCount = 0;
        
        for (const order of selectedOrders) {
          try {
            await deleteOrderMutation.mutateAsync({
              orderId: order.id,
              organizationId,
              projectId: activeProjectId,
            });
            successCount++;
          } catch (error) {
            console.error('Error deleting order:', error);
            failCount++;
          }
        }
        
        setSelectedOrders([]);
        
        if (failCount > 0) {
          toast({
            title: 'Eliminación parcial',
            description: `Se eliminaron ${successCount} de ${count} órdenes. ${failCount} fallaron.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Órdenes eliminadas',
            description: `Se eliminaron ${successCount} órdenes correctamente.`,
          });
        }
      },
      isLoading: deleteOrderMutation.isPending
    });
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'order_date',
      label: 'Fecha',
      type: 'date' as const,
      sortable: true,
      render: (order: PurchaseOrder) => formatDate(order.order_date, 'dd/MM/yyyy'),
    },
    {
      key: 'requester',
      label: 'Solicitante',
      type: 'name' as const,
      sortable: true,
      render: (order: PurchaseOrder) => {
        if (!order.requester?.user) return '-';
        return (
          <IdentityBadge
            name={order.requester.user.full_name}
            avatarUrl={order.requester.user.avatar_url}
            size="sm"
            showName
          />
        );
      },
    },
    {
      key: 'provider',
      label: 'Proveedor',
      type: 'long-text' as const,
      sortable: true,
      render: (order: PurchaseOrder) => {
        if (!order.provider) return <span className="text-muted-foreground">Sin proveedor</span>;
        return order.provider.company_name || order.provider.full_name || '-';
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      type: 'medium-text' as const,
      sortable: false,
      render: (order: PurchaseOrder) => {
        if (!order.notes) return '-';
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {order.notes}
          </span>
        );
      },
    },
    {
      key: 'items_count',
      label: 'Items',
      type: 'badge' as const,
      sortable: true,
      sortType: 'number' as const,
      render: (order: PurchaseOrder) => {
        const count = order.items?.length || 0;
        return (
          <Badge variant="neutral" className="font-medium">
            {count} {count === 1 ? 'ítem' : 'ítems'}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status' as const,
      sortable: true,
      render: (order: PurchaseOrder) => {
        const statusInfo = getPurchaseOrderStatusBadgeConfig(order.status);
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
    filterProvider !== 'all';

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterProvider('all');
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    openModal('purchase-order', {
      projectId: activeProjectId,
      organizationId: organizationId,
      orderId: order.id,
      mode: 'view',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard className="col-span-2" data-testid="stat-card-total-orders">
          <StatCardTitle showArrow={false}>
            <ShoppingCart className="w-4 h-4 inline mr-1" />
            Total Órdenes
          </StatCardTitle>
          <StatCardValue>
            {metricsData.total_count}
          </StatCardValue>
          <StatCardMeta>
            {metricsData.total_items} {metricsData.total_items === 1 ? 'ítem total' : 'ítems totales'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-pending-approval">
          <StatCardTitle showArrow={false}>
            <Clock className="w-4 h-4 inline mr-1" />
            Pendientes
          </StatCardTitle>
          <StatCardValue>
            {metricsData.count_draft + metricsData.count_sent + metricsData.count_quoted}
          </StatCardValue>
          <StatCardMeta>
            {metricsData.count_draft} borrador, {metricsData.count_sent} enviadas
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-approved">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Aprobadas
          </StatCardTitle>
          <StatCardValue>
            {metricsData.count_approved + metricsData.count_converted}
          </StatCardValue>
          <StatCardMeta>
            {metricsData.count_converted} convertidas a compra
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={purchaseOrders}
        isLoading={isLoading}
        showDoubleHeader={false}
        selectable={true}
        selectedItems={selectedOrders}
        onSelectionChange={setSelectedOrders}
        getItemId={(order) => order.id}
        emptyStateConfig={{
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay órdenes de compra',
          description: 'Crea una orden de compra para solicitar materiales a tus proveedores.',
          action: (
            <Button
              onClick={handleAddOrder}
              size="sm"
              data-testid="button-add-order-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
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
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="quoted">Cotizado</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
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
        rowActions={(order) => [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => handleEdit(order),
            testId: `edit-order-${order.id}`,
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDeleteOrder(order),
            variant: 'destructive',
            testId: `delete-order-${order.id}`,
          },
        ]}
        onRowClick={handleViewOrder}
      />
    </div>
  );
}
