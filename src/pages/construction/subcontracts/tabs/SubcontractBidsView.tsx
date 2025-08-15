import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubcontractBidsViewProps {
  subcontract: any;
}

export function SubcontractBidsView({ subcontract }: SubcontractBidsViewProps) {
  const { openModal } = useGlobalModalStore();
  
  // TODO: Implementar hook para obtener las ofertas
  const subcontractBids = []; // Placeholder hasta implementar el hook

  const handleAddBid = () => {
    openModal('subcontract-bid-form', {
      subcontract_id: subcontract.id,
      mode: 'create'
    });
  };

  const handleEditBid = (bid: any) => {
    openModal('subcontract-bid-form', {
      subcontract_id: subcontract.id,
      bid_id: bid.id,
      mode: 'edit',
      initialData: bid
    });
  };

  const handleDeleteBid = (bid: any) => {
    // TODO: Implementar eliminación de oferta
    console.log('Delete bid:', bid.id);
  };

  const handleViewBid = (bid: any) => {
    // TODO: Implementar vista detallada de oferta
    console.log('View bid:', bid.id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      received: { label: 'Recibida', variant: 'default' as const },
      withdrawn: { label: 'Retirada', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount || !currency) return '—';
    
    const formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  };

  const columns = [
    {
      key: 'supplier_name',
      label: 'Proveedor',
      render: (item: any) => (
        <div>
          <p className="font-medium text-sm">
            {item.supplier_name || 'Sin nombre'}
          </p>
          {item.supplier_email && (
            <p className="text-xs text-muted-foreground">{item.supplier_email}</p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item: any) => getStatusBadge(item.status)
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (item: any) => (
        <span className="text-sm font-medium">
          {item.total_amount ? formatCurrency(item.total_amount, item.currency_code) : '—'}
        </span>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.currency_code || 'Sin moneda'}
        </Badge>
      )
    },
    {
      key: 'received_at',
      label: 'Fecha de Recepción',
      render: (item: any) => (
        <span className="text-sm text-muted-foreground">
          {item.received_at 
            ? format(new Date(item.received_at), 'dd/MM/yyyy HH:mm', { locale: es })
            : '—'
          }
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewBid(item)}
            title="Ver detalle"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditBid(item)}
            title="Editar oferta"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteBid(item)}
            title="Eliminar oferta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tabla de ofertas */}
      {subcontractBids.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="Sin ofertas recibidas"
          description="Las ofertas de los proveedores aparecerán aquí una vez que sean enviadas o registradas manualmente"
          action={
            <Button onClick={handleAddBid}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Oferta
            </Button>
          }
        />
      ) : (
        <Table
          data={subcontractBids}
          columns={columns}
          searchKey="supplier_name"
          searchPlaceholder="Buscar por proveedor..."
        />
      )}
    </div>
  );
}