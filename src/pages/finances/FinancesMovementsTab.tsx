import React, { useMemo } from 'react';
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
import { DollarSign, Edit, Trash2, Paperclip, User, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';
import type { UnifiedMovementWithRelations } from '@/features/finances/services/getUnifiedMovements';

const MOVEMENT_TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string;
  modalType: string;
  icon: typeof User;
}> = {
  client_payment: { 
    label: 'Pago Cliente', 
    color: 'bg-green-600',
    modalType: 'client-payment',
    icon: User,
  },
  material_payment: { 
    label: 'Pago Material', 
    color: 'bg-orange-600',
    modalType: 'material-payment',
    icon: Package,
  },
  personnel_payment: { 
    label: 'Pago Personal', 
    color: 'bg-blue-600',
    modalType: 'personnel-payment',
    icon: Users,
  },
  partner_contribution: { 
    label: 'Aporte Socio', 
    color: 'bg-emerald-600',
    modalType: 'partner-contribution',
    icon: TrendingUp,
  },
  partner_withdrawal: { 
    label: 'Retiro Socio', 
    color: 'bg-rose-600',
    modalType: 'partner-withdrawal',
    icon: TrendingDown,
  },
};

export function FinancesMovementsTab() {
  const { currentOrganizationId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  // No filtrar por proyecto - mostrar todos los movimientos de la organización
  const { data: rawMovements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId || undefined,
    undefined
  );

  // Sort by payment_date DESC, then by created_at DESC
  const movements = useMemo(() => {
    return [...rawMovements].sort((a, b) => {
      const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      if (dateComparison !== 0) return dateComparison;
      // Si las fechas son iguales, ordenar por fecha de creación (más recientes primero)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [rawMovements]);

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
      width: '10%',
      render: (movement) => {
        const date = parseLocalDate(movement.payment_date);
        return date ? format(date, 'dd/MM/yyyy') : '-';
      },
    },
    {
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      width: '12%',
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
      width: '10%',
      render: (movement) => {
        const config = MOVEMENT_TYPE_CONFIG[movement.movement_type] || {
          label: movement.movement_type,
          color: 'bg-gray-600',
          icon: DollarSign,
        };
        return (
          <Badge className={`text-xs ${config.color} text-white border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'entity_name',
      label: 'Entidad',
      sortable: true,
      width: '15%',
      render: (movement) => {
        const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
        const IconComponent = config?.icon || DollarSign;
        const entityName = movement.entity_name;
        
        if (!entityName) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        return (
          <div className="flex items-center gap-2 min-w-0">
            <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium" title={entityName}>
              {entityName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Detalle',
      sortable: true,
      width: '12%',
      render: (movement) => (
        <div className="flex items-center gap-1.5 min-w-0">
          {movement.has_attachments && (
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span 
            className="font-medium block truncate" 
            title={movement.description || '-'}
          >
            {movement.description || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'currency',
      label: 'Moneda',
      sortable: true,
      width: '8%',
      render: (movement) => (
        <span className="text-sm">{movement.currency?.code || '-'}</span>
      ),
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      width: '10%',
      render: (movement) => (
        <span className="text-sm truncate" title={movement.wallet?.name}>{movement.wallet?.name || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number',
      width: '13%',
      align: 'right',
      render: (movement) => {
        const isPositive = movement.signed_amount >= 0;
        return (
          <div className="flex flex-col items-end">
            <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : '-'}{formatCurrency(movement.amount, movement.currency?.symbol)}
            </span>
            {movement.exchange_rate && (
              <span className="text-[10px] text-muted-foreground">
                Cot. {movement.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
