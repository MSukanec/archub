import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, FileText, Trophy, TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3, Award } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface SubcontractBidsViewProps {
  subcontract: any;
}

export function SubcontractBidsView({ subcontract }: SubcontractBidsViewProps) {
  const { openModal } = useGlobalModalStore();
  const queryClient = useQueryClient();
  
  // Obtener ofertas del subcontrato usando React Query
  const { data: subcontractBids = [], isLoading, refetch } = useQuery({
    queryKey: ['subcontract-bids', subcontract?.id],
    queryFn: async () => {
      console.log('Fetching bids for subcontract:', subcontract.id);
      const response = await fetch(`/api/subcontract-bids/${subcontract.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      const data = await response.json();
      console.log('Bids fetched:', data);
      return data;
    },
    enabled: !!subcontract?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Invalidar cache después de cambios
  const invalidateBids = () => {
    console.log('Invalidating bids cache for:', subcontract?.id);
    queryClient.invalidateQueries({ queryKey: ['subcontract-bids', subcontract?.id] });
    // También forzar refetch inmediato
    refetch();
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

  const handleSelectWinner = (bid: any) => {
    openModal('subcontract-award', {
      subcontract,
      winningBid: bid,
      onSuccess: () => {
        invalidateBids(); // Refresh the list
        // También invalidar el subcontrato para actualizar el estado
        queryClient.invalidateQueries({ queryKey: ['subcontract', subcontract.id] });
      }
    });
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

  // Cálculos para KPIs
  const kpiData = useMemo(() => {
    if (subcontractBids.length === 0) return null;

    const winningBid = subcontractBids.find((bid: any) => bid.id === subcontract?.winner_bid_id);
    const validBids = subcontractBids.filter((bid: any) => bid.amount && bid.amount > 0);
    
    if (validBids.length === 0) return null;

    const amounts = validBids.map((bid: any) => bid.amount);
    const lowestAmount = Math.min(...amounts);
    const highestAmount = Math.max(...amounts);
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    // Calcular diferencias si hay oferta ganadora
    let winnerVsLowest = null;
    let winnerVsAverage = null;
    let winnerVsHighest = null;
    
    if (winningBid && winningBid.amount) {
      winnerVsLowest = {
        amount: winningBid.amount - lowestAmount,
        percentage: ((winningBid.amount - lowestAmount) / lowestAmount) * 100
      };
      winnerVsAverage = {
        amount: winningBid.amount - averageAmount,
        percentage: ((winningBid.amount - averageAmount) / averageAmount) * 100
      };
      winnerVsHighest = {
        amount: winningBid.amount - highestAmount,
        percentage: ((winningBid.amount - highestAmount) / highestAmount) * 100
      };
    }

    return {
      winningBid,
      totalBids: subcontractBids.length,
      validBids: validBids.length,
      lowestAmount,
      highestAmount,
      averageAmount,
      spread: highestAmount - lowestAmount,
      spreadPercentage: ((highestAmount - lowestAmount) / lowestAmount) * 100,
      winnerVsLowest,
      winnerVsAverage,
      winnerVsHighest
    };
  }, [subcontractBids, subcontract?.winner_bid_id]);

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
      key: 'received_at',
      label: 'Fecha',
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
      key: 'currency',
      label: 'Moneda',
      render: (item: any) => (
        <Badge variant="outline" className="text-xs">
          {item.currencies?.code || 'Sin moneda'}
        </Badge>
      )
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
      key: 'status',
      label: 'Estado',
      render: (item: any) => getStatusBadge(item.status)
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          {/* Mostrar si es ganadora */}
          {subcontract?.winner_bid_id === item.id ? (
            <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600">
              <Trophy className="h-3 w-3 mr-1" />
              Ganadora
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
              onClick={() => handleSelectWinner(item)}
              title="Seleccionar como ganadora"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          )}
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
      {/* KPI Cards - Solo mostrar si hay ofertas */}
      {subcontractBids.length > 0 && kpiData && (
        <>
          {/* Card de Oferta Ganadora */}
          {kpiData.winningBid && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Oferta Ganadora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subcontratista</p>
                    <p className="font-medium">
                      {kpiData.winningBid.contacts?.company_name || 
                       kpiData.winningBid.contacts?.full_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monto</p>
                    <p className="font-bold text-lg text-yellow-700">
                      {formatCurrency(kpiData.winningBid.amount, kpiData.winningBid.currencies?.code)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {kpiData.winningBid.submitted_at 
                        ? format(new Date(kpiData.winningBid.submitted_at), 'dd/MM/yyyy', { locale: es })
                        : '—'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid de KPIs Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Ofertas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ofertas</p>
                    <p className="text-2xl font-bold">{kpiData.totalBids}</p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.validBids} con monto válido
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Oferta Más Baja */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Oferta Más Baja</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(kpiData.lowestAmount, 'ARS')}
                    </p>
                    {kpiData.winnerVsLowest && (
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsLowest.amount > 0 ? '+' : ''}
                        {kpiData.winnerVsLowest.percentage.toFixed(1)}% vs ganadora
                      </p>
                    )}
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Promedio */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(kpiData.averageAmount, 'ARS')}
                    </p>
                    {kpiData.winnerVsAverage && (
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsAverage.amount > 0 ? '+' : ''}
                        {kpiData.winnerVsAverage.percentage.toFixed(1)}% vs ganadora
                      </p>
                    )}
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Diferencia Mayor-Menor */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rango de Ofertas</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(kpiData.spread, 'ARS')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.spreadPercentage.toFixed(1)}% diferencia
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPIs adicionales si hay ganadora */}
          {kpiData.winningBid && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ahorro vs Más Alta</p>
                      <p className="text-xl font-bold text-green-600">
                        {kpiData.winnerVsHighest && kpiData.winnerVsHighest.amount < 0 
                          ? formatCurrency(Math.abs(kpiData.winnerVsHighest.amount), 'ARS')
                          : '$ 0'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsHighest && kpiData.winnerVsHighest.percentage < 0
                          ? `${Math.abs(kpiData.winnerVsHighest.percentage).toFixed(1)}% menos`
                          : 'Sin ahorro'
                        }
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">vs Promedio</p>
                      <p className={`text-xl font-bold ${
                        kpiData.winnerVsAverage && kpiData.winnerVsAverage.amount < 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {kpiData.winnerVsAverage 
                          ? (kpiData.winnerVsAverage.amount < 0 ? '-' : '+') + 
                            formatCurrency(Math.abs(kpiData.winnerVsAverage.amount), 'ARS')
                          : '$ 0'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsAverage 
                          ? `${kpiData.winnerVsAverage.percentage.toFixed(1)}% ${
                              kpiData.winnerVsAverage.amount < 0 ? 'menor' : 'mayor'
                            }`
                          : 'Igual al promedio'
                        }
                      </p>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${
                      kpiData.winnerVsAverage && kpiData.winnerVsAverage.amount < 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Posición</p>
                      <p className="text-xl font-bold text-yellow-600">
                        #{subcontractBids
                          .filter((bid: any) => bid.amount && bid.amount > 0)
                          .sort((a: any, b: any) => a.amount - b.amount)
                          .findIndex((bid: any) => bid.id === kpiData.winningBid.id) + 1
                        } de {kpiData.validBids}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winningBid.amount === kpiData.lowestAmount 
                          ? 'Oferta más económica' 
                          : 'No es la más baja'
                        }
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Tabla de ofertas */}
      {subcontractBids.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="Sin ofertas recibidas"
          description="Las ofertas de los proveedores aparecerán aquí una vez que sean enviadas o registradas manualmente."
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