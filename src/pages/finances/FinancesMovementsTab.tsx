import { useUnifiedMovements } from '@/features/finances/hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { useDeleteClientPayment } from '@/features/clients/hooks/use-client-payments';
import { useDeleteMaterialPayment } from '@/features/materials/hooks/use-material-payments';
import { useDeletePersonnelPayment } from '@/features/personnel/hooks/use-personnel-payments';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { DollarSign, Edit, Trash2 } from 'lucide-react';
import type { UnifiedMovementWithRelations } from '@/features/finances/services/getUnifiedMovements';

const MOVEMENT_TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string;
  modalType: string;
}> = {
  client_payment: { 
    label: 'Pago Cliente', 
    color: 'bg-green-600',
    modalType: 'client-payment',
  },
  material_payment: { 
    label: 'Pago Material', 
    color: 'bg-orange-600',
    modalType: 'material-payment',
  },
  personnel_payment: { 
    label: 'Pago Personal', 
    color: 'bg-blue-600',
    modalType: 'personnel-payment',
  },
};

export function FinancesMovementsTab() {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const { data: movements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId || undefined,
    selectedProjectId
  );

  const deleteClientPaymentMutation = useDeleteClientPayment();
  const deleteMaterialPaymentMutation = useDeleteMaterialPayment();
  const deletePersonnelPaymentMutation = useDeletePersonnelPayment();

  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))}`;
  };

  const handleEdit = (movement: UnifiedMovementWithRelations) => {
    const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
    if (!config) return;

    openModal(config.modalType, {
      projectId: movement.project_id,
      organizationId: movement.organization_id,
      paymentId: movement.id,
      mode: 'edit',
    });
  };

  const handleDelete = (movement: UnifiedMovementWithRelations) => {
    if (!currentOrganizationId) return;

    const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
    const symbol = movement.currency?.symbol || '$';
    const formattedAmount = formatCurrency(movement.amount, symbol);
    const paymentLabel = `${movement.description} - ${formattedAmount}`;

    const deleteHandler = () => {
      switch (movement.movement_type) {
        case 'client_payment':
          return deleteClientPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
        case 'material_payment':
          return deleteMaterialPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
        case 'personnel_payment':
          return deletePersonnelPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
      }
    };

    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${config?.label || 'movimiento'}`,
      description: '¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.',
      itemName: paymentLabel,
      destructiveActionText: 'Eliminar',
      onDelete: deleteHandler,
      isLoading: deleteClientPaymentMutation.isPending || 
                 deleteMaterialPaymentMutation.isPending || 
                 deletePersonnelPaymentMutation.isPending,
    });
  };

  const columns: Array<{
    key: string;
    label: string;
    render?: (item: UnifiedMovementWithRelations) => React.ReactNode;
    sortable?: boolean;
    sortType?: 'string' | 'number' | 'date';
    width?: string;
    align?: 'left' | 'center' | 'right';
  }> = [
    {
      key: 'payment_date',
      label: 'Fecha',
      sortable: true,
      sortType: 'date',
      width: '14.28%',
      render: (movement) => {
        const date = parseLocalDate(movement.payment_date);
        return date ? format(date, 'dd/MM/yyyy') : '-';
      },
    },
    {
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      width: '14.28%',
      render: (movement) => {
        if (!movement.project) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge 
            className="font-medium whitespace-nowrap"
            style={{ 
              backgroundColor: movement.project.color,
              color: 'white'
            }}
          >
            {movement.project.name}
          </Badge>
        );
      },
    },
    {
      key: 'movement_type',
      label: 'Tipo',
      sortable: true,
      width: '14.28%',
      render: (movement) => {
        const config = MOVEMENT_TYPE_CONFIG[movement.movement_type] || {
          label: movement.movement_type,
          color: 'bg-gray-600'
        };
        return (
          <Badge className={`text-xs ${config.color} text-white border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'description',
      label: 'Detalle',
      sortable: true,
      width: '14.28%',
      render: (movement) => (
        <span 
          className="font-medium block truncate" 
          title={movement.description || '-'}
        >
          {movement.description || '-'}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Moneda',
      sortable: true,
      width: '14.28%',
      render: (movement) => (
        <span className="text-sm">{movement.currency?.code || '-'}</span>
      ),
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      width: '14.28%',
      render: (movement) => (
        <span className="text-sm">{movement.wallet?.name || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number',
      width: '14.28%',
      align: 'right',
      render: (movement) => {
        const isPositive = movement.signed_amount >= 0;
        return (
          <div className="flex flex-col items-end">
            <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : '-'}{formatCurrency(movement.amount, movement.currency?.symbol)}
            </span>
            {movement.exchange_rate && (
              <span className="text-xs text-muted-foreground">
                @ {movement.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="finances-movements-tab">
      <Table
        columns={columns}
        data={movements}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay movimientos',
          description: 'No se encontraron movimientos financieros unificados.',
        }}
        defaultSort={{
          key: 'payment_date',
          direction: 'desc',
        }}
        rowActions={(movement: UnifiedMovementWithRelations) => [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => handleEdit(movement),
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDelete(movement),
            variant: 'destructive' as const,
          },
        ]}
      />
    </div>
  );
}
