import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign, Calendar, Building, Wallet, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { FILTER_ICONS, FILTER_LABELS, ACTION_ICONS, ACTION_LABELS } from '@/constants/actionBarConstants';
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Table } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubcontractKPICard } from '@/components/charts/SubcontractKPICard';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function FinancesSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del ActionBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('dolarizado'); // Por defecto dolarizado
  const [activeTab, setActiveTab] = useState('summary');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(userData?.preferences?.last_project_id || null);

  // Query para obtener los pagos de subcontratos
  const { data: subcontractPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subcontract-payments', userData?.preferences?.last_project_id],
    queryFn: async () => {
      if (!userData?.preferences?.last_project_id || !userData?.organization?.id) return [];
      
      const { data, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          id,
          movement:movements!inner(
            id,
            movement_date,
            amount,
            exchange_rate,
            currency:currencies!inner(id, name, code, symbol),
            wallet:organization_wallets!inner(
              wallets!inner(id, name)
            )
          ),
          subcontract:subcontracts!inner(
            id,
            title,
            contact:contacts!inner(id, first_name, last_name, full_name)
          )
        `)
        .eq('movement.project_id', userData.preferences.last_project_id)
        .eq('movement.organization_id', userData.organization.id)
        .order('movement(movement_date)', { ascending: false });

      if (error) {
        console.error('Error fetching subcontract payments:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        movement_date: item.movement.movement_date,
        amount: item.movement.amount,
        exchange_rate: item.movement.exchange_rate || 1,
        subcontract_title: item.subcontract.title,
        contact_name: item.subcontract.contact?.full_name || 
          `${item.subcontract.contact?.first_name || ''} ${item.subcontract.contact?.last_name || ''}`.trim(),
        wallet_name: item.movement.wallet?.wallets?.name || 'Sin billetera',
        currency_name: item.movement.currency.name,
        currency_symbol: item.movement.currency.symbol,
        currency_code: item.movement.currency.code
      }));
    },
    enabled: !!userData?.preferences?.last_project_id && !!userData?.organization?.id
  });



  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  // Función para convertir montos según la vista de moneda
  const convertAmount = (amountARS: number, amountUSD: number, currencyCode: string) => {
    if (currencyView === 'discriminado') {
      return currencyCode === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return amountARS; // Siempre mostrar en ARS
    } else if (currencyView === 'dolarizado') {
      return amountUSD; // Siempre mostrar en USD
    }
    return amountARS;
  };

  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      return formatCurrency(convertedAmount, originalCurrency === 'USD' ? 'US$' : '$');
    } else if (currencyView === 'pesificado') {
      return formatCurrency(convertedAmount, '$');
    } else if (currencyView === 'dolarizado') {
      return formatCurrency(convertedAmount, 'US$');
    }
    return formatCurrency(convertedAmount, '$');
  };

  // Combinar subcontratos con su análisis financiero
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.id === subcontract.id);
    return {
      ...subcontract,
      analysis
    };
  });

  // Calcular KPIs de subcontratos
  const totalSubcontracts = enrichedSubcontracts.length;
  const completedSubcontracts = enrichedSubcontracts.filter(s => s.status === 'completado').length;
  const pendingSubcontracts = enrichedSubcontracts.filter(s => s.status === 'pendiente').length;
  
  const totalContractValue = enrichedSubcontracts.reduce((sum, s) => {
    if (currencyView === 'dolarizado') {
      return sum + ((s.amount_total || 0) / (s.exchange_rate || 1));
    }
    return sum + (s.amount_total || 0);
  }, 0);
  
  const totalPaid = enrichedSubcontracts.reduce((sum, s) => {
    if (currencyView === 'dolarizado') {
      return sum + (s.analysis?.pagoALaFechaUSD || 0);
    }
    return sum + (s.analysis?.pagoALaFecha || 0);
  }, 0);
  
  const totalPending = enrichedSubcontracts.reduce((sum, s) => {
    if (currencyView === 'dolarizado') {
      return sum + (s.analysis?.saldoUSD || 0);
    }
    return sum + (s.analysis?.saldo || 0);
  }, 0);
  
  const averageContractValue = totalSubcontracts > 0 ? totalContractValue / totalSubcontracts : 0;

  // Columnas de la tabla
  const columns = [
    {
      key: 'title',
      label: 'Título',
      render: (subcontract: any) => (
        <div className="font-medium">{subcontract.title}</div>
      )
    },
    {
      key: 'contact',
      label: 'Proveedor',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        if (!contact) return '-';
        
        const contactName = contact.full_name || 
          `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        
        return (
          <div>
            <div className="font-medium">{contactName}</div>
            {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
          </div>
        );
      }
    },
    {
      key: 'amount_total',
      label: 'Monto Total',
      render: (subcontract: any) => {
        const amountARS = subcontract.amount_total || 0;
        const amountUSD = amountARS / (subcontract.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'pago_fecha',
      label: 'Pago a la Fecha',
      render: (subcontract: any) => {
        const pagoARS = subcontract.analysis?.pagoALaFecha || 0;
        const pagoUSD = subcontract.analysis?.pagoALaFechaUSD || 0;
        return formatSingleCurrency(pagoARS, pagoUSD, 'ARS'); // Los pagos siempre en moneda mixta
      }
    },
    {
      key: 'saldo',
      label: 'Diferencia',
      render: (subcontract: any) => {
        const saldoARS = subcontract.analysis?.saldo || 0;
        const saldoUSD = subcontract.analysis?.saldoUSD || 0;
        const formattedSaldo = formatSingleCurrency(saldoARS, saldoUSD, 'ARS');
        
        // Determinar el color basado en el valor del saldo
        const saldoValue = currencyView === 'dolarizado' ? saldoUSD : saldoARS;
        let colorClass = '';
        
        if (saldoValue > 0) {
          colorClass = 'text-green-600'; // Positivo - verde
        } else if (saldoValue < 0) {
          colorClass = 'text-red-600'; // Negativo - rojo
        } else {
          colorClass = 'text-yellow-600'; // Neutro - amarillo
        }
        
        return (
          <span className={`font-medium ${colorClass}`}>
            {formattedSaldo}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Estado',
      render: (subcontract: any) => {
        const status = subcontract.status;
        let badgeStyle = {};
        let displayText = '';
        
        switch (status) {
          case 'completado':
          case 'completed':
            badgeStyle = { 
              backgroundColor: '#22c55e', // Verde
              color: 'white',
              border: 'none'
            };
            displayText = 'Completado';
            break;
          case 'pendiente':
          case 'pending':
            badgeStyle = { 
              backgroundColor: '#eab308', // Amarillo
              color: 'white',
              border: 'none'
            };
            displayText = 'Pendiente';
            break;
          case 'activo':
          case 'active':
            badgeStyle = { 
              backgroundColor: '#3b82f6', // Azul
              color: 'white',
              border: 'none'
            };
            displayText = 'Activo';
            break;
          case 'cancelado':
          case 'cancelled':
            badgeStyle = { 
              backgroundColor: '#ef4444', // Rojo
              color: 'white',
              border: 'none'
            };
            displayText = 'Cancelado';
            break;
          default:
            badgeStyle = { 
              backgroundColor: '#f3f4f6', 
              color: '#374151',
              border: '1px solid #d1d5db'
            };
            displayText = status || 'Sin estado';
        }
        
        return (
          <Badge style={badgeStyle} className="border-0">
            {displayText}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (subcontract: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('subcontract', {
                projectId: userData?.preferences?.last_project_id,
                organizationId: userData?.organization?.id,
                userId: userData?.user?.id,
                subcontractId: subcontract.id,
                isEditing: true
              });
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Subcontrato',
                description: `¿Estás seguro de que deseas eliminar el subcontrato "${subcontract.title}"?`,
                confirmText: 'Eliminar',
                mode: 'dangerous',
                onConfirm: () => {
                  deleteSubcontract.mutate(subcontract.id);
                }
              });
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  // Columnas para la tabla de pagos
  const paymentsColumns = [
    {
      key: 'subcontract_title',
      label: 'Subcontrato',
      width: '20%',
      render: (payment: any) => (
        <div className="font-medium">{payment.subcontract_title}</div>
      )
    },
    {
      key: 'movement_date',
      label: 'Fecha',
      width: '12%',
      render: (payment: any) => {
        return format(new Date(payment.movement_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'contact_name',
      label: 'Proveedor',
      width: '16%',
      render: (payment: any) => (
        <div className="font-medium">{payment.contact_name}</div>
      )
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
      render: (payment: any) => {
        const amountARS = payment.amount;
        const amountUSD = payment.amount / payment.exchange_rate;
        const originalCurrency = payment.currency_code === 'USD' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      width: '12%',
      render: (payment: any) => (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          {payment.wallet_name}
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '10%',
      render: (payment: any) => (
        <Badge variant="outline">
          {payment.currency_symbol} {payment.currency_name}
        </Badge>
      )
    },
    {
      key: 'exchange_rate',
      label: 'T.C.',
      width: '8%',
      render: (payment: any) => (
        <div className="text-sm text-muted-foreground">
          {payment.exchange_rate.toFixed(2)}
        </div>
      )
    }
  ];

  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    
    // Buscar en el nombre del contacto usando la misma lógica de renderizado
    const contact = subcontract.contact;
    const contactName = contact?.full_name || 
      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const contactMatch = contactName?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  // Filtrar pagos por búsqueda
  const filteredPayments = subcontractPayments.filter(payment => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = payment.subcontract_title?.toLowerCase().includes(searchLower);
    const contactMatch = payment.contact_name?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  // Configurar tabs para el header
  const headerTabs = [
    {
      id: 'summary',
      label: 'Resumen de Subcontratos',
      isActive: activeTab === 'summary'
    },
    {
      id: 'payments',
      label: 'Detalle de Pagos',
      isActive: activeTab === 'payments'
    }
  ];

  const headerProps = {
    title: "Subcontratos",
    tabs: headerTabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout 
      wide={false}
      headerProps={headerProps}
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubcontractKPICard
            title="Total Subcontratos"
            value={totalSubcontracts}
            icon={<Building className="h-4 w-4" />}
            color="var(--chart-1)"
            isLoading={isLoading}
            formatter={(val) => val.toString()}
            currencyCode="QTY"
          />
          
          <SubcontractKPICard
            title="Valor Total Contratado"
            value={totalContractValue}
            icon={<DollarSign className="h-4 w-4" />}
            color="var(--chart-positive)"
            isLoading={isLoading}
            formatter={(val) => formatCurrency(val, currencyView === 'dolarizado' ? 'US$' : '$')}
            currencyCode={currencyView === 'dolarizado' ? 'USD' : 'ARS'}
          />
          
          <SubcontractKPICard
            title="Total Pagado"
            value={totalPaid}
            icon={<CheckCircle className="h-4 w-4" />}
            color="var(--chart-2)"
            isLoading={isLoading}
            formatter={(val) => formatCurrency(val, currencyView === 'dolarizado' ? 'US$' : '$')}
            currencyCode={currencyView === 'dolarizado' ? 'USD' : 'ARS'}
          />
          
          <SubcontractKPICard
            title="Diferencia Pendiente"
            value={totalPending}
            icon={<AlertTriangle className="h-4 w-4" />}
            color={totalPending > 0 ? "var(--chart-positive)" : totalPending < 0 ? "var(--chart-negative)" : "var(--chart-neutral)"}
            isLoading={isLoading}
            formatter={(val) => formatCurrency(val, currencyView === 'dolarizado' ? 'US$' : '$')}
            currencyCode={currencyView === 'dolarizado' ? 'USD' : 'ARS'}
          />
        </div>

        {/* ActionBar */}
        <ActionBarDesktopRow
          filters={[
            {
              key: 'currency',
              title: 'Moneda',
              label: FILTER_LABELS.CURRENCY,
              icon: FILTER_ICONS.CURRENCY,
              value: currencyView === 'pesificado' ? 'Peso Argentino' : 'Dólar Estadounidense',
              setValue: (value) => {
                if (value === 'Peso Argentino') setCurrencyView('pesificado')
                else setCurrencyView('dolarizado')
              },
              options: ['Peso Argentino', 'Dólar Estadounidense'],
              defaultLabel: 'Dólar Estadounidense'
            }
          ]}
          actions={[
            {
              label: 'Crear Subcontrato',
              icon: ACTION_ICONS.NEW,
              onClick: handleCreateSubcontract,
              variant: 'default'
            }
          ]}
        />

        {/* Contenido condicional por tab */}
        {activeTab === 'summary' && (
          filteredSubcontracts.length === 0 && !isLoading && !isLoadingAnalysis ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-muted-foreground" />}
              title="Aún no tienes subcontratos creados"
              description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
            />
          ) : (
            <div className="space-y-4">
              <Table
                columns={columns}
                data={filteredSubcontracts}
                isLoading={isLoading || isLoadingAnalysis}
                className="bg-card"
                defaultSort={{ key: 'title', direction: 'asc' }}
              />
            </div>
          )
        )}

        {activeTab === 'payments' && (
          filteredPayments.length === 0 && !isLoadingPayments ? (
            <EmptyState
              icon={<DollarSign className="w-12 h-12 text-muted-foreground" />}
              title="Aún no hay pagos registrados"
              description="Los pagos a subcontratistas aparecerán aquí una vez que se registren movimientos financieros asociados a los subcontratos."
            />
          ) : (
            <div className="space-y-4">
              <Table
                columns={paymentsColumns}
                data={filteredPayments}
                isLoading={isLoadingPayments}
                className="bg-card"
                defaultSort={{ key: 'movement_date', direction: 'desc' }}
              />
            </div>
          )
        )}
      </div>
    </Layout>
  );
}