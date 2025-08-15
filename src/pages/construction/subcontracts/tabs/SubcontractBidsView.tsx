import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  
  // Obtener ofertas del subcontrato usando React Query
  const { data: subcontractBids = [], isLoading } = useQuery({
    queryKey: ['subcontract-bids', subcontract?.id],
    queryFn: async () => {
      const response = await fetch(`/api/subcontract-bids/${subcontract.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      return response.json();
    },
    enabled: !!subcontract?.id,
    staleTime: 0 // Always fetch fresh data
  });

  // Invalidar cache después de cambios
  const invalidateBids = () => {
    queryClient.invalidateQueries({ queryKey: ['subcontract-bids', subcontract?.id] });
  };

  const handleAddBid = () => {
    openModal('subcontract-bid', {
      subcontractId: subcontract.id,
      isEditing: false,
      onSuccess: () => {
        invalidateBids(); // Refresh the list after creating
      }
    });
  };

  const handleEditBid = (bid: any) => {
    openModal('subcontract-bid', {
      subcontractId: subcontract.id,
      bidId: bid.id,
      isEditing: true,
      initialData: bid,
      onSuccess: () => {
        invalidateBids(); // Refresh the list after editing
      }
    });
  };

  const handleDeleteBid = (bid: any) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Oferta',
      message: `¿Estás seguro de que quieres eliminar la oferta de ${bid.contacts?.company_name || bid.contacts?.full_name || 'este proveedor'}?`,
      mode: 'dangerous',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/subcontract-bids/${bid.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            invalidateBids(); // Refresh the list
          } else {
            console.error('Error deleting bid');
          }
        } catch (error) {
          console.error('Error deleting bid:', error);
        }
      }
    });
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
      label: 'Subcontratista',
      render: (item: any) => (
        <div>
          <p className="font-medium text-sm">
            {item.contacts?.company_name || item.contacts?.full_name || 
             `${item.contacts?.first_name || ''} ${item.contacts?.last_name || ''}`.trim() || 'Sin nombre'}
          </p>
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
          {item.amount ? formatCurrency(item.amount, item.currencies?.code) : '—'}
        </span>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.currencies?.code || 'Sin moneda'}
        </Badge>
      )
    },
    {
      key: 'received_at',
      label: 'Fecha de Recepción',
      render: (item: any) => (
        <span className="text-sm text-muted-foreground">
          {item.submitted_at 
            ? format(new Date(item.submitted_at), 'dd/MM/yyyy', { locale: es })
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
        />
      )}
    </div>
  );
}