import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
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
        // Invalidar también la lista de subcontratos del proyecto
        queryClient.invalidateQueries({ queryKey: ['subcontracts', subcontract.project_id] });
      }
    });
  };

  const getStatusBadge = (status: string, bidId?: string) => {
    // Si es la oferta ganadora, mostrar badge especial
    if (bidId && subcontract?.winner_bid_id === bidId) {
      return (
        <Badge variant="default" className="text-xs" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
          <Trophy className="h-3 w-3 mr-1" />
          Ganadora
        </Badge>
      );
    }
    
    // Si hay una oferta ganadora y esta no es la ganadora, mostrar como rechazada
    if (subcontract?.winner_bid_id && bidId && subcontract.winner_bid_id !== bidId) {
      return (
        <Badge variant="secondary" className="text-xs">
          No seleccionada
        </Badge>
      );
    }
    
    // Estados normales cuando no hay ganadora aún
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      received: { label: 'Recibida', variant: 'default' as const },
      withdrawn: { label: 'Retirada', variant: 'destructive' as const },
      rejected: { label: 'Rechazada', variant: 'destructive' as const },
      awarded: { label: 'Adjudicada', variant: 'default' as const }
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

  // Ordenar ofertas: ganadora primero, luego por monto
  const sortedBids = useMemo(() => {
    if (!subcontractBids.length) return [];
    
    return [...subcontractBids].sort((a, b) => {
      // Si hay ganadora, ponerla primera
      if (subcontract?.winner_bid_id === a.id) return -1;
      if (subcontract?.winner_bid_id === b.id) return 1;
      
      // Luego ordenar por monto (menor a mayor)
      const amountA = a.amount || 0;
      const amountB = b.amount || 0;
      return amountA - amountB;
    });
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
      render: (item: any) => getStatusBadge(item.status, item.id)
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards - Solo mostrar si hay ofertas */}
      {subcontractBids.length > 0 && kpiData && (
        <>
          {/* Primera fila: Oferta Ganadora (2 cols) + Ahorro vs Más Alta + vs Promedio */}
          {kpiData.winningBid && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Oferta Ganadora - 2 columnas */}
              <Card className="border-yellow-200 bg-yellow-50/50 md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5" style={{ color: 'var(--accent)' }} />
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
                      <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
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

              {/* Ahorro vs Más Alta - 1 columna */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Ahorro vs Más Alta</p>
                      <DollarSign className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    
                    <div className="h-8 flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: 'var(--accent)',
                            width: kpiData.winnerVsHighest && kpiData.winnerVsHighest.percentage < 0 
                              ? `${Math.min(100, Math.abs(kpiData.winnerVsHighest.percentage) * 2)}%` 
                              : '5%' 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xl font-bold">
                        {kpiData.winnerVsHighest && kpiData.winnerVsHighest.amount < 0 
                          ? formatCurrency(Math.abs(kpiData.winnerVsHighest.amount), 'ARS')
                          : '$ 0'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsHighest && kpiData.winnerVsHighest.percentage < 0
                          ? `${Math.abs(kpiData.winnerVsHighest.percentage).toFixed(1)}% de ahorro total`
                          : 'Sin ahorro disponible'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* vs Promedio - 1 columna */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">vs Promedio</p>
                      <TrendingUp className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    
                    <div className="h-8 relative">
                      <svg className="w-full h-full" viewBox="0 0 100 32">
                        <line x1="50" y1="0" x2="50" y2="32" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
                        <line 
                          x1="0" y1="16" x2="100" y2="16" 
                          stroke="var(--accent)" 
                          strokeWidth="2" 
                          opacity="0.5"
                        />
                        <circle 
                          cx={kpiData.winnerVsAverage && kpiData.winnerVsAverage.amount < 0 ? "30" : "70"} 
                          cy="16" 
                          r="3" 
                          fill="var(--accent)" 
                        />
                      </svg>
                    </div>
                    
                    <div>
                      <p className="text-xl font-bold">
                        {kpiData.winnerVsAverage 
                          ? (kpiData.winnerVsAverage.amount < 0 ? '-' : '+') + 
                            formatCurrency(Math.abs(kpiData.winnerVsAverage.amount), 'ARS')
                          : '$ 0'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kpiData.winnerVsAverage 
                          ? `${Math.abs(kpiData.winnerVsAverage.percentage).toFixed(1)}% ${
                              kpiData.winnerVsAverage.amount < 0 ? 'por debajo' : 'por encima'
                            } del promedio`
                          : 'Igual al promedio'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grid de KPIs Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Ofertas */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total Ofertas</p>
                    <Users className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Mini Chart - Bar chart simple */}
                  <div className="flex items-end gap-1 h-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm flex-1"
                        style={{
                          backgroundColor: 'var(--accent)',
                          height: `${Math.max(20, Math.random() * 100)}%`,
                          opacity: i < kpiData.validBids ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold">{kpiData.totalBids}</p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.validBids} con monto válido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oferta Más Baja */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Oferta Más Baja</p>
                    <TrendingDown className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Mini Chart - Trend line */}
                  <div className="h-8 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 32">
                      <path
                        d="M 0,20 Q 25,10 50,15 T 100,8"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        fill="none"
                        className="opacity-80"
                      />
                      <circle cx="100" cy="8" r="2" fill="var(--accent)" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold" >
                      {formatCurrency(kpiData.lowestAmount, 'ARS')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.winnerVsLowest ? 
                        `${kpiData.winnerVsLowest.percentage.toFixed(1)}% vs ganadora` :
                        'Mejor oferta disponible'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promedio */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Promedio</p>
                    <Target className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Mini Chart - Area chart */}
                  <div className="h-8 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 32">
                      <path
                        d="M 0,25 Q 20,15 40,18 T 80,12 L 100,10 L 100,32 L 0,32 Z"
                        fill="var(--accent)"
                        className="opacity-20"
                      />
                      <path
                        d="M 0,25 Q 20,15 40,18 T 80,12 L 100,10"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold" >
                      {formatCurrency(kpiData.averageAmount, 'ARS')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.winnerVsAverage ? 
                        `${kpiData.winnerVsAverage.percentage.toFixed(1)}% vs ganadora` :
                        'Promedio de todas las ofertas'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rango de Ofertas */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Rango de Ofertas</p>
                    <BarChart3 className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Mini Chart - Range indicator */}
                  <div className="h-8 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="h-2 rounded-full relative"
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          width: '100%' 
                        }}
                      >
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--accent)' }}></div>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--accent)' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold" >
                      {formatCurrency(kpiData.spread, 'ARS')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.spreadPercentage.toFixed(1)}% diferencia total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


        </>
      )}

      {/* Tabla de ofertas */}
      {sortedBids.length === 0 ? (
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
          data={sortedBids}
          columns={columns}
          rowActions={(item) => {
            const actions = [];
            if (subcontract?.winner_bid_id !== item.id) {
              actions.push({
                icon: Trophy,
                label: 'Seleccionar como ganadora',
                onClick: () => handleSelectWinner(item)
              });
            }
            actions.push(
              {
                icon: Edit,
                label: 'Editar oferta',
                onClick: () => handleEditBid(item)
              },
              {
                icon: Trash2,
                label: 'Eliminar oferta',
                onClick: () => handleDeleteBid(item),
                variant: 'destructive' as const
              }
            );
            return actions;
          }}
        />
      )}
    </div>
  );
}